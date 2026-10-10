import { Icon } from '../Icon.jsx';
import { fmtDate, fmtTime, fmtDuration, PRIORITY_LABEL } from '../../../../public/js/format.js';

const PRIORITY_BADGE = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

// Direct port of taskRow(t) from the original public/js/pages/tasks.js.
// Preserves the exact original toggle semantics: the checkbox only ever
// flips between 'todo' and 'completed' (never 'in_progress'), and clicking
// anywhere else on the row opens the detail modal — both decided by the
// parent via onOpen/onToggleCheck, not duplicated here.
//
// Accessibility fix (Daily Product Quality phase): the row used to be a
// non-interactive <div> with an onClick, invisible to keyboard/screen-reader
// users — Tab skipped it entirely and there was no way to open it without a
// mouse. A single outer <button> can't fix this because the row already
// contains a real, separately-actionable <button> (the checkbox), and HTML
// forbids nesting interactive controls inside a <button> (the browser would
// silently break the DOM by auto-closing the outer button early). Instead
// the "open detail" affordance and the checkbox become two sibling native
// <button>s laid out side by side by .row-item's existing flex rules — both
// independently focusable and Enter/Space-activatable with zero ARIA, and
// e.stopPropagation() is no longer needed since neither button is nested
// inside the other's click target.
export function TaskRow({ task, onOpen, onToggleCheck }) {
  const done = task.status === 'completed';
  const cancelled = task.status === 'cancelled';

  return (
    <div className="row-item">
      <button
        className={`row-check ${done ? 'checked' : ''}`}
        disabled={cancelled}
        aria-label="Toggle complete"
        onClick={() => onToggleCheck(task)}
      >
        <Icon name="check" />
      </button>
      <button className="row-main row-item-btn" onClick={() => onOpen(task.id)}>
        <div className={`row-title ${done ? 'done' : ''}`}>{task.title}</div>
        <div className="row-meta">
          <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
          {task.dueDate ? (
            <span>
              {fmtDate(task.dueDate)}
              {task.startTime ? ' · ' + fmtTime(task.startTime) : ''}
            </span>
          ) : null}
          {task.durationMinutes ? <span>{fmtDuration(task.durationMinutes)}</span> : null}
          {task.familyId ? <Icon name="family" cls="icon-sm" /> : null}
          {task.recurrence ? (
            <span>
              <Icon name="refresh" cls="icon-sm" /> {task.recurrence}
            </span>
          ) : null}
          {cancelled ? <span className="badge badge-neutral">Cancelled</span> : null}
        </div>
      </button>
    </div>
  );
}
