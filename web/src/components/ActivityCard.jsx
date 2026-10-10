import { fmtRelative } from '../../../public/js/format.js';
import { Icon } from './Icon.jsx';

// Visual Redesign Batch 6: GET /api/dashboard's familyActivity is the
// same activity_log shape Timeline (Batch 4) and Family's Activity tab
// (Batch 5) already consume — {id, type, summary, link, createdAt}, same
// nine real event types, same "four family-lifecycle types carry no
// link" fact. Same map, duplicated a third time rather than imported
// from either closed batch's file, for the same reason Batch 5 documented
// (those batches stay untouched). Deliberately NOT applied to this
// card's own outer element: Batch 5 found that a region-level
// module-accent class leaks into every descendant via CSS custom-property
// inheritance, so "Family activity" (which isn't itself a module) stays
// completely unaccented at the card level — only each row picks its own
// accent (or explicitly opts out via module-accent--none), exactly the
// fix that bug produced, applied correctly from the start this time
// instead of being discovered by re-triggering it.
const EVENT_META = {
  task_created: { icon: 'tasks' },
  task_completed: { icon: 'tasks' },
  comment: { icon: 'message' },
  bill_paid: { icon: 'bill', accent: 'money' },
  decision_made: { icon: 'decision', accent: 'reasoning' },
  goal_progress: { icon: 'goal', accent: 'warmth' },
  member_joined: { icon: 'family', accent: 'warmth' },
  member_left: { icon: 'family', accent: 'warmth' },
  ownership_transferred: { icon: 'family', accent: 'warmth' },
  invite_code_changed: { icon: 'family', accent: 'warmth' },
};
const DEFAULT_META = { icon: 'timeline' };

// Visual Redesign Batch 6: fixes the same href={a.link || '#'} bug Batch 4
// found on the main Timeline page and Batch 5 found again on Family's
// Activity tab — this is the third, independent place the exact same bug
// existed (all three components were separate, hand-written ports of the
// same original vanilla page logic). An event with a real link renders as
// a real, keyboard-focusable <a>; one without renders as plain,
// non-interactive text.
function ActivityRow({ event }) {
  const meta = EVENT_META[event.type] || DEFAULT_META;
  const accentClass = meta.accent ? `module-accent--${meta.accent}` : 'module-accent--none';
  const content = (
    <>
      <Icon name={meta.icon} cls="icon-sm timeline-icon" />
      <div className="row-main">
        <div className="row-title" style={{ whiteSpace: 'normal', fontWeight: 500 }}>{event.summary}</div>
        <div className="row-meta">{fmtRelative(event.createdAt)}</div>
      </div>
    </>
  );
  return event.link ? (
    <a className={`row-item ${accentClass}`} href={event.link} style={{ textDecoration: 'none' }}>
      {content}
    </a>
  ) : (
    <div className={`row-item ${accentClass}`}>{content}</div>
  );
}

// Direct port of activityCard() from the original dashboard.js.
export function ActivityCard({ activity }) {
  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Family activity</span>
      </div>
      {activity.length ? (
        <div className="row-list">
          {activity.slice(0, 6).map((a) => (
            <ActivityRow key={a.id} event={a} />
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No family activity yet. Create a family to share tasks and updates.</p>
      )}
    </div>
  );
}
