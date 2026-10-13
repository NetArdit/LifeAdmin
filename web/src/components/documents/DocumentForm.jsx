import { useEffect, useRef, useState } from 'react';
import { confirmDialog } from '../../../../public/js/components/confirm.js';
import { Icon } from '../Icon.jsx';
import { KIND_LABEL, REMINDER_DAY_LABEL } from './kinds.js';

// One form for three things: a document typed in by hand, one read from a picture, and an existing one.
//
// Read from a picture: the AI service looks at the picture and what it found is put into the fields. It is a
// guess. The picture stays beside the fields, every doubt is listed, and "Save" stays closed until the person
// ticks that they compared the dates with the document. Nothing was stored before that moment, neither the
// picture nor what was read; the server refuses a scanned document without the confirmation as well.

const LONG_SIDE = 1600;
// What the server takes at most, with room to spare. Base64 writes three bytes as four characters.
const MAX_BASE64 = Math.floor((1000000 * 4) / 3);

const MAX_PDF_BYTES = 2097152;
const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * The first page of a PDF, drawn on a canvas. The library that reads PDFs is large and is fetched only now,
 * from this site itself (public/vendor/pdfjs), never from another address.
 */
async function firstPageOfPdf(buffer) {
  const pdfjs = await import(/* @vite-ignore */ `${window.location.origin}/vendor/pdfjs/pdf.min.mjs`);
  // The fonts every PDF may use without carrying them, and the decoders of the compressed pictures inside
  // scanned PDFs, come from this site too.
  pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';
  // A copy: the library takes the bytes for itself, and the original is still needed to store the file.
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)), isEvalSupported: false, enableXfa: false, disableAutoFetch: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/', wasmUrl: '/vendor/pdfjs/wasm/' });
  const doc = await task.promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: LONG_SIDE / Math.max(base.width, base.height) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: g, viewport }).promise;
  const pages = doc.numPages;
  // The reading is over: its worker and memory are given back.
  await task.destroy();
  return { canvas, pages };
}

/**
 * What the person chose, made ready: a picture scaled down and written as JPEG
 * { contentType, data (base64), preview (a data address) }. For a PDF the picture is its first page, and
 * `original` is the PDF itself when it is small enough to be kept (`pages` says how many it has).
 */
async function prepared(file) {
  let canvas;
  let extra = {};
  if (isPdf(file)) {
    const buffer = await file.arrayBuffer();
    const drawn = await firstPageOfPdf(buffer);
    canvas = drawn.canvas;
    extra = { pages: drawn.pages, original: buffer.byteLength <= MAX_PDF_BYTES ? { contentType: 'application/pdf', data: toBase64(buffer) } : null, isPdf: true };
  } else {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const g = canvas.getContext('2d');
    // A picture with a clear background would turn black as JPEG: white goes under it first.
    g.fillStyle = '#fff';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
  }
  let url = '';
  // As good as fits: small print must stay legible, so quality comes down only as far as needed.
  for (const quality of [0.88, 0.78, 0.66, 0.52]) {
    url = canvas.toDataURL('image/jpeg', quality);
    if (url.length - url.indexOf(',') - 1 <= MAX_BASE64) break;
  }
  return { contentType: 'image/jpeg', data: url.slice(url.indexOf(',') + 1), preview: url, ...extra };
}

/** What is kept with the document: the PDF itself when there is one that fits, otherwise the picture. */
const toKeep = (made) => made.original || { contentType: made.contentType, data: made.data };

/** What to say under a chosen PDF. */
function pdfNote(made) {
  if (!made || !made.isPdf) return null;
  const read = made.pages > 1 ? `Only the first of its ${made.pages} pages is shown and read.` : 'This is its page.';
  return made.original ? `A PDF. ${read} The PDF itself is kept with the document.` : `A PDF. ${read} It is larger than 2 MB, so this picture of the page is kept instead of the file.`;
}

const empty = { title: '', kind: 'other', issuer: '', reference: '', issuedOn: '', expiresOn: '', notes: '' };

export function DocumentForm({ api, toast, mode, existing, options, onCancel, onDone }) {
  const [fields, setFields] = useState(() =>
    existing
      ? { title: existing.title, kind: existing.kind, issuer: existing.issuer || '', reference: existing.reference || '', issuedOn: existing.issuedOn || '', expiresOn: existing.expiresOn || '', notes: existing.notes || '' }
      : empty
  );
  const [days, setDays] = useState(() => (existing ? existing.reminderDays : options.defaultReminderDays.other));
  // Whether the person chose the reminder days themselves: until then they follow the kind.
  const [daysTouched, setDaysTouched] = useState(!!existing);
  const [picture, setPicture] = useState(null);
  const [keepPicture, setKeepPicture] = useState(true);
  // Scanning: 'choose' (no picture yet), 'ready' (picture chosen), 'reading', 'read' (fields offered).
  const [scan, setScan] = useState(mode === 'scan' ? 'choose' : null);
  const [warnings, setWarnings] = useState([]);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState(existing ? existing.files : []);
  const fileInput = useRef(null);
  const cameraInput = useRef(null);
  const titleInput = useRef(null);

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const fromScan = mode === 'scan';
  const showFields = !fromScan || scan === 'read';

  useEffect(() => {
    if (showFields && titleInput.current && !existing) titleInput.current.focus();
  }, [showFields, existing]);

  function changeKind(e) {
    const kind = e.target.value;
    setFields((f) => ({ ...f, kind }));
    if (!daysTouched) setDays(options.defaultReminderDays[kind] || []);
  }
  function toggleDay(d) {
    setDaysTouched(true);
    setDays((list) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d].sort((a, b) => b - a)));
  }

  async function choose(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const made = await prepared(file);
      if (made.data.length > MAX_BASE64) {
        toast('That picture is too detailed to store. Take it a little further away, or crop it.', 'error');
        return;
      }
      setPicture(made);
      if (fromScan) {
        setScan('ready');
        setReviewed(false);
        setWarnings([]);
      }
    } catch (err) {
      // Why, for whoever looks into it: the name of the failure, never the file.
      console.error('[documents] the chosen file could not be opened:', (err && (err.name + ': ' + err.message)) || 'error');
      toast('That file could not be opened. Choose a photo or a PDF.', 'error');
    }
  }

  async function read() {
    setScan('reading');
    try {
      const result = await api.post('/api/documents/scan', { file: { contentType: picture.contentType, data: picture.data } });
      if (!result.ok) {
        // The picture could not be read: the person types the details in, with the picture still beside them.
        toast(result.error, 'error');
        setWarnings(['The picture could not be read automatically. Enter the details from the document yourself.']);
        setScan('read');
        return;
      }
      const s = result.suggestion;
      setFields({ title: s.title || '', kind: s.kind, issuer: s.issuer || '', reference: '', issuedOn: s.issuedOn || '', expiresOn: s.expiresOn || '', notes: '' });
      setDays(s.reminderDays);
      setWarnings(s.warnings);
      setScan('read');
    } catch (err) {
      toast(err.message, 'error');
      setScan('ready');
    }
  }

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const body = {
      title: fields.title,
      kind: fields.kind,
      issuer: fields.issuer || null,
      reference: fields.reference || null,
      issuedOn: fields.issuedOn || null,
      expiresOn: fields.expiresOn || null,
      notes: fields.notes || null,
      reminderDays: days,
    };
    try {
      if (existing) {
        await api.patch(`/api/documents/${existing.id}`, body);
        onDone('Document saved');
      } else {
        if (fromScan) Object.assign(body, { source: 'scan', reviewed });
        if (picture && keepPicture) body.file = toKeep(picture);
        await api.post('/api/documents', body);
        onDone(fields.expiresOn ? 'Document saved. You will be reminded before it runs out.' : 'Document saved');
      }
    } catch (err) {
      toast(err.message, 'error');
      setBusy(false);
    }
  }

  async function addFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const made = await prepared(file);
      const res = await api.post(`/api/documents/${existing.id}/files`, { file: toKeep(made) });
      setFiles(res.document.files);
      toast(made.original ? 'PDF added' : 'Picture added', 'success');
    } catch (err) {
      toast(err.message || 'That file could not be added.', 'error');
    }
  }
  async function removeFile(f) {
    if (!(await confirmDialog({ title: 'Remove this picture?', message: 'The document and its reminders stay.', confirmLabel: 'Remove' }))) return;
    try {
      await api.del(`/api/documents/${existing.id}/files/${f.id}`);
      setFiles((list) => list.filter((x) => x.id !== f.id));
    } catch (err) {
      toast(err.message, 'error');
    }
  }
  async function archive(status) {
    try {
      await api.patch(`/api/documents/${existing.id}`, { status });
      onDone(status === 'archived' ? 'Archived: no more reminders for it' : 'Back among your documents');
    } catch (err) {
      toast(err.message, 'error');
    }
  }
  async function remove() {
    if (!(await confirmDialog({ title: 'Delete this document?', message: `"${existing.title}", its pictures and its reminders will be deleted for good.`, confirmLabel: 'Delete' }))) return;
    try {
      await api.del(`/api/documents/${existing.id}`);
      onDone('Document deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const heading = existing ? 'Document' : fromScan ? 'Scan a document' : 'Add a document';
  const canSave = !!fields.title.trim() && (!fromScan || reviewed) && !busy;

  return (
    <div className="card card-pad" style={{ marginBottom: 'var(--sp-4)' }}>
      <div className="card-header">
        <span className="card-title">{heading}</span>
        <button className="btn btn-sm" type="button" onClick={onCancel}>
          Close
        </button>
      </div>

      {fromScan && scan !== 'read' ? (
        <div className="stack">
          <p className="text-sm muted">
            Photograph the document with the camera, or choose a photo or a PDF you already have. It is sent to the AI service to be read, and then shown to you beside what was read. Nothing is
            saved until you have checked it and confirmed.
          </p>
          {picture ? <img src={picture.preview} alt="The document you chose" style={{ alignSelf: 'flex-start', maxWidth: '100%', maxHeight: 320, width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} /> : null}
          {pdfNote(picture) ? <p className="text-sm muted">{pdfNote(picture)}</p> : null}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            {/* capture: on a phone this opens the camera itself. The phone's own camera takes the photo, so the
                site never asks for access to the camera. On a computer it is an ordinary file chooser. */}
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={choose} hidden />
            <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={choose} hidden />
            <button className="btn" type="button" disabled={scan === 'reading'} onClick={() => cameraInput.current.click()}>
              Use the camera
            </button>
            <button className="btn" type="button" disabled={scan === 'reading'} onClick={() => fileInput.current.click()}>
              Choose a photo or PDF
            </button>
            {picture ? (
              <button className="btn btn-primary" type="button" disabled={scan === 'reading'} onClick={read}>
                {scan === 'reading' ? (
                  <>
                    <span className="spinner" /> Reading…
                  </>
                ) : (
                  'Read the document'
                )}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showFields ? (
        <form className="stack" onSubmit={save}>
          {fromScan ? (
            <div className="stack" role="status">
              <p className="text-sm" style={{ fontWeight: 600 }}>
                This was read from the picture by a machine. Compare each field with the document, above all the dates.
              </p>
              {warnings.length ? (
                <ul className="text-sm" style={{ margin: 0, paddingLeft: 'var(--sp-4)', color: 'var(--warning-600)' }}>
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}
              {picture ? <img src={picture.preview} alt="The document you chose" style={{ alignSelf: 'flex-start', maxWidth: '100%', maxHeight: 420, width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} /> : null}
              {pdfNote(picture) ? <p className="text-sm muted">{pdfNote(picture)}</p> : null}
            </div>
          ) : null}

          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="doc-title">Name</label>
              <input id="doc-title" ref={titleInput} className="input" maxLength={120} required value={fields.title} onChange={set('title')} placeholder="e.g. Car insurance" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="doc-kind">Kind</label>
              <select id="doc-kind" className="select" value={fields.kind} onChange={changeKind}>
                {options.kinds.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k] || k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="doc-expires">Valid until</label>
              <input id="doc-expires" className="input" type="date" value={fields.expiresOn} onChange={set('expiresOn')} />
              <span className="field-hint">The last day it is valid. Without it there is nothing to remind you of.</span>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="doc-issued">Issued or bought on</label>
              <input id="doc-issued" className="input" type="date" value={fields.issuedOn} onChange={set('issuedOn')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="doc-issuer">Issued by</label>
              <input id="doc-issuer" className="input" maxLength={120} value={fields.issuer} onChange={set('issuer')} placeholder="An insurer, a shop, an office" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="doc-reference">Number (optional)</label>
              <input id="doc-reference" className="input" maxLength={60} value={fields.reference} onChange={set('reference')} placeholder="A policy or plate, if you want it at hand" />
              <span className="field-hint">Never read from the picture. Write it only if it helps you.</span>
            </div>
          </div>

          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} disabled={!fields.expiresOn}>
            <legend className="field-label">Remind me</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2) var(--sp-4)' }}>
              {[...options.reminderDayChoices]
                .sort((a, b) => b - a)
                .map((d) => (
                  <label className="checkbox-row" key={d}>
                    <input type="checkbox" checked={days.includes(d)} onChange={() => toggleDay(d)} />
                    {REMINDER_DAY_LABEL[d] || `${d} days before`}
                  </label>
                ))}
            </div>
            {!fields.expiresOn ? <span className="field-hint">Enter the last day of validity to choose reminders.</span> : null}
          </fieldset>

          <div className="field">
            <label className="field-label" htmlFor="doc-notes">Note</label>
            <textarea id="doc-notes" className="textarea" maxLength={1000} value={fields.notes} onChange={set('notes')} placeholder="Where the original is kept, what is needed to renew it" />
          </div>

          {existing ? (
            <div className="field">
              <span className="field-label">Pictures and files</span>
              <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {files.map((f) => (
                  <div key={f.id} className="stack" style={{ gap: 'var(--sp-1)' }}>
                    {f.contentType === 'application/pdf' ? (
                      <a className="btn btn-sm" href={f.url} download>
                        <Icon name="download" cls="icon-sm" /> Download the PDF
                      </a>
                    ) : (
                      <a href={f.url} target="_blank" rel="noreferrer">
                        <img src={f.url} alt={`Picture of ${existing.title}`} style={{ width: 180, maxHeight: 180, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                      </a>
                    )}
                    <button className="btn btn-sm" type="button" onClick={() => removeFile(f)}>
                      Remove
                    </button>
                  </div>
                ))}
                {files.length < options.room.maxFilesPerDocument ? (
                  <>
                    <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={addFile} hidden />
                    <button className="btn btn-sm" type="button" onClick={() => fileInput.current.click()}>
                      <Icon name="plus" cls="icon-sm" /> Add a photo or PDF
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : fromScan ? (
            picture ? (
              <label className="checkbox-row">
                <input type="checkbox" checked={keepPicture} onChange={(e) => setKeepPicture(e.target.checked)} />
                {picture.original ? 'Keep the PDF with the document' : 'Keep the picture with the document'}
              </label>
            ) : null
          ) : (
            <div className="field">
              <span className="field-label">Photo or PDF (optional)</span>
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                {picture ? <img src={picture.preview} alt="The picture you chose" style={{ width: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} /> : null}
                <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={choose} hidden />
                <button className="btn btn-sm" type="button" onClick={() => fileInput.current.click()}>
                  {picture ? 'Choose another' : 'Add a photo or PDF'}
                </button>
                {picture ? (
                  <button className="btn btn-sm" type="button" onClick={() => setPicture(null)}>
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {fromScan ? (
            <label className="checkbox-row" style={{ fontWeight: 600 }}>
              <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />I compared the name and the dates with the document, and they are right
            </label>
          ) : null}

          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            {existing ? (
              <>
                <button className="btn btn-danger" type="button" onClick={remove}>
                  Delete
                </button>
                <button className="btn" type="button" onClick={() => archive(existing.status === 'archived' ? 'active' : 'archived')} style={{ marginRight: 'auto' }}>
                  {existing.status === 'archived' ? 'Take out of the archive' : 'Archive'}
                </button>
              </>
            ) : null}
            <button className="btn" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={!canSave}>
              {busy ? 'Saving…' : existing ? 'Save changes' : 'Save document'}
            </button>
            {fromScan && !reviewed ? <span className="text-sm muted">Tick the box above to save.</span> : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
