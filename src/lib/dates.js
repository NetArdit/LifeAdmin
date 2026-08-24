// Deterministic date/time helpers. No AI involved here by design (see spec §10, §23).

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
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
    else if (recurrence === 'monthly') {
      const d = new Date(cursor + 'T00:00:00');
      d.setMonth(d.getMonth() + 1);
      cursor = d.toISOString().slice(0, 10);
    } else break;
  }
  return out;
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
  rangesOverlap,
  findConflicts,
  expandRecurrence,
  formatDuration,
};
