import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../Icon.jsx';
import { fmtRelative } from '../../../../public/js/format.js';

// Visual Redesign Batch 5: GET /api/family/:id/activity returns the exact
// same shape as GET /api/timeline (confirmed against src/routes/family.js
// — same activity_log table, same {id, type, summary, link, createdAt,
// actorName} fields), so the same event-type -> icon/accent mapping Batch
// 4 built for the main Timeline page applies here unchanged. This map is
// intentionally duplicated rather than imported from Timeline.jsx: that
// batch is closed and audited, and this phase's own instructions are not
// to reopen it — a genuinely reusable ~10-line object is a small, known
// trade-off against that constraint, not an oversight (see the batch
// report's "out of scope" section). The .timeline-icon CSS class itself
// (pages.css) is NOT duplicated — it was already a generic, page-agnostic
// rule, so this file simply becomes its second real consumer.
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

// Direct port of renderActivity() from the original public/js/pages/family.js,
// restructured for Batch 5. Visual Redesign Batch 5 fixes the same bug
// Batch 4 found and fixed on the main Timeline page: four of the nine real
// activity_log types are logged with no `link` (every family-lifecycle
// type — confirmed against every logActivity() call in
// src/routes/family.js), so <a href={a.link || '#'}> silently navigated
// the whole app to the Dashboard on click. An event with a real link
// renders as a real, keyboard-focusable <a>; one without renders as
// plain, correctly non-interactive text — reusing .row-item (the same
// row shape Tasks/BillSense already use) rather than Timeline's own
// time-column layout, since this tab shows relative time as row metadata
// like every other .row-item list in the app, not a separate time column
// — deliberately not a copy of Timeline's exact composition, just its
// proven icon/link-correctness logic.
function ActivityRow({ event }) {
  const meta = EVENT_META[event.type] || DEFAULT_META;
  // Unaccented rows explicitly opt OUT via module-accent--none, not just
  // an empty class — this tab's own .list-region wrapper carries
  // module-accent--warmth for its heading, and CSS custom properties
  // inherit, so a Tasks-domain event sitting inside it would otherwise
  // silently pick up the ambient Warmth color instead of the intended
  // brand-blue default (found and fixed via this batch's own real-browser
  // verification — see components.css's .module-accent--none comment).
  const accentClass = meta.accent ? `module-accent--${meta.accent}` : 'module-accent--none';
  const content = (
    <>
      <Icon name={meta.icon} cls="icon-sm timeline-icon" />
      <div className="row-main">
        <div className="row-title" style={{ whiteSpace: 'normal', fontWeight: 500 }}>
          {event.summary}
        </div>
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

export function ActivityTab({ api, familyId }) {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);

  // Visual Redesign Batch 5: gains a .catch() for the same reason as
  // OverviewTab's shared-tasks fetch (see that file's comment) — this is
  // the fetch behind the surface being restructured in this batch.
  const load = useCallback(() => {
    setActivity(null);
    setError(null);
    api
      .get(`/api/family/${familyId}/activity`)
      .then(({ activity: rows }) => setActivity(rows))
      .catch((err) => setError(err));
  }, [api, familyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="list-region module-accent--warmth">
      <div className="list-region-heading">Activity</div>
      {error ? (
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load activity</h3>
          <p>{error.message}</p>
          <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={load}>
            Try again
          </button>
        </div>
      ) : activity === null ? (
        <div className="loading-line">
          <span className="spinner" /> Loading…
        </div>
      ) : activity.length ? (
        <div className="row-list">
          {activity.map((a) => (
            <ActivityRow key={a.id} event={a} />
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No activity yet.</p>
      )}
    </div>
  );
}
