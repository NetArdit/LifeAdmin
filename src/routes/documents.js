// Documents and their dates: the passport, the car's insurance and inspection, a warranty. The things that
// are forgotten because they come round once a year or once in ten.
//
// A document is a title, what kind it is, the day it runs out, and when to be reminded before that day
// (several times: a passport wants three months' notice, and a word on the day). A picture of it can be
// kept with it. No number of the document is kept: a reminder needs none, and a passport number in a table
// is a risk without a use.
//
// "Scan": a picture is read by the AI service and what it found is OFFERED, never stored. The person sees
// the picture beside the fields, corrects them and confirms; only then is the document saved.
//
// What "confirmed" means here, exactly:
//   - reading a picture needs the person's consent to send it to the named provider, each time;
//   - each reading gets a ticket (document_scans) that belongs to that person, is good for an hour and for
//     one document. Saving "from a scan" needs that ticket, so what is recorded as scanned and confirmed
//     really followed a scan by that person;
//   - the confirmation names the last day of validity it is for. If the date being saved is not the date
//     that was confirmed, the save is refused: the date cannot change between the tick and the save;
//   - a document typed in by hand is a different thing and is recorded as such. Nothing can stop somebody
//     from reading a suggestion and typing it in by hand; that is typing, and it is their own account.
// No software can know that a person really looked. This makes sure they were asked, about the right date.
//
// Pictures are kept in the database (see the note on room in schema.sql): a few per document, small, and
// with a ceiling per person and for everybody together. Only their owner is ever served one. A PDF is never
// stored: the page draws its first page as a picture, and that picture is what is read and kept.

const crypto = require('crypto');
const express = require('express');
const db = require('../db');
const { asyncRoute, txRoute } = require('../middleware/errorHandler');
const { isNonEmpty, isDate, ValidationError } = require('../lib/validate');
const { daysUntil, todayISO } = require('../lib/dates');
const { replanDocument, forget: forgetReminders, DOCUMENT_REMINDER_DAYS } = require('../lib/reminders');
const { isWholePicture, PICTURE_TYPES } = require('../lib/imageCheck');
const { createLimiter } = require('../lib/ratelimit');
const ai = require('../lib/ai');

const router = express.Router();

const KINDS = ['passport', 'id_card', 'driving_licence', 'vehicle_registration', 'vehicle_inspection', 'insurance', 'warranty', 'contract', 'subscription', 'medical', 'other'];
// When to be reminded, in days before the last day, when the person did not say: longer notice for what
// takes weeks to renew.
const DEFAULT_REMINDER_DAYS = {
  passport: [90, 30, 7],
  id_card: [60, 14, 0],
  driving_licence: [60, 14, 0],
  vehicle_registration: [30, 7, 0],
  vehicle_inspection: [30, 7, 0],
  insurance: [30, 7, 0],
  warranty: [30, 7],
  contract: [30, 7],
  subscription: [7, 0],
  medical: [30, 7],
  other: [30, 7, 0],
};

const MAX_FILE_BYTES = 1048576; // 1 MB each: the page makes a picture small before sending it
const MAX_FILES_PER_DOCUMENT = 2; // a front and a back
const MAX_DOCUMENTS = 200;
const SCAN_TICKET_MINUTES = 60;
const megabytes = (name, fallback) => (Number(process.env[name]) > 0 ? Number(process.env[name]) : fallback) * 1048576;
const maxUserBytes = () => megabytes('DOCUMENTS_MAX_MB_PER_USER', 20);
const maxTotalBytes = () => megabytes('DOCUMENTS_MAX_MB_TOTAL', 200);

// Reading a picture costs the AI service's free allowance: a person gets a fair share of it.
const scanLimit = createLimiter({ name: 'documentScan', windowMs: 60 * 60 * 1000, max: 12 });

const text = (value, field, label, max) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new ValidationError(`${label} is not valid.`, { [field]: 'Invalid' });
  const s = value.trim();
  if (s.length > max) throw new ValidationError(`${label} is too long.`, { [field]: `At most ${max} characters` });
  return s || null;
};
const date = (value, field, label) => {
  if (value === undefined || value === null || value === '') return null;
  if (!isDate(value)) throw new ValidationError(`${label} is not a valid date.`, { [field]: 'Use a real date (YYYY-MM-DD)' });
  return value;
};
function reminderDays(value, kind) {
  if (value === undefined || value === null) return DEFAULT_REMINDER_DAYS[kind];
  if (!Array.isArray(value) || value.length > DOCUMENT_REMINDER_DAYS.length || value.some((d) => !DOCUMENT_REMINDER_DAYS.includes(d))) {
    throw new ValidationError('Invalid reminder choice.', { reminderDays: 'Invalid' });
  }
  return [...new Set(value)].sort((a, b) => b - a);
}

/** A picture from the client, as bytes, or a ValidationError. */
function picture(input, field = 'file') {
  if (input === null || typeof input !== 'object' || !PICTURE_TYPES.includes(input.contentType) || typeof input.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.data)) {
    throw new ValidationError('That file is not a JPEG, PNG or WebP picture.', { [field]: 'Not a picture' });
  }
  if (input.data.length > Math.ceil((MAX_FILE_BYTES * 4) / 3) + 8) throw Object.assign(new ValidationError('The picture is too large. At most 1 MB.', { [field]: 'Too large' }), { status: 413 });
  const bytes = Buffer.from(input.data, 'base64');
  if (bytes.length > MAX_FILE_BYTES) throw Object.assign(new ValidationError('The picture is too large. At most 1 MB.', { [field]: 'Too large' }), { status: 413 });
  if (!isWholePicture(bytes, input.contentType)) throw new ValidationError('That file is not a JPEG, PNG or WebP picture.', { [field]: 'Not a picture' });
  return { contentType: input.contentType, bytes };
}

function stateOf(doc) {
  if (doc.status === 'archived') return 'archived';
  if (!doc.expires_on) return 'undated';
  const left = daysUntil(doc.expires_on);
  if (left < 0) return 'expired';
  return left <= 30 ? 'soon' : 'valid';
}

function mapDocument(d, files = []) {
  return {
    id: d.id,
    title: d.title,
    kind: d.kind,
    issuer: d.issuer,
    issuedOn: d.issued_on,
    expiresOn: d.expires_on,
    daysLeft: d.expires_on ? daysUntil(d.expires_on) : null,
    state: stateOf(d),
    reminderDays: JSON.parse(d.reminder_days),
    notes: d.notes,
    source: d.source,
    reviewedAt: d.reviewed_at,
    status: d.status,
    files: files.filter((f) => f.document_id === d.id).map((f) => ({ id: f.id, contentType: f.content_type, sizeBytes: f.size_bytes, url: `/api/documents/${d.id}/files/${f.id}` })),
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

const filesOf = (ownerId) => db.all('SELECT id, document_id, content_type, size_bytes FROM document_files WHERE owner_id = ? ORDER BY id', [ownerId]);
const mine = (req) => db.get('SELECT * FROM documents WHERE id = ? AND owner_id = ?', [Number(req.params.id) || 0, req.user.id]);
const ticketHash = (ticket) => crypto.createHash('sha256').update(String(ticket)).digest('hex');

/** Stores a picture with a document, inside the caller's transaction, within the three ceilings. */
async function storeFile(ownerId, documentId, { contentType, bytes }) {
  // The ceilings are sums over many rows: everybody who adds a picture waits here for the one before.
  await db.get("SELECT pg_advisory_xact_lock(hashtext('document_files_total'))");
  const have = (await db.get('SELECT COUNT(*) AS n FROM document_files WHERE document_id = ?', [documentId])).n;
  if (have >= MAX_FILES_PER_DOCUMENT) throw new ValidationError(`A document holds at most ${MAX_FILES_PER_DOCUMENT} pictures.`, { file: 'Too many' });
  const own = (await db.get('SELECT COALESCE(SUM(size_bytes), 0) AS n FROM document_files WHERE owner_id = ?', [ownerId])).n;
  if (Number(own) + bytes.length > maxUserBytes()) throw new ValidationError('Your room for pictures of documents is full. Remove pictures you no longer need.', { file: 'No room' });
  const all = (await db.get('SELECT COALESCE(SUM(size_bytes), 0) AS n FROM document_files')).n;
  if (Number(all) + bytes.length > maxTotalBytes()) throw new ValidationError('No more pictures can be stored for now. The document itself and its reminders are not affected.', { file: 'No room' });
  return (await db.run('INSERT INTO document_files (document_id, owner_id, content_type, size_bytes, data_base64) VALUES (?, ?, ?, ?, ?)', [documentId, ownerId, contentType, bytes.length, bytes.toString('base64')])).lastInsertRowid;
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    // What runs out first comes first; what has no date, last.
    const rows = await db.all(
      "SELECT * FROM documents WHERE owner_id = ? ORDER BY (status = 'archived'), (expires_on IS NULL), expires_on ASC, id DESC",
      [req.user.id]
    );
    const files = await filesOf(req.user.id);
    const used = files.reduce((n, f) => n + f.size_bytes, 0);
    res.json({
      documents: rows.map((d) => mapDocument(d, files)),
      kinds: KINDS,
      defaultReminderDays: DEFAULT_REMINDER_DAYS,
      reminderDayChoices: DOCUMENT_REMINDER_DAYS,
      room: { usedBytes: used, maxBytes: maxUserBytes(), maxFileBytes: MAX_FILE_BYTES, maxFilesPerDocument: MAX_FILES_PER_DOCUMENT },
      // Who would be sent the picture: the page names them before anything is sent.
      scan: { available: ai.isConfigured() && !ai.userAiDisabled(req.user), provider: ai.providerName() },
    });
  })
);

// Reads a picture and OFFERS what it found. Neither the picture nor what was read is stored here: only a
// ticket that says this person had a picture read just now (and which dates were offered, to be able to
// tell later whether the person changed them).
router.post(
  '/scan',
  asyncRoute(async (req, res) => {
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);
    if (!ai.isConfigured()) return res.json({ ok: false, error: 'Reading a picture needs the AI service, which is not set up here. You can type the details in yourself.' });
    const b = req.body || {};
    // The picture leaves this site for another company's. Not without the person saying so, each time.
    if (b.consent !== true) throw new ValidationError(`Confirm that the picture may be sent to ${ai.providerName()} to be read.`, { consent: 'Required' });
    const file = picture(b.file);
    const key = `scan|${req.user.id}`;
    if (await scanLimit.consume(key)) {
      res.set('Retry-After', String(await scanLimit.retryAfterSeconds(key)));
      return res.status(429).json({ ok: false, error: 'You have scanned a lot in the last hour. Try again later, or type the details in yourself.' });
    }
    const result = await ai.readDocument({ contentType: file.contentType, data: file.bytes.toString('base64'), today: todayISO() });
    if (!result.ok) return res.json(result);
    const suggestion = checkedSuggestion(result.data);
    const ticket = crypto.randomBytes(24).toString('base64url');
    await db.run('INSERT INTO document_scans (user_id, ticket_hash, provider, offered_expires_on, offered_issued_on) VALUES (?, ?, ?, ?, ?)', [
      req.user.id,
      ticketHash(ticket),
      ai.providerName(),
      suggestion.expiresOn,
      suggestion.issuedOn,
    ]);
    res.json({ ok: true, suggestion, ticket, provider: ai.providerName() });
  })
);

/**
 * What the AI read is a guess. Here it is made harmless (only known kinds, only real dates, short texts with
 * no long runs of digits) and every doubt is put into words for the person who is about to check it.
 * Nothing here makes it trustworthy.
 */
function checkedSuggestion(raw) {
  const warnings = [];
  // The model is told to leave numbers out. If it did not, a run of digits (a document or personal number)
  // does not get into a name.
  const short = (v, max) => (typeof v === 'string' && v.trim() ? v.replace(/\d[\d\s./-]{4,}\d/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) || null : null);
  const day = (v, label) => {
    if (v === null || v === undefined || v === '') return null;
    if (isDate(v)) return v;
    warnings.push(`The ${label} could not be read as a date. Enter it from the document.`);
    return null;
  };
  const out = {
    kind: KINDS.includes(raw.kind) ? raw.kind : 'other',
    title: short(raw.title, 120),
    issuer: short(raw.issuer, 120),
    issuedOn: day(raw.issuedOn, 'date of issue'),
    expiresOn: day(raw.expiresOn, 'expiry date'),
  };
  if (!raw.readable) warnings.push('The picture was hard to read. Check every field against the document.');
  if (!out.expiresOn) warnings.push('No expiry date was found. Without one there is nothing to remind you of.');
  if (out.issuedOn && out.expiresOn && out.expiresOn <= out.issuedOn) warnings.push('The expiry date read is not after the date of issue: one of the two is probably wrong.');
  if (out.expiresOn && out.expiresOn < todayISO()) warnings.push('The expiry date read is already in the past. Check the year.');
  if (out.expiresOn && Number(out.expiresOn.slice(0, 4)) > Number(todayISO().slice(0, 4)) + 30) warnings.push('The expiry date read is more than thirty years away. Check the year.');
  for (const note of Array.isArray(raw.doubts) ? raw.doubts.slice(0, 4) : []) {
    const s = short(note, 160);
    if (s) warnings.push(s);
  }
  return { ...out, reminderDays: DEFAULT_REMINDER_DAYS[out.kind], warnings };
}

function fieldsFrom(b, { partial = false } = {}) {
  const out = {};
  if (!partial || b.title !== undefined) {
    if (!isNonEmpty(b.title)) throw new ValidationError('Give the document a name.', { title: 'Required' });
    out.title = text(b.title, 'title', 'The name', 120);
  }
  if (!partial || b.kind !== undefined) {
    if (b.kind !== undefined && !KINDS.includes(b.kind)) throw new ValidationError('Invalid kind of document.', { kind: 'Invalid' });
    out.kind = b.kind || 'other';
  }
  if (!partial || b.issuer !== undefined) out.issuer = text(b.issuer, 'issuer', 'The issuer', 120);
  if (!partial || b.issuedOn !== undefined) out.issued_on = date(b.issuedOn, 'issuedOn', 'The date of issue');
  if (!partial || b.expiresOn !== undefined) out.expires_on = date(b.expiresOn, 'expiresOn', 'The expiry date');
  if (!partial || b.notes !== undefined) out.notes = text(b.notes, 'notes', 'The note', 1000);
  return out;
}

/**
 * A document that is saved "from a scan": the ticket of a reading this person had done within the hour,
 * not used before, and a confirmation of the details and of this very date. Takes the ticket (one document
 * per reading). Answers the ticket's row, or throws.
 */
async function confirmedScan(userId, scan, expiresOn) {
  const again = () => new ValidationError('The reading of this picture is no longer valid. Scan the document again, or add it by hand.', { scan: 'Expired' });
  if (scan === null || typeof scan !== 'object' || typeof scan.ticket !== 'string') throw again();
  const confirmed = scan.confirmed;
  if (confirmed === null || typeof confirmed !== 'object' || confirmed.details !== true) {
    throw new ValidationError('Check what was read from the picture and confirm it before saving.', { confirmed: 'Required' });
  }
  // The date that was confirmed is the date that is saved, or nothing is saved. (null: "it has no last day".)
  if (!('expiresOn' in confirmed) || (confirmed.expiresOn ?? null) !== (expiresOn ?? null)) {
    throw new ValidationError('Confirm the last day of validity as it is now in the form.', { confirmed: 'The date changed after it was confirmed' });
  }
  const row = await db.get(
    `UPDATE document_scans SET used_at = datetime('now') WHERE user_id = ? AND ticket_hash = ? AND used_at IS NULL AND created_at > datetime('now', '-${SCAN_TICKET_MINUTES} minutes') RETURNING id, offered_expires_on`,
    [userId, ticketHash(scan.ticket)]
  );
  if (!row) throw again();
  return row;
}

router.post(
  '/',
  txRoute(async (req, res) => {
    const b = req.body || {};
    const f = fieldsFrom(b);
    if (f.issued_on && f.expires_on && f.expires_on <= f.issued_on) throw new ValidationError('The expiry date must be after the date of issue.', { expiresOn: 'Check the dates' });
    const file = b.file === undefined || b.file === null ? null : picture(b.file);

    const count = (await db.get('SELECT COUNT(*) AS n FROM documents WHERE owner_id = ?', [req.user.id])).n;
    if (count >= MAX_DOCUMENTS) throw new ValidationError(`You can keep at most ${MAX_DOCUMENTS} documents. Remove one you no longer need.`);

    // Where a document came from is decided by whether it carries a scan's ticket, never by a word from the client.
    const scan = b.scan === undefined || b.scan === null ? null : await confirmedScan(req.user.id, b.scan, f.expires_on);
    const made = await db.run(
      `INSERT INTO documents (owner_id, title, kind, issuer, issued_on, expires_on, reminder_days, notes, source, reviewed_at, expiry_as_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${scan ? "datetime('now')" : 'NULL'}, ?)`,
      [
        req.user.id,
        f.title,
        f.kind,
        f.issuer,
        f.issued_on,
        f.expires_on,
        JSON.stringify(reminderDays(b.reminderDays, f.kind)),
        f.notes,
        scan ? 'scan' : 'manual',
        // Whether the person kept the date the machine read, or corrected it: on record, for whoever asks later
        // how good the reading is.
        scan ? ((scan.offered_expires_on ?? null) === (f.expires_on ?? null) ? 1 : 0) : null,
      ]
    );
    const id = made.lastInsertRowid;
    if (file) await storeFile(req.user.id, id, file);
    await replanDocument(id);
    res.status(201).json({ document: mapDocument(await db.get('SELECT * FROM documents WHERE id = ?', [id]), await filesOf(req.user.id)) });
  })
);

router.patch(
  '/:id',
  txRoute(async (req, res) => {
    const doc = await mine(req);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });
    const b = req.body || {};
    const f = fieldsFrom(b, { partial: true });
    if (b.status !== undefined) {
      if (!['active', 'archived'].includes(b.status)) throw new ValidationError('Invalid status.', { status: 'Invalid' });
      f.status = b.status;
    }
    if (b.reminderDays !== undefined) f.reminder_days = JSON.stringify(reminderDays(b.reminderDays, f.kind || doc.kind));
    const issued = f.issued_on !== undefined ? f.issued_on : doc.issued_on;
    const expires = f.expires_on !== undefined ? f.expires_on : doc.expires_on;
    if (issued && expires && expires <= issued) throw new ValidationError('The expiry date must be after the date of issue.', { expiresOn: 'Check the dates' });
    const keys = Object.keys(f);
    if (keys.length) {
      await db.run(`UPDATE documents SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, [...keys.map((k) => f[k]), doc.id]);
    }
    await replanDocument(doc.id);
    res.json({ document: mapDocument(await db.get('SELECT * FROM documents WHERE id = ?', [doc.id]), await filesOf(req.user.id)) });
  })
);

router.delete(
  '/:id',
  txRoute(async (req, res) => {
    const doc = await mine(req);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });
    // Its pictures go with it (ON DELETE CASCADE), and so do its reminders.
    await db.run('DELETE FROM documents WHERE id = ?', [doc.id]);
    await forgetReminders('document', doc.id);
    res.json({ ok: true });
  })
);

router.post(
  '/:id/files',
  txRoute(async (req, res) => {
    const doc = await mine(req);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });
    const id = await storeFile(req.user.id, doc.id, picture((req.body || {}).file));
    res.status(201).json({ id, document: mapDocument(doc, await filesOf(req.user.id)) });
  })
);

// The picture itself: only to its owner, never kept by a shared cache, never read by the browser as anything
// but the kind of picture it is.
router.get(
  '/:id/files/:fileId',
  asyncRoute(async (req, res) => {
    const row = await db.get('SELECT content_type, data_base64 FROM document_files WHERE id = ? AND document_id = ? AND owner_id = ?', [Number(req.params.fileId) || 0, Number(req.params.id) || 0, req.user.id]);
    if (!row) return res.status(404).json({ error: 'Picture not found.' });
    res.set({
      'Content-Type': row.content_type,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(Buffer.from(row.data_base64, 'base64'));
  })
);

router.delete(
  '/:id/files/:fileId',
  asyncRoute(async (req, res) => {
    const done = await db.run('DELETE FROM document_files WHERE id = ? AND document_id = ? AND owner_id = ?', [Number(req.params.fileId) || 0, Number(req.params.id) || 0, req.user.id]);
    if (!done.changes) return res.status(404).json({ error: 'Picture not found.' });
    res.json({ ok: true });
  })
);

module.exports = router;
module.exports.KINDS = KINDS;
