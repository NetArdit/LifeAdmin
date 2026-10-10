import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../Icon.jsx';
import { confirmDialog } from '../../../../public/js/components/confirm.js';

// Direct port of renderOverview() from the original public/js/pages/family.js.
export function OverviewTab({ api, toast, familyId, family, myRole, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  const [rotating, setRotating] = useState(false);

  // Hardening 1 / F-03. Owner-only in the UI, and enforced by the server regardless
  // (POST /api/family/:id/invite-code/regenerate answers 403 to anyone else).
  async function handleRegenerate() {
    const ok = await confirmDialog({
      title: 'Create a new invite code?',
      message:
        'The current code will stop working right away. People already in the circle stay; ' +
        'anyone you gave the old code to will need the new one.',
      confirmLabel: 'Create new code',
      danger: false,
    });
    if (!ok) return;
    setRotating(true);
    try {
      await api.post(`/api/family/${familyId}/invite-code/regenerate`, {});
      toast('New invite code created', 'success');
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setRotating(false);
    }
  }

  // Visual Redesign Batch 5: this fetch had no .catch() (the original had
  // no error handling for any of Family's five tab-render functions,
  // preserved as-is until now — see the batch report's per-tab rationale
  // for why this one specifically gains it here: it's the fetch behind
  // the surface being restructured into a list-region in this same
  // batch, unlike Members/Shopping/Chat, which this batch does not touch).
  // `load` is a named, reusable function rather than an inline effect body
  // specifically so the new error state's retry button can call it again.
  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setTasksError(null);
    api
      .get(`/api/tasks?familyId=${familyId}`)
      .then(({ tasks: rows }) => {
        if (!cancelled) {
          setTasks(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTasksError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, familyId]);

  useEffect(() => load(), [load]);

  if (loading) {
    return (
      <div className="loading-line">
        <span className="spinner" /> Loading…
      </div>
    );
  }

  return (
    <div className="dash-grid">
      {/* Visual Redesign Batch 5: a family's shared tasks are the exact
          same content shape as the Tasks page's own list — a continuum
          being scanned, not a set of separate comparable things — so this
          becomes a list-region (Batch 2's shared primitive), not a card.
          "Invite code" below stays a .card, unchanged: it's a single
          bounded fact + action, not a stream. module-accent--warmth tints
          only this heading's text, per governance (never a background). */}
      <div className="list-region module-accent--warmth">
        <div className="row-between" style={{ marginBottom: 'var(--sp-2)' }}>
          <div className="list-region-heading" style={{ marginBottom: 0 }}>
            Shared tasks
          </div>
          <span className="text-xs muted">{tasks.length}</span>
        </div>
        {tasksError ? (
          <div className="empty-state">
            <Icon name="alert" cls="icon-lg" />
            <h3>Couldn&apos;t load shared tasks</h3>
            <p>{tasksError.message}</p>
            <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={load}>
              Try again
            </button>
          </div>
        ) : tasks.length ? (
          <div className="row-list">
            {tasks.slice(0, 10).map((t) => (
              <a key={t.id} className="row-item" href={`#/tasks/${t.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="row-check"
                  style={{
                    pointerEvents: 'none',
                    ...(t.status === 'completed'
                      ? { background: 'var(--accent-500)', borderColor: 'var(--accent-500)', color: '#fff' }
                      : {}),
                  }}
                >
                  {t.status === 'completed' ? <Icon name="check" cls="icon-sm" /> : null}
                </div>
                <div className="row-main">
                  <div className={`row-title ${t.status === 'completed' ? 'done' : ''}`}>{t.title}</div>
                  <div className="row-meta">{t.assigneeName ? `Assigned to ${t.assigneeName}` : 'Unassigned'}</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="muted text-sm">No shared tasks yet. Create a task and set visibility to circle.</p>
        )}
      </div>
      <div className="card card-pad">
        <div className="card-header">
          <span className="card-title">Invite code</span>
        </div>
        {family.inviteCode ? (
          <p className="text-sm muted">
            Share this code so someone can join manually, or add them directly by phone number in the Members tab.
          </p>
        ) : (
          <p className="text-sm muted">
            Only the circle owner can see and share the invite code. Ask the owner if you would like to invite someone.
          </p>
        )}
        <div className="row" style={{ marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
          {family.inviteCode ? (
            <code
              style={{
                background: 'var(--bg-sunken)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                overflowWrap: 'anywhere',
              }}
            >
              {family.inviteCode}
            </code>
          ) : null}
          {myRole === 'owner' ? (
            <button className="btn btn-sm" onClick={handleRegenerate} disabled={rotating}>
              New invite code
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
