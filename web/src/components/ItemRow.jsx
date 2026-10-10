import { daysUntilLabel } from '../../../public/js/format.js';
import { Icon } from './Icon.jsx';

// Direct port of itemRow()/daysBetweenToday() from the original
// public/js/pages/dashboard.js — same markup, same class names, same
// local-date math (safe regardless of server timezone since both sides of
// the diff use local midnight consistently; see PHASE_0_STABILIZATION_REPORT
// §2.2 for the *different* addDays bug this does not share).
const BADGE_CLASS = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

function daysBetweenToday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

// Visual Redesign Batch 6: this row used to be a single <a href> with a
// <button> (the task-complete control) nested inside it — HTML's content
// model forbids nested interactive content in an anchor (found during
// this batch's own accessibility re-check, Section 18's explicit "no
// nested interactive controls" requirement; browsers render it, they just
// don't parse it as valid). Fixed the same way TaskRow/BillRow were in an
// earlier phase: the "open" affordance and the checkbox become sibling
// controls instead of one nested inside the other. For a non-task item
// (bill/decision) there is no checkbox to begin with — that side stays a
// plain, non-interactive decorative icon, unchanged.
export function ItemRow({ item, onComplete }) {
  const isTask = item.kind === 'task';
  const badgeClass = BADGE_CLASS[item.priority] || 'badge-medium';
  const daysLabel = item.due_date ? daysUntilLabel(daysBetweenToday(item.due_date)) : '';

  return (
    <div className="row-item">
      {isTask ? (
        <button className="row-check" aria-label="Complete" onClick={() => onComplete(item.id)}>
          <Icon name="check" />
        </button>
      ) : (
        <div className="row-check" style={{ pointerEvents: 'none', opacity: 0.35 }}>
          <Icon name={item.kind === 'bill' ? 'bill' : 'decision'} cls="icon-sm" />
        </div>
      )}
      {/* React escapes text children by default — equivalent to the
          original's manual escapeHtml(item.title) call. */}
      <a className="row-main row-item-btn" href={item.link} style={{ textDecoration: 'none' }}>
        <div className="row-title">{item.title}</div>
        <div className="row-meta">
          <span className={`badge ${badgeClass}`}>{item.priority}</span>
          {daysLabel ? <span>{daysLabel}</span> : null}
        </div>
      </a>
    </div>
  );
}
