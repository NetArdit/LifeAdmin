// Deterministic date/time helpers. No AI involved here by design (see spec §10, §23).

// The calendar date where the server runs, not the UTC date. With the UTC date,
// a server at UTC+2 still reported yesterday between midnight and 02:00, so a
// task due today was missing from "today" and a bill already overdue was not.
// On a hosted server set the TZ environment variable to the users' timezone.
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowISO() {
  return new Date().toISOString();
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return daysBetween(todayISO(), dateStr.slice(0, 10));
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'completed' || status === 'cancelled') return false;
  return daysUntil(dateStr) < 0;
}

// Parsed and manipulated purely in UTC (note the 'Z') so the returned
// calendar date never shifts. `new Date(dateStr + 'T00:00:00')` (no 'Z')
// parses as LOCAL midnight, and .toISOString() then converts that back to
// UTC — for any server running in a positive UTC-offset timezone (UTC+1,
// +2, ... — including LifeAdmin's own Kosovo/Albania target market), local
// midnight is still the previous UTC day, silently making addDays(d, 1)
// return the same day instead of the next one. Bug found via test authoring
// in Phase 0; fixed here since addDays is the shared primitive several
// features (postpone, bill recurrence, task recurrence) build on.
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Same UTC-anchoring as addDays, for month-based steps (used by bill/task
// recurrence). Reused instead of each caller hand-rolling its own
// new Date(...).setMonth(...).toISOString() (which carried the same bug).
//
// A day that does not exist in the target month is clamped to that month's
// last day: Jan 31 + 1 month is Feb 28 (or 29), not Mar 3 — setUTCMonth alone
// overflows into the following month and silently skips one.
function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
}

// Returns true if two [start,end) datetime ranges overlap.
function rangesOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
}

// Detect conflicts among a list of tasks that have start_time + duration_minutes.
function findConflicts(tasks) {
  const timed = tasks
    .filter((t) => t.start_time && t.duration_minutes)
    .map((t) => ({
      ...t,
      _end: new Date(new Date(t.start_time).getTime() + t.duration_minutes * 60000).toISOString(),
    }))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const conflicts = [];
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      if (rangesOverlap(timed[i].start_time, timed[i]._end, timed[j].start_time, timed[j]._end)) {
        conflicts.push([timed[i].id, timed[j].id]);
      } else if (new Date(timed[j].start_time) >= new Date(timed[i]._end)) {
        break; // sorted, no further overlap possible with i
      }
    }
  }
  return conflicts;
}

// Expand a recurrence rule into concrete due dates within [from, to] (inclusive), capped.
function expandRecurrence(baseDate, recurrence, until, rangeFrom, rangeTo, cap = 60) {
  if (!recurrence || recurrence === 'none') return [baseDate];
  const out = [];
  let cursor = baseDate;
  const stop = until ? until : rangeTo;
  let guard = 0;
  while (cursor <= stop && guard < cap) {
    guard++;
    if (cursor >= rangeFrom && cursor <= rangeTo) {
      if (recurrence === 'weekdays') {
        const dow = new Date(cursor + 'T00:00:00').getDay();
        if (dow !== 0 && dow !== 6) out.push(cursor);
      } else {
        out.push(cursor);
      }
    }
    if (recurrence === 'daily' || recurrence === 'weekdays') cursor = addDays(cursor, 1);
    else if (recurrence === 'weekly') cursor = addDays(cursor, 7);
    else if (recurrence === 'monthly') cursor = addMonths(cursor, 1);
    else break;
  }
  return out;
}

// Single-step recurrence advance, mirroring the pattern already used for
// recurring bills (src/routes/bills.js:nextDueDate) — computes the next
// occurrence's due date from the current one. Returns null for 'none'/falsy.
function nextRecurrenceDate(dueDate, recurrence) {
  if (!recurrence || recurrence === 'none') return null;
  if (recurrence === 'daily') return addDays(dueDate, 1);
  if (recurrence === 'weekdays') {
    let next = addDays(dueDate, 1);
    while ([0, 6].includes(new Date(next + 'T00:00:00').getDay())) next = addDays(next, 1);
    return next;
  }
  if (recurrence === 'weekly') return addDays(dueDate, 7);
  if (recurrence === 'monthly') return addMonths(dueDate, 1);
  return null;
}

function formatDuration(minutes) {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

module.exports = {
  todayISO,
  nowISO,
  daysBetween,
  daysUntil,
  isOverdue,
  addDays,
  addMonths,
  rangesOverlap,
  findConflicts,
  expandRecurrence,
  nextRecurrenceDate,
  formatDuration,
};
