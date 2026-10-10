import { useEffect, useRef, useState } from 'react';
import { fmtDate } from '../../../../public/js/format.js';
import { confirmDialog } from '../../../../public/js/components/confirm.js';
import { Icon } from '../Icon.jsx';
import { openMilestoneFormModal } from './MilestoneFormModal.jsx';

// Visual Redesign Batch 7C: replaces the old equal-weight GoalCard grid
// with an index row (this component, collapsed) that expands in place
// into a bounded detail panel — see GOALS_BATCH7_RESEARCH.md for the
// research/prototype evidence behind this shape. The collapsed row's
// only job is the expand/collapse toggle, so — like Dashboard's
// BucketCard.jsx compact-bucket header — the *entire* row is a real
// <button>, not a non-interactive row with a nested button: there is
// nothing else inside it that needs its own separate interactivity.

const TARGET_URGENCY_DAYS = 14;

function targetInfo(targetDate) {
  if (!targetDate) return null;
  const startOfToday = new Date(new Date().toDateString());
  const days = Math.round((new Date(`${targetDate}T00:00:00`) - startOfToday) / 86400000);
  if (days < 0) return { cls: 'is-overdue', label: `Overdue — was ${fmtDate(targetDate)}` };
  if (days <= TARGET_URGENCY_DAYS) return { cls: 'is-approaching', label: `Target: ${fmtDate(targetDate)}` };
  return { cls: 'is-future', label: `Target: ${fmtDate(targetDate)}` };
}

export function GoalRow({ goal, api, toast, state, onChanged, expanded, onToggle }) {
  const [showAll, setShowAll] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const headingRef = useRef(null);

  // Focus the expanded panel's heading once it actually exists in the DOM
  // (after React commits the new markup, not before) — see requirement
  // that focus must move on open, but only once there is something real
  // to focus. Collapsing again needs no special handling: the row itself
  // still has focus (it's the element the user just clicked).
  useEffect(() => {
    if (expanded && headingRef.current) headingRef.current.focus();
    if (!expanded) setShowAll(false);
  }, [expanded]);

  const total = goal.milestones.length;
  // Progress is derived here from the actual milestone list on every
  // render, never trusted from goal.progress — the stored field can lag
  // (see src/lib/goalProgress.js / Batch 7C backend fix); computing it
  // client-side from data already in the payload means the UI can never
  // show a number that disagrees with the milestones it's displaying.
  const done = goal.milestones.filter((m) => m.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const next = goal.milestones.find((m) => !m.done) || null;
  const firstIncompleteAfterNext = goal.milestones.find((m) => !m.done && m.id !== next?.id) || null;
  // Bounded per the approved spec: "next" plus at most ONE more preview
  // item are always visible; everything else — further incomplete
  // milestones AND already-done ones alike — sits behind "Show all",
  // never an unbounded inline list (Batch 7B prototype evidence: past
  // ~5 milestones an uncapped list stopped reading as a goal summary).
  const preview = firstIncompleteAfterNext ? [firstIncompleteAfterNext] : [];
  const shownIds = new Set([next, ...preview].filter(Boolean).map((m) => m.id));
  const hidden = goal.milestones.filter((m) => !shownIds.has(m.id));
  const target = targetInfo(goal.targetDate);
  const panelId = `goal-detail-${goal.id}`;
  const milestoneListId = `goal-milestones-${goal.id}`;

  async function toggleMilestone(msId, isDone) {
    await api.patch(`/api/goals/${goal.id}/milestones/${msId}`, { done: !isDone });
    onChanged();
  }
  async function handleDelete() {
    const ok = await confirmDialog({ title: 'Delete goal?', message: 'This cannot be undone.', confirmLabel: 'Delete' });
    if (!ok) return;
    await api.del(`/api/goals/${goal.id}`);
    onChanged();
  }
  async function handleSuggest() {
    if (!state.aiConfigured) return toast('AI is not configured on this server.', 'error');
    setSuggesting(true);
    try {
      const result = await api.post(`/api/goals/${goal.id}/suggest-milestones`, {});
      if (!result.ok) toast(result.error, 'error');
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      // Without this a failed request left the button disabled for good.
      setSuggesting(false);
    }
  }

  return (
    <div className="goal-row-wrap">
      <button className="row-item goal-row-toggle" aria-expanded={expanded} aria-controls={panelId} onClick={() => onToggle(goal.id)}>
        <div className="row-main">
          <div className="row-title">
            {goal.title}
            {goal.status !== 'active' ? (
              <span className={`goal-row-status ${goal.status === 'completed' ? 'is-completed' : 'is-abandoned'}`}>
                {' '}
                · {goal.status === 'completed' ? 'Completed' : 'Abandoned'}
              </span>
            ) : null}
          </div>
          <div className="row-meta">
            <span className="goal-row-category">{goal.category}</span>
            <span>{total ? `${done} of ${total} milestones` : 'No milestones yet'}</span>
            {next ? <span>Next: {next.title}</span> : total ? <span>All milestones complete</span> : null}
            {target ? <span className={`goal-target ${target.cls}`}>{target.label}</span> : null}
          </div>
        </div>
        {total ? (
          <div className="progress-track goal-row-progress" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
        <span className="goal-row-pct text-xs muted" aria-hidden="true">{total ? `${pct}%` : '—'}</span>
        <Icon name="chevron" cls={`icon-sm goal-row-chevron ${expanded ? 'is-open' : ''}`} />
      </button>

      {expanded ? (
        <div className="goal-detail" id={panelId}>
          <h3 className="visually-hidden" tabIndex={-1} ref={headingRef}>
            {goal.title} — details
          </h3>

          <div>
            <div className="row-between text-xs muted" style={{ marginBottom: 4 }}>
              <span>{total ? `${done} of ${total} milestones done` : 'No milestones yet'}</span>
              <span>{total ? `${pct}%` : null}</span>
            </div>
            {total ? (
              <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" aria-label={`${goal.title} progress`}>
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            ) : null}
            {target ? <div className={`goal-target ${target.cls}`} style={{ marginTop: 4 }}>{target.label}</div> : null}
          </div>

          {next ? (
            <div className="goal-detail-next">
              <button className="row-check" onClick={() => toggleMilestone(next.id, next.done)} aria-label={`Mark "${next.title}" as done`}>
                <Icon name="check" cls="icon-sm" />
              </button>
              <span className="milestone-title">Next: {next.title}</span>
            </div>
          ) : total ? (
            <p className="text-sm" style={{ color: 'var(--accent-600)' }}>All milestones complete.</p>
          ) : (
            <p className="muted text-sm">Add a milestone, or ask AI to suggest a few.</p>
          )}

          {preview.length ? (
            <div className="stack" style={{ gap: 6 }}>
              {preview.map((m) => (
                <div className="milestone-row" key={m.id}>
                  <button className="row-check" onClick={() => toggleMilestone(m.id, m.done)} aria-label={`Mark "${m.title}" as done`}>
                    <Icon name="check" cls="icon-sm" />
                  </button>
                  <span className="milestone-title">{m.title}</span>
                </div>
              ))}
            </div>
          ) : null}

          {hidden.length ? (
            <button className="btn btn-sm goal-show-all" aria-expanded={showAll} aria-controls={milestoneListId} onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all (${hidden.length} more)`}
            </button>
          ) : null}
          {showAll && hidden.length ? (
            <div className="stack" id={milestoneListId} style={{ gap: 6, marginTop: 6 }}>
              {hidden.map((m) => (
                <div className={`milestone-row ${m.done ? 'done' : ''}`} key={m.id}>
                  <button
                    className={`row-check ${m.done ? 'checked' : ''}`}
                    onClick={() => toggleMilestone(m.id, m.done)}
                    aria-label={`Mark "${m.title}" as ${m.done ? 'not done' : 'done'}`}
                  >
                    <Icon name="check" cls="icon-sm" />
                  </button>
                  <span className="milestone-title">{m.title}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="row goal-detail-actions" style={{ gap: 6 }}>
            <button className="btn btn-sm" onClick={() => openMilestoneFormModal({ api, toast, goalId: goal.id, onSaved: onChanged })}>
              <Icon name="plus" cls="icon-sm" /> Milestone
            </button>
            {!total ? (
              <button className="btn btn-sm" disabled={suggesting} onClick={handleSuggest}>
                {suggesting ? <span className="spinner" /> : <><Icon name="sparkle" cls="icon-sm" /> Suggest with AI</>}
              </button>
            ) : null}
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={handleDelete}>
              <Icon name="trash" cls="icon-sm" /> Delete goal
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
