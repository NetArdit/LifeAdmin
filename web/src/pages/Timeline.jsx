import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { fmtTime, fmtDayLabel } from '../../../public/js/format.js';

// Direct port of public/js/pages/timeline.js's mount(). Same grouping key
// as the original (fmtDayLabel(dateStr) as the group label itself, not the
// raw date) — preserved exactly.
function groupByDay(activity) {
  const groups = {};
  for (const a of activity) {
    const dateStr = a.createdAt.slice(0, 10);
    const label = fmtDayLabel(dateStr);
    if (!groups[label]) groups[label] = [];
    groups[label].push(a);
  }
  return groups;
}

// Visual Redesign Batch 4: maps each of the real, currently-logged
// activity_log `type` values (verified against src/routes/*.js's
// logActivity() call sites — task_created, task_completed, comment,
// bill_paid, decision_made, goal_progress, member_joined, member_left,
// ownership_transferred, invite_code_changed; nothing else exists today,
// nothing here is invented) to the icon and module accent that event's
// *source* module already uses elsewhere in the app (sidebar nav, row
// icons). Tasks' own three types stay unaccented, matching Tasks itself
// having no module accent (spec §9 governance — Dashboard/Tasks/
// Assistant/Settings are "core", not one of the four accented modules).
// EcoLife and Assistant never appear here because no activity_log entry
// is ever written for them today — a real, confirmed data gap, not
// something this batch invents around (see the batch report's "out of
// scope" section).
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

// Visual Redesign Batch 4: four of the nine real event types
// (member_joined/member_left/ownership_transferred/invite_code_changed)
// are logged with no `link` at all (confirmed against every logActivity()
// call site in src/routes/family.js — those four never pass one). The
// original markup rendered every event as <a href={a.link || '#'}>
// regardless, which meant clicking one of these four silently navigated
// the whole app to the Dashboard (an empty "#" hash resolves to the
// default route in app.js's router) — a real, pre-existing bug, not a
// hypothetical one. Fixing which element type gets used is a direct,
// necessary consequence of this batch's own accessibility requirement
// ("don't make non-interactive entries artificially interactive," and the
// inverse: don't silently break navigation on ones that were never really
// links) — not a scope-expanding bug hunt. An event with a real link
// renders as a real, keyboard-focusable <a>; one without renders as
// plain, correctly non-interactive text.
function TimelineItem({ event }) {
  const meta = EVENT_META[event.type] || DEFAULT_META;
  const accentClass = meta.accent ? `module-accent--${meta.accent}` : '';
  const content = (
    <>
      <span className="timeline-time">{fmtTime(event.createdAt.replace(' ', 'T') + 'Z')}</span>
      <Icon name={meta.icon} cls="icon-sm timeline-icon" />
      <span className="text-sm">{event.summary}</span>
    </>
  );
  return event.link ? (
    <a className={`timeline-item ${accentClass}`} href={event.link} style={{ textDecoration: 'none' }}>
      {content}
    </a>
  ) : (
    <div className={`timeline-item ${accentClass}`}>{content}</div>
  );
}

export function Timeline({ ctx }) {
  const { api } = ctx;
  const [activity, setActivity] = useState(null); // null = loading
  const [error, setError] = useState(null);

  // Visual Redesign Batch 4: the original fetch had no .catch() at all —
  // a confirmed, pre-existing bug (documented in the implementation spec
  // as something to ship together with this exact batch, not a separate
  // one): a failed load left `activity` at its initial `null` forever, so
  // the "Loading timeline…" spinner never went away. load() is now a
  // reusable function (not an inline effect body) specifically so the new
  // error state's retry button can call the exact same fetch again — no
  // new data-fetching logic, no change to what's requested.
  const load = useCallback(() => {
    setError(null);
    api
      .get('/api/timeline')
      .then(({ activity: rows }) => setActivity(rows))
      .catch((err) => setError(err));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      {/* C3 Phase 1: relabeled from "Timeline" to "Ledger" — Timeline is
          conceptually absorbed into Ledger per this phase's own brief, and
          the shell's Today/This Week/Ledger switch (public/js/app.js's
          VIEW_SWITCH_ITEMS) now routes here under that name. Route,
          fetch, grouping and every event type below are unchanged. */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ledger</h1>
          <p className="page-subtitle">The complete, dated record of everything that's happened.</p>
        </div>
      </div>

      {/* Visual Redesign Batch 4: Timeline is a pure continuum — unlike
          Tasks/BillSense it has no sibling "set" content on the page to
          distinguish itself from, so (unlike those two) this list-region
          gets no .list-region-heading of its own: the page's own <h1>
          already says "Timeline", and repeating that immediately below it
          would be pure noise. The first date-group heading below takes
          over the region's "give this section presence" role instead. */}
      <div className="list-region">
        {error ? (
          <div className="empty-state">
            <Icon name="alert" cls="icon-lg" />
            <h3>Couldn&apos;t load your timeline</h3>
            <p>{error.message}</p>
            <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={load}>
              Try again
            </button>
          </div>
        ) : activity === null ? (
          <div className="loading-line">
            <span className="spinner" /> Loading timeline…
          </div>
        ) : activity.length === 0 ? (
          <div className="empty-state">
            <Icon name="timeline" cls="icon-lg" />
            <h3>Nothing here yet</h3>
            <p>As you complete tasks, pay bills, and make decisions, they&apos;ll show up here.</p>
          </div>
        ) : (
          Object.entries(groupByDay(activity)).map(([day, items]) => (
            <div className="timeline-day" key={day}>
              <div className="timeline-day-label">{day}</div>
              {items.map((a) => (
                <TimelineItem key={a.id} event={a} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
