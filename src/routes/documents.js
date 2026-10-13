// Documents and their dates: the passport, the car's insurance and inspection, a warranty. The things that
// are forgotten because they come round once a year or once in ten.
//
// A document is a title, what kind it is, the day it runs out, and when to be reminded before that day
// (several times: a passport wants three months' notice, and a word on the day). A picture of it can be
// kept with it.
//
// "Scan": a picture is read by the AI service and what it found is OFFERED, never stored. The person sees
// the picture beside the fields, corrects them and confirms; only then is the document saved, and it is on
// record that a person confirmed it (reviewed_at). A document that came from a scan cannot be created
// without that confirmation: a date misread by a machine would be a reminder on the wrong day, which is
// worse than none.
//
// Pictures are kept in the database (see the note on room in schema.sql): a few per document, small, and
// with a ceiling per person and for everybody together. Only their owner is ever served one.
//
// A PDF can be kept too, as the file it is. Reading one is the page's work: it draws the first page as a
// picture and sends that to be read, so the server reads pictures only. A PDF is a program-like format: it
// is stored only if it is plainly a PDF without scripts or actions, and it is only ever handed back as a
// download, never opened inside this site.

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
const MAX_PDF_BYTES = 2097152; // a PDF cannot be made smaller here: 2 MB, or the page keeps a picture of its first page instead
const MAX_FILES_PER_DOCUMENT = 2; // a front and a back
const MAX_DOCUMENTS = 200;
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

/**
 * A PDF from the client, as bytes. Not a proof that the file is harmless: the header and the end are where
 * the format puts them, and the names that make a PDF do things by itself (scripts, launching, forms that
 * send) do not occur in it. Such names can be hidden inside compressed parts, which is why a stored PDF is
 * never opened inside this site (see the route that serves it).
 */
function pdf(input, field = 'file') {
  const tooLarge = () => Object.assign(new ValidationError('The PDF is too large. At most 2 MB.', { [field]: 'Too large' }), { status: 413 });
  if (typeof input.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.data)) throw new ValidationError('That file is not a PDF.', { [field]: 'Not a PDF' });
  if (input.data.length > Math.ceil((MAX_PDF_BYTES * 4) / 3) + 8) throw tooLarge();
  const bytes = Buffer.from(input.data, 'base64');
  if (bytes.length > MAX_PDF_BYTES) throw tooLarge();
  const head = bytes.subarray(0, 8).toString('latin1');
  const tail = bytes.subarray(Math.max(0, bytes.length - 1024)).toString('latin1');
  if (!/^%PDF-[12]\.\d/.test(head) || !tail.includes('%%EOF')) throw new ValidationError('That file is not a PDF.', { [field]: 'Not a PDF' });
  if (/\/(JavaScript|JS|Launch|SubmitForm|ImportData|EmbeddedFile|RichMedia|XFA)\b/.test(bytes.toString('latin1'))) {
    throw new ValidationError('This PDF contains scripts, forms or attachments and cannot be stored. Take a photo of the document instead.', { [field]: 'Not accepted' });
  }
  return { contentType: 'application/pdf', bytes };
}

/** What may be kept with a document: a picture, or a PDF. */
function keptFile(input, field = 'file') {
  return input !== null && typeof input === 'object' && input.contentType === 'application/pdf' ? pdf(input, field) : picture(input, field);
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
    reference: d.reference,
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

/** Stores a picture with a document, inside the caller's transaction, within the three ceilings. */
async function storeFile(ownerId, documentId, { contentType, bytes }) {
  // The ceilings are sums over many rows: everybody who adds a picture waits here for the one before.
  await db.get("SELECT pg_advisory_xact_lock(hashtext('document_files_total'))");
  const have = (await db.get('SELECT COUNT(*) AS n FROM document_files WHERE document_id = ?', [documentId])).n;
  if (have >= MAX_FILES_PER_DOCUMENT) throw new ValidationError(`A document holds at most ${MAX_FILES_PER_DOCUMENT} files.`, { file: 'Too many' });
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
      room: { usedBytes: used, maxBytes: maxUserBytes(), maxFileBytes: MAX_FILE_BYTES, maxPdfBytes: MAX_PDF_BYTES, maxFilesPerDocument: MAX_FILES_PER_DOCUMENT },
      scan: { available: ai.isConfigured() && !ai.userAiDisabled(req.user) },
    });
  })
);

// Reads a picture and OFFERS what it found. Nothing is stored here: neither the picture nor the answer.
router.post(
  '/scan',
  asyncRoute(async (req, res) => {
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);
    if (!ai.isConfigured()) return res.json({ ok: false, error: 'Reading a picture needs the AI service, which is not set up here. You can type the details in yourself.' });
    const file = picture((req.body || {}).file);
    const key = `scan|${req.user.id}`;
    if (await scanLimit.consume(key)) {
      res.set('Retry-After', String(await scanLimit.retryAfterSeconds(key)));
      return res.status(429).json({ ok: false, error: 'You have scanned a lot in the last hour. Try again later, or type the details in yourself.' });
    }
    const result = await ai.readDocument({ contentType: file.contentType, data: file.bytes.toString('base64'), today: todayISO() });
    if (!result.ok) return res.json(result);
    res.json({ ok: true, suggestion: checkedSuggestion(result.data) });
  })
);

/**
 * What the AI read is a guess. Here it is made harmless (only known kinds, only real dates, short texts) and
 * every doubt is put into words for the person who is about to check it. Nothing here makes it trustworthy.
 */
function checkedSuggestion(raw) {
  const warnings = [];
  const short = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ').slice(0, max) : null);
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
  if (!partial || b.reference !== undefined) out.reference = text(b.reference, 'reference', 'The number', 60);
  if (!partial || b.issuedOn !== undefined) out.issued_on = date(b.issuedOn, 'issuedOn', 'The date of issue');
  if (!partial || b.expiresOn !== undefined) out.expires_on = date(b.expiresOn, 'expiresOn', 'The expiry date');
  if (!partial || b.notes !== undefined) out.notes = text(b.notes, 'notes', 'The note', 1000);
  return out;
}

router.post(
  '/',
  txRoute(async (req, res) => {
    const b = req.body || {};
    const f = fieldsFrom(b);
    if (f.issued_on && f.expires_on && f.expires_on <= f.issued_on) throw new ValidationError('The expiry date must be after the date of issue.', { expiresOn: 'Check the dates' });
    const source = b.source === 'scan' ? 'scan' : 'manual';
    // What a machine read is saved only after a person said they checked it.
    if (source === 'scan' && b.reviewed !== true) throw new ValidationError('Check what was read from the picture and confirm it before saving.', { reviewed: 'Required' });
    const file = b.file === undefined || b.file === null ? null : keptFile(b.file);

    const count = (await db.get('SELECT COUNT(*) AS n FROM documents WHERE owner_id = ?', [req.user.id])).n;
    if (count >= MAX_DOCUMENTS) throw new ValidationError(`You can keep at most ${MAX_DOCUMENTS} documents. Remove one you no longer need.`);

    const made = await db.run(
      `INSERT INTO documents (owner_id, title, kind, issuer, reference, issued_on, expires_on, reminder_days, notes, source, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${source === 'scan' ? "datetime('now')" : 'NULL'})`,
      [req.user.id, f.title, f.kind, f.issuer, f.reference, f.issued_on, f.expires_on, JSON.stringify(reminderDays(b.reminderDays, f.kind)), f.notes, source]
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
    const id = await storeFile(req.user.id, doc.id, keptFile((req.body || {}).file));
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
    const isPdf = row.content_type === 'application/pdf';
    res.set({
      'Content-Type': row.content_type,
      'Cache-Control': 'private, no-store',
      // A picture is shown; a PDF is handed over as a file to save, never opened inside this site.
      'Content-Disposition': isPdf ? `attachment; filename="document-${Number(req.params.id)}.pdf"` : 'inline',
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
