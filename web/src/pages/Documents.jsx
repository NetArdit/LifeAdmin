import { useCallback, useEffect, useState } from 'react';
import { fmtDate } from '../../../public/js/format.js';
import { Icon } from '../components/Icon.jsx';
import { DocumentForm } from '../components/documents/DocumentForm.jsx';
import { KIND_LABEL } from '../components/documents/kinds.js';

// Documents and their dates: what runs out once a year or once in ten, and is forgotten for that reason.
// The list is ordered by what needs attention first. A document is added by hand, or read from a picture:
// then the fields are only offered, and the person confirms them before anything is saved (DocumentForm).

const GROUPS = [
  ['expired', 'Expired'],
  ['soon', 'Running out within 30 days'],
  ['valid', 'Valid'],
  ['undated', 'No expiry date'],
  ['archived', 'Archived'],
];

function leftLabel(doc) {
  if (doc.state === 'archived') return 'Archived';
  if (doc.daysLeft === null) return 'No date';
  if (doc.daysLeft < 0) return doc.daysLeft === -1 ? 'Expired yesterday' : `Expired ${-doc.daysLeft} days ago`;
  if (doc.daysLeft === 0) return 'Last day today';
  if (doc.daysLeft === 1) return '1 day left';
  if (doc.daysLeft < 60) return `${doc.daysLeft} days left`;
  if (doc.daysLeft < 730) return `${Math.round(doc.daysLeft / 30)} months left`;
  return `${Math.floor(doc.daysLeft / 365)} years left`;
}
const BADGE = { expired: 'badge-critical', soon: 'badge-warning', valid: 'badge-success', undated: 'badge-neutral', archived: 'badge-neutral' };

function DocumentRow({ doc, onOpen }) {
  return (
    <div className="row-item">
      <button className="row-item-btn row" onClick={() => onOpen(doc)}>
        <div className="bill-cat-icon">
          <Icon name="document" cls="icon-sm" />
        </div>
        <div className="row-main">
          <div className="row-title">{doc.title}</div>
          <div className="row-meta">
            <span>{KIND_LABEL[doc.kind] || doc.kind}</span>
            {doc.issuer ? <span>{doc.issuer}</span> : null}
            {doc.expiresOn ? <span>Valid until {fmtDate(doc.expiresOn)}</span> : null}
            {doc.files.length ? <span>{doc.files.length === 1 ? '1 file' : `${doc.files.length} files`}</span> : null}
          </div>
        </div>
        <span className={`badge ${BADGE[doc.state]}`}>{leftLabel(doc)}</span>
      </button>
    </div>
  );
}

export function Documents({ ctx }) {
  const { api, toast } = ctx;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // null: the list alone. Otherwise what the form is for: { mode: 'manual' | 'scan' } or { existing }.
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api.get('/api/documents'));
    } catch (err) {
      setError(err);
    }
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load this page</h3>
          <p>{error.message}</p>
          <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={load}>
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Loading documents…
        </div>
      </div>
    );
  }

  const docs = data.documents;
  const count = (state) => docs.filter((d) => d.state === state).length;
  const done = (message) => {
    setForm(null);
    if (message) toast(message, 'success');
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Passport, insurance, inspection, warranties: kept in one place, and remembered before they run out.</p>
        </div>
        {form ? null : (
          <div className="page-actions">
            {data.scan.available ? (
              <button className="btn" onClick={() => setForm({ mode: 'scan' })}>
                <Icon name="sparkle" cls="icon-sm" /> Scan a document
              </button>
            ) : null}
            <button className="btn btn-primary" onClick={() => setForm({ mode: 'manual' })}>
              <Icon name="plus" cls="icon-sm" /> Add a document
            </button>
          </div>
        )}
      </div>

      {form ? (
        <DocumentForm
          key={form.existing ? `edit-${form.existing.id}` : form.mode}
          api={api}
          toast={toast}
          mode={form.existing ? 'edit' : form.mode}
          existing={form.existing || null}
          options={data}
          onCancel={() => setForm(null)}
          onDone={done}
        />
      ) : null}

      {!form ? (
        <div className="stat-row">
          <div className="card card-pad stat-tile">
            <div className="stat-value">{count('expired')}</div>
            <div className="stat-label">Expired</div>
          </div>
          <div className="card card-pad stat-tile">
            <div className="stat-value">{count('soon')}</div>
            <div className="stat-label">Within 30 days</div>
          </div>
          <div className="card card-pad stat-tile">
            <div className="stat-value">{count('valid')}</div>
            <div className="stat-label">Valid</div>
          </div>
        </div>
      ) : null}

      {!form && !docs.length ? (
        <div className="empty-state">
          <Icon name="document" cls="icon-lg" />
          <h3>No documents yet</h3>
          <p>Add the first one: the passport, the car&apos;s insurance, a warranty. You will be reminded before it runs out.</p>
        </div>
      ) : null}

      {!form
        ? GROUPS.map(([state, label]) => {
            const rows = docs.filter((d) => d.state === state);
            if (!rows.length) return null;
            return (
              <div className="list-region" key={state} style={{ marginTop: 'var(--sp-4)' }}>
                <div className="list-region-heading">
                  {label} ({rows.length})
                </div>
                <div className="row-list">
                  {rows.map((d) => (
                    <DocumentRow key={d.id} doc={d} onOpen={(doc) => setForm({ existing: doc })} />
                  ))}
                </div>
              </div>
            );
          })
        : null}
    </div>
  );
}
