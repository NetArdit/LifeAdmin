// Documents and their dates: kept by their owner alone, reminded of before they run out, and, when read from
// a picture by the AI, saved only after a person confirmed what was read.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const zlib = require('node:zlib');
const { startApp, makeClient, signUp } = require('./helpers');

// Counted from the day the application itself calls today (its own clock, not UTC): between midnight and
// the hour UTC catches up, the two differ by a day.
const { todayISO, addDays } = require('../src/lib/dates');
const ahead = (days) => addDays(todayISO(), days);

/** A small real PNG: every checksum right. */
function png(grey = 128, size = 8) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(zlib.crc32(body), body.length + 4);
    return out;
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0);
  head.writeUInt32BE(size, 4);
  head.set([8, 0, 0, 0, 0], 8);
  const raw = Buffer.alloc((size + 1) * size, grey);
  for (let y = 0; y < size; y++) raw[y * (size + 1)] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const file = (grey) => ({ contentType: 'image/png', data: png(grey).toString('base64') });
/** A reading the person agreed to. */
const scanOf = (grey) => ({ file: file(grey), consent: true });

test('documents and their dates', async (t) => {
  // The AI provider is a local stand-in: no picture leaves this machine.
  const seen = [];
  let answers = [];
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      seen.push(JSON.parse(body));
      const next = answers.shift() ?? { status: 500, content: '' };
      res.writeHead(next.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(next.status === 200 ? { choices: [{ message: { role: 'assistant', content: JSON.stringify(next.content) } }] } : { error: { message: 'provider detail' } }));
    });
  });
  await new Promise((r) => mock.listen(0, r));
  process.env.GROQ_API_KEY = 'gsk_test_key';
  process.env.GROQ_API_BASE = `http://127.0.0.1:${mock.address().port}/openai/v1`;
  delete process.env.ANTHROPIC_API_KEY;
  const app = await startApp();
  t.after(() => {
    mock.close();
    return app.close();
  });
  const db = require('../src/db');
  const worker = require('../src/lib/reminderWorker');

  const me = makeClient(app.base);
  const myId = (await signUp(me)).res.data.user.id;
  const other = makeClient(app.base);
  await signUp(other);
  const planned = (id) => db.all("SELECT rule_key, scheduled_at, status FROM planned_reminders WHERE source_type = 'document' AND source_id = ? ORDER BY scheduled_at", [id]);

  let passport;
  await t.test('a document typed in by hand is kept, with reminders on the days its kind asks for', async () => {
    const res = await me.post('/api/documents', { title: 'Pasaporta', kind: 'passport', issuer: 'MPB', issuedOn: '2020-03-01', expiresOn: ahead(200), notes: 'Në sirtar' });
    assert.equal(res.status, 201);
    passport = res.data.document;
    assert.deepEqual([passport.kind, passport.source, passport.reviewedAt, passport.state], ['passport', 'manual', null, 'valid']);
    assert.deepEqual(passport.reminderDays, [90, 30, 7]);
    assert.equal(passport.daysLeft, 200);
    assert.deepEqual((await planned(passport.id)).map((r) => [r.rule_key, r.status]), [['before:129600', 'pending'], ['before:43200', 'pending'], ['before:10080', 'pending']]);

    const list = (await me.get('/api/documents')).data;
    assert.equal(list.documents.length, 1);
    assert.ok(list.kinds.includes('warranty') && list.reminderDayChoices.includes(90));
    assert.equal(list.scan.available, true);
  });

  await t.test('what is not a document is refused: no name, dates that do not exist or run backwards, unknown kinds and reminder days', async () => {
    for (const bad of [
      { kind: 'passport', expiresOn: ahead(10) },
      { title: '   ' },
      { title: 'X', expiresOn: '2027-02-30' },
      { title: 'X', issuedOn: '2026-05-01', expiresOn: '2026-04-01' },
      { title: 'X', kind: 'spaceship' },
      { title: 'X', reminderDays: [5] },
      { title: 'X', reminderDays: 'soon' },
      { title: 'x'.repeat(121) },
      { title: 'X', file: { contentType: 'image/png', data: Buffer.from('<script>alert(1)</script>').toString('base64') } },
      { title: 'X', file: { contentType: 'image/svg+xml', data: 'AAAA' } },
      { title: 'X', file: { contentType: 'image/png', data: Buffer.concat([png(), Buffer.from('tail')]).toString('base64') } },
    ]) {
      assert.equal((await me.post('/api/documents', bad)).status, 400, JSON.stringify(bad).slice(0, 60));
    }
    assert.equal((await me.get('/api/documents')).data.documents.length, 1);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_files')).c, 0);
  });

  await t.test('only its owner sees, changes, removes a document or gets its picture', async () => {
    const withFile = (await me.post('/api/documents', { title: 'Sigurimi i veturës', kind: 'insurance', expiresOn: ahead(40), file: file(90) })).data.document;
    assert.equal(withFile.files.length, 1);
    const url = withFile.files[0].url;
    const got = await fetch(app.base + url, { headers: { cookie: me.cookie() } });
    assert.equal(got.status, 200);
    assert.equal(got.headers.get('content-type'), 'image/png');
    assert.equal(got.headers.get('x-content-type-options'), 'nosniff');
    assert.match(got.headers.get('cache-control'), /no-store/);
    assert.ok(Buffer.from(await got.arrayBuffer()).equals(png(90)));

    assert.equal((await other.get('/api/documents')).data.documents.length, 0);
    assert.equal((await fetch(app.base + url, { headers: { cookie: other.cookie() } })).status, 404);
    assert.equal((await fetch(app.base + url)).status, 401);
    assert.equal((await other.patch(`/api/documents/${withFile.id}`, { title: 'E imja tani' })).status, 404);
    assert.equal((await other.del(`/api/documents/${withFile.id}`)).status, 404);
    assert.equal((await other.post(`/api/documents/${withFile.id}/files`, { file: file(1) })).status, 404);
    assert.equal((await db.get('SELECT title FROM documents WHERE id = ?', [withFile.id])).title, 'Sigurimi i veturës');

    // A second picture (the back), and no third.
    assert.equal((await me.post(`/api/documents/${withFile.id}/files`, { file: file(91) })).status, 201);
    assert.equal((await me.post(`/api/documents/${withFile.id}/files`, { file: file(92) })).status, 400);
    // Removed with its pictures and its reminders.
    assert.equal((await me.del(`/api/documents/${withFile.id}`)).status, 200);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_files')).c, 0);
    assert.equal((await planned(withFile.id)).length, 0);
  });

  await t.test('a PDF is never stored: the page keeps a picture of its first page instead', async () => {
    const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n', 'latin1').toString('base64');
    const made = (await me.post('/api/documents', { title: 'Polica', kind: 'insurance', expiresOn: ahead(50) })).data.document;
    assert.equal((await me.post(`/api/documents/${made.id}/files`, { file: { contentType: 'application/pdf', data: pdf } })).status, 400);
    assert.equal((await me.post('/api/documents', { title: 'Polica 2', file: { contentType: 'application/pdf', data: pdf } })).status, 400);
    assert.equal((await me.post('/api/documents/scan', { file: { contentType: 'application/pdf', data: pdf }, consent: true })).status, 400);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_files')).c, 0);
    assert.equal((await me.del(`/api/documents/${made.id}`)).status, 200);
  });

  await t.test('renewed, the reminders move to the new date; archived or without a date, there are none', async () => {
    const later = ahead(600);
    const res = await me.patch(`/api/documents/${passport.id}`, { expiresOn: later, reminderDays: [30, 0] });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.document.reminderDays, [30, 0]);
    const rows = (await planned(passport.id)).filter((r) => r.status === 'pending');
    assert.deepEqual(rows.map((r) => r.rule_key), ['before:43200', 'before:0']);
    assert.ok(rows.every((r) => r.scheduled_at.slice(0, 4) === ahead(570).slice(0, 4) || r.scheduled_at > ahead(560)));

    await me.patch(`/api/documents/${passport.id}`, { status: 'archived' });
    assert.equal((await planned(passport.id)).filter((r) => r.status === 'pending').length, 0);
    await me.patch(`/api/documents/${passport.id}`, { status: 'active' });
    assert.equal((await planned(passport.id)).filter((r) => r.status === 'pending').length, 2);
    await me.patch(`/api/documents/${passport.id}`, { expiresOn: null });
    assert.equal((await planned(passport.id)).filter((r) => r.status === 'pending').length, 0);
    assert.equal((await me.get('/api/documents')).data.documents.find((d) => d.id === passport.id).state, 'undated');
  });

  await t.test('the reminder reaches the bell on its day, says which document, and is not sent twice', async () => {
    const doc = (await me.post('/api/documents', { title: 'Kontrolli teknik', kind: 'vehicle_inspection', expiresOn: ahead(20), reminderDays: [7, 0] })).data.document;
    const rows = await planned(doc.id);
    assert.equal(rows.length, 2);
    const first = await worker.runDue({ now: Date.parse(rows[0].scheduled_at) + 1000 });
    assert.equal(first.sent, 1);
    let bells = await db.all("SELECT title, body, link FROM notifications WHERE user_id = ? AND type = 'document' ORDER BY id", [myId]);
    assert.deepEqual(bells.map((b) => [b.title, b.link]), [['Reminder: a document expires soon', '#/documents']]);
    assert.match(bells[0].body, /Kontrolli teknik · valid until \d{4}-\d{2}-\d{2}/);
    await worker.runDue({ now: Date.parse(rows[1].scheduled_at) + 1000 });
    bells = await db.all("SELECT title FROM notifications WHERE user_id = ? AND type = 'document' ORDER BY id", [myId]);
    assert.deepEqual(bells.map((b) => b.title), ['Reminder: a document expires soon', 'Reminder: a document expires today']);
    assert.equal((await worker.runDue({ now: Date.parse(rows[1].scheduled_at) + 90000 })).claimed, 0);
  });

  await t.test('a picture is sent to be read only with the person\'s consent, and the page is told to whom', async () => {
    assert.equal((await me.get('/api/documents')).data.scan.provider, 'Groq');
    seen.length = 0;
    for (const consent of [undefined, false, 'true', 1]) {
      const res = await me.post('/api/documents/scan', { file: file(60), consent });
      assert.equal(res.status, 400, String(consent));
      assert.match(res.data.error, /sent to Groq/);
    }
    assert.equal(seen.length, 0, 'nothing left this server');
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_scans')).c, 0);
  });

  await t.test('a scan offers what was read and stores neither the picture nor the words: only a ticket', async () => {
    const before = (await db.get('SELECT COUNT(*) AS c FROM documents')).c;
    seen.length = 0;
    answers = [{ status: 200, content: { readable: true, kind: 'insurance', title: '  Sigurimi   kasko ', issuer: 'Sigal', issuedOn: '2026-01-15', expiresOn: ahead(95), doubts: [] } }];
    const res = await me.post('/api/documents/scan', scanOf(60));
    assert.equal(res.status, 200);
    assert.equal(res.data.ok, true);
    assert.equal(res.data.provider, 'Groq');
    assert.match(res.data.ticket, /^[A-Za-z0-9_-]{32}$/);
    assert.deepEqual(res.data.suggestion, { kind: 'insurance', title: 'Sigurimi kasko', issuer: 'Sigal', issuedOn: '2026-01-15', expiresOn: ahead(95), reminderDays: [30, 7, 0], warnings: [] });
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM documents')).c, before);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_files')).c, 0);
    // The ticket's row: who, to whom, the dates offered. Not the ticket itself, not the title, not the picture.
    const row = await db.get('SELECT * FROM document_scans WHERE user_id = ?', [myId]);
    assert.deepEqual([row.provider, row.offered_expires_on, row.offered_issued_on, row.used_at], ['Groq', ahead(95), '2026-01-15', null]);
    assert.ok(!JSON.stringify(row).includes(res.data.ticket) && !JSON.stringify(row).includes('kasko'));

    // What went to the provider: the picture as a data address, and the instruction to leave names and numbers out.
    assert.equal(seen.length, 1);
    const user = seen[0].messages[1].content;
    assert.equal(user[1].type, 'image_url');
    assert.ok(user[1].image_url.url.startsWith('data:image/png;base64,'));
    assert.match(seen[0].messages[0].content, /Never return the holder's name, a document number/);
    assert.notEqual(seen[0].model, 'llama-3.3-70b-versatile', 'a model that takes pictures');
  });

  await t.test('what the AI read is made harmless and every doubt is said: dates that do not exist, a past year, an unknown kind', async () => {
    answers = [{ status: 200, content: { readable: false, kind: 'insurance', title: 'x'.repeat(300), issuer: null, issuedOn: '15.01.2026', expiresOn: '2026-02-31', doubts: ['The year is partly covered by a stamp.'] } }];
    let s = (await me.post('/api/documents/scan', scanOf(61))).data.suggestion;
    assert.equal(s.title.length, 120);
    assert.deepEqual([s.issuedOn, s.expiresOn], [null, null]);
    assert.ok(s.warnings.some((w) => /hard to read/.test(w)));
    assert.ok(s.warnings.some((w) => /expiry date could not be read/.test(w)));
    assert.ok(s.warnings.some((w) => /date of issue could not be read/.test(w)));
    assert.ok(s.warnings.some((w) => /No expiry date/.test(w)));
    assert.ok(s.warnings.includes('The year is partly covered by a stamp.'));

    answers = [{ status: 200, content: { readable: true, kind: 'warranty', title: 'Garancia', issuer: null, issuedOn: '2024-05-01', expiresOn: '2023-05-01', doubts: [] } }];
    s = (await me.post('/api/documents/scan', scanOf(62))).data.suggestion;

    // A number the model returned although it was told not to does not get into the name.
    answers = [{ status: 200, content: { readable: true, kind: 'passport', title: 'Pasaporta P01234567', issuer: 'MPB 1234567890', issuedOn: null, expiresOn: ahead(900), doubts: [] } }];
    const clean = (await me.post('/api/documents/scan', scanOf(65))).data.suggestion;
    assert.deepEqual([clean.title, clean.issuer], ['Pasaporta P', 'MPB']);
    assert.ok(s.warnings.some((w) => /not after the date of issue/.test(w)));
    assert.ok(s.warnings.some((w) => /already in the past/.test(w)));

    // An answer of another shape (a kind that does not exist) is asked for once more, then refused: never passed on.
    answers = [{ status: 200, content: { readable: true, kind: 'spaceship', title: 'X', issuer: null, issuedOn: null, expiresOn: null, doubts: [] } }, { status: 200, content: { hello: 'world' } }];
    const refused = (await me.post('/api/documents/scan', scanOf(63))).data;
    assert.equal(refused.ticket, undefined);
    assert.equal(refused.ok, false);
    assert.equal(refused.suggestion, undefined);

    // The provider is down: a clear answer, and typing by hand still works.
    answers = [{ status: 503, content: '' }];
    const down = (await me.post('/api/documents/scan', scanOf(64))).data;
    assert.equal(down.ok, false);
    assert.doesNotMatch(down.error, /provider detail/);
  });

  await t.test('a document is saved "from a scan" only with that scan\'s ticket and a confirmation of the very date being saved', async () => {
    await db.run('DELETE FROM document_scans');
    const read = async (expiresOn) => {
      answers = [{ status: 200, content: { readable: true, kind: 'insurance', title: 'Sigurimi kasko', issuer: 'Sigal', issuedOn: null, expiresOn, doubts: [] } }];
      return (await me.post('/api/documents/scan', scanOf(60))).data;
    };
    const day = ahead(95);
    const { ticket } = await read(day);
    const fields = { title: 'Sigurimi kasko', kind: 'insurance', issuer: 'Sigal', expiresOn: day, file: file(60) };
    const refused = [
      { ticket },
      { ticket, confirmed: {} },
      { ticket, confirmed: { details: false, expiresOn: day } },
      { ticket, confirmed: { details: 'yes', expiresOn: day } },
      { ticket, confirmed: { details: true } },
      { ticket, confirmed: { details: true, expiresOn: ahead(96) } },
      { ticket, confirmed: { details: true, expiresOn: null } },
      { ticket: 'made-up-ticket-that-nobody-was-given', confirmed: { details: true, expiresOn: day } },
      { confirmed: { details: true, expiresOn: day } },
      'yes',
    ];
    for (const scan of refused) assert.equal((await me.post('/api/documents', { ...fields, scan })).status, 400, JSON.stringify(scan).slice(0, 70));
    // The date in the form was changed after it was confirmed: refused, although the confirmation was complete.
    assert.equal((await me.post('/api/documents', { ...fields, expiresOn: ahead(120), scan: { ticket, confirmed: { details: true, expiresOn: day } } })).status, 400);
    // Somebody else's ticket is nobody's ticket.
    assert.equal((await other.post('/api/documents', { ...fields, scan: { ticket, confirmed: { details: true, expiresOn: day } } })).status, 400);
    assert.equal((await db.get("SELECT COUNT(*) AS c FROM documents WHERE source = 'scan'")).c, 0);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_files')).c, 0);
    assert.equal((await db.get('SELECT used_at FROM document_scans')).used_at, null, 'a refused save does not use the ticket up');

    // The word "scan" from the client decides nothing: without a ticket this is a document typed by hand.
    const byHand = await me.post('/api/documents', { ...fields, source: 'scan', reviewed: true, file: undefined });
    assert.equal(byHand.status, 201);
    assert.deepEqual([byHand.data.document.source, byHand.data.document.reviewedAt], ['manual', null]);
    await me.del(`/api/documents/${byHand.data.document.id}`);

    const saved = await me.post('/api/documents', { ...fields, scan: { ticket, confirmed: { details: true, expiresOn: day } } });
    assert.equal(saved.status, 201);
    assert.equal(saved.data.document.source, 'scan');
    assert.ok(saved.data.document.reviewedAt);
    assert.equal(saved.data.document.files.length, 1);
    assert.equal((await planned(saved.data.document.id)).length, 3);
    assert.equal((await db.get('SELECT expiry_as_read FROM documents WHERE id = ?', [saved.data.document.id])).expiry_as_read, 1);
    // One reading, one document.
    assert.equal((await me.post('/api/documents', { ...fields, file: undefined, scan: { ticket, confirmed: { details: true, expiresOn: day } } })).status, 400);

    // The person corrected the date the machine read: saved with theirs, and on record that it differed.
    const second = await read(ahead(40));
    const corrected = await me.post('/api/documents', { title: 'Kontrolli teknik', kind: 'vehicle_inspection', expiresOn: ahead(45), scan: { ticket: second.ticket, confirmed: { details: true, expiresOn: ahead(45) } } });
    assert.equal(corrected.status, 201);
    assert.equal((await db.get('SELECT expiry_as_read FROM documents WHERE id = ?', [corrected.data.document.id])).expiry_as_read, 0);

    // A document that has no last day, confirmed as such.
    const third = await read(null);
    const undated = await me.post('/api/documents', { title: 'Kontrata e qirasë', kind: 'contract', expiresOn: null, scan: { ticket: third.ticket, confirmed: { details: true, expiresOn: null } } });
    assert.equal(undated.status, 201);
    assert.equal((await planned(undated.data.document.id)).length, 0);

    // A ticket is good for an hour.
    const late = await read(day);
    await db.run("UPDATE document_scans SET created_at = datetime('now', '-61 minutes') WHERE used_at IS NULL");
    assert.equal((await me.post('/api/documents', { ...fields, file: undefined, scan: { ticket: late.ticket, confirmed: { details: true, expiresOn: day } } })).status, 400);

    // The database itself refuses a scanned document that nobody confirmed, whoever writes the row.
    await assert.rejects(db.run("INSERT INTO documents (owner_id, title, source) VALUES (?, 'Pa konfirmim', 'scan')", [myId]));
    // And the clock sweeps old tickets away.
    await db.run("UPDATE document_scans SET created_at = datetime('now', '-2 days')");
    await worker.housekeeping();
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_scans')).c, 0);
  });

  await t.test('scanning is not for somebody who turned AI off, not without a picture, and not without end', async () => {
    assert.equal((await me.post('/api/documents/scan', { consent: true })).status, 400);
    assert.equal((await me.post('/api/documents/scan', { consent: true, file: { contentType: 'image/png', data: Buffer.from('not a picture').toString('base64') } })).status, 400);

    seen.length = 0;
    await other.patch('/api/settings/preferences', { aiEnabled: false });
    const off = (await other.post('/api/documents/scan', scanOf(1))).data;
    assert.equal(off.ok, false);
    assert.equal(seen.length, 0, 'nothing was sent to the provider');

    const { resetAllLimits } = require('../src/lib/authLimits');
    await resetAllLimits();
    await db.run("DELETE FROM rate_limits WHERE bucket = 'documentScan'");
    answers = Array.from({ length: 12 }, () => ({ status: 200, content: { readable: true, kind: 'other', title: 'X', issuer: null, issuedOn: null, expiresOn: null, doubts: [] } }));
    for (let i = 0; i < 12; i++) assert.equal((await me.post('/api/documents/scan', scanOf(i))).status, 200);
    seen.length = 0;
    const over = await me.post('/api/documents/scan', scanOf(99));
    assert.equal(over.status, 429);
    assert.equal(seen.length, 0);
  });

  await t.test('a person has a ceiling of room for pictures; the document itself is still saved without one', async () => {
    process.env.DOCUMENTS_MAX_MB_PER_USER = String((png(5).length * 1.5) / 1048576);
    try {
      const a = await other.post('/api/documents', { title: 'Garancia e lavatriçes', kind: 'warranty', expiresOn: ahead(300), file: file(5) });
      assert.equal(a.status, 201);
      const b = await other.post('/api/documents', { title: 'Garancia e frigoriferit', kind: 'warranty', expiresOn: ahead(300), file: file(5) });
      assert.equal(b.status, 400);
      assert.match(b.data.error, /room for pictures/);
      // Nothing of the refused one was kept, not even the document: all or nothing.
      assert.equal((await other.get('/api/documents')).data.documents.length, 1);
      assert.equal((await other.post('/api/documents', { title: 'Garancia e frigoriferit', kind: 'warranty', expiresOn: ahead(300) })).status, 201);
    } finally {
      delete process.env.DOCUMENTS_MAX_MB_PER_USER;
    }
  });

  await t.test('a backup carries documents and their pictures; an account that is deleted takes them along', async () => {
    const { exportBackup } = require('../src/lib/backup');
    const backup = await exportBackup();
    assert.ok(backup.tables.documents.length >= 3);
    assert.ok(backup.tables.document_files.length >= 2);
    assert.equal(backup.tables.document_scans, undefined, 'tickets of scans are not carried');
    assert.ok(!JSON.stringify(backup.tables.documents).includes('reference'));
    const mineBefore = (await db.get('SELECT COUNT(*) AS c FROM documents WHERE owner_id = ?', [myId])).c;
    assert.ok(mineBefore >= 2);
    await db.run('DELETE FROM users WHERE id = ?', [myId]);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM documents WHERE owner_id = ?', [myId])).c, 0);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM document_files WHERE owner_id = ?', [myId])).c, 0);
  });
});
