// Deterministic smart-scheduling engine. Spec §10.
//
// AI is used only to turn natural language into structured constraints
// (see src/lib/ai.js -> parseLifePlan). All date math, availability
// calculation, conflict detection and slot placement happens here in plain
// JavaScript so it is fast, free, and predictable.
//
// --- Canonical time representation (Plan/Scheduler Reliability phase) -----
// Two shapes exist in this module, and every function's contract is explicit
// about which one it takes and returns:
//
//   Block  { label, start: "HH:MM", end: "HH:MM" }
//          A clock-face description of a commitment or preference, exactly
//          as a person (or the AI parsing their words) would say it. May
//          "wrap" past midnight (end <= start), e.g. sleep "23:00"–"07:00".
//          Blocks are the INPUT/OUTPUT boundary format only.
//
//   Range  { label?, start: number, end: number }   (minutes-from-midnight,
//          0..DAY_MINUTES, never wrapping — a range that would wrap is
//          represented as two adjacent same-day Ranges instead)
//          The ONLY shape any arithmetic (merging, overlap, placement) is
//          ever done in. "HH:MM" strings are parsed into Ranges at the edge
//          (toRanges/splitOvernightRange) and formatted back at the other
//          edge (placeActivities' return value) — never carried through the
//          middle of a computation as strings.
//
// The bug this phase fixes was exactly a violation of that boundary:
// buildBusyBlocks() used to return already-merged Ranges (numeric), and its
// only caller then ran them back through the Block-only merge path a second
// time, calling hmToMinutes() on numbers instead of "HH:MM" strings.
// buildBusyBlocks() now returns Block[], matching what every consumer
// (freeWindows -> mergeBlocks -> toRanges) has always expected.

const { rangesOverlap } = require('./dates');

const DAY_MINUTES = 24 * 60;

function hmToMinutes(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToHm(mins) {
  mins = ((mins % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Splits a clock-face [startMin, endMin) span into one or two non-wrapping
// numeric Ranges within a single day. A span that does not cross midnight
// (end > start) needs no split. A span where end <= start — including
// start === end — wraps past midnight and becomes the union of two Ranges:
// [start, DAY_MINUTES) and [0, end). start === end therefore means "the
// whole day": both pieces together cover 0..DAY_MINUTES with no gap. This
// is not a new rule invented for this phase — it is the exact semantic
// toRanges() already gave an overnight BUSY block (e.g. a "23:00"–"23:00"
// block already blocked the entire day); it is centralized here so activity
// preference windows (earliest/latest) get the identical, already-shipped
// meaning instead of a second, subtly different interpretation.
function splitOvernightRange(startMin, endMin) {
  if (endMin > startMin) return [{ start: startMin, end: endMin }];
  return [
    { start: startMin, end: DAY_MINUTES },
    { start: 0, end: endMin },
  ];
}

// Sensible human defaults the engine protects even if the user doesn't
// mention them — this is what keeps the planner from scheduling every
// free minute (spec §10 / §42).
const DEFAULT_PROTECTED_BLOCKS = [
  { label: 'Sleep', start: '23:00', end: '07:00' },
];

const MEAL_DEFAULTS = [
  { label: 'Breakfast', start: '07:30', end: '08:00' },
  { label: 'Lunch', start: '12:30', end: '13:15' },
  { label: 'Dinner', start: '19:00', end: '19:45' },
];

const DECOMPRESSION_MINUTES = 60; // buffer after work before demanding activities

/**
 * Build the list of busy blocks for one day from fixed commitments (work
 * hours, appointments, sleep, meals). Returns Block[] — HH:MM strings,
 * UNMERGED and NOT converted to minutes. Merging/conversion is the shared
 * responsibility of freeWindows()/mergeBlocks()/toRanges() below, done once,
 * by whichever caller actually needs Ranges (currently only placeActivities,
 * via freeWindows). Returning already-merged Ranges here was the root cause
 * of the crash this phase fixes: placeActivities() would then run the exact
 * same Block->Range conversion on values that were already numbers.
 */
function buildBusyBlocks({ workStart, workEnd, includeMeals = true, extra = [] } = {}) {
  const blocks = [...DEFAULT_PROTECTED_BLOCKS];
  if (workStart && workEnd) blocks.push({ label: 'Work', start: workStart, end: workEnd });
  if (includeMeals) blocks.push(...MEAL_DEFAULTS);
  if (workEnd) {
    const decompEnd = minutesToHm(hmToMinutes(workEnd) + DECOMPRESSION_MINUTES);
    blocks.push({ label: 'Decompression / commute', start: workEnd, end: decompEnd });
  }
  blocks.push(...extra);
  return blocks;
}

// Block[] -> Range[]. The only place "HH:MM" strings are parsed into minutes
// for this module's arithmetic; every other function here works on Ranges.
function toRanges(blocks) {
  const ranges = [];
  for (const b of blocks) {
    const s = hmToMinutes(b.start);
    const e = hmToMinutes(b.end);
    for (const r of splitOvernightRange(s, e)) ranges.push({ label: b.label, start: r.start, end: r.end });
  }
  return ranges.sort((a, b) => a.start - b.start);
}

// Block[] -> Range[], merging any that touch or overlap once expanded.
function mergeBlocks(blocks) {
  const ranges = toRanges(blocks);
  if (!ranges.length) return [];
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i].start <= last.end) {
      last.end = Math.max(last.end, ranges[i].end);
      last.label = last.label === ranges[i].label ? last.label : `${last.label} / ${ranges[i].label}`;
    } else {
      merged.push({ ...ranges[i] });
    }
  }
  return merged;
}

/** Free windows = complement of busy blocks within the day. Block[] -> Range[]. */
function freeWindows(busyBlocks) {
  const merged = mergeBlocks(busyBlocks);
  const free = [];
  let cursor = 0;
  for (const b of merged) {
    if (b.start > cursor) free.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < DAY_MINUTES) free.push({ start: cursor, end: DAY_MINUTES });
  return free.filter((w) => w.end - w.start > 0);
}

// Finds the chronologically-first slice across `windows` that lies within
// one of `allowed`'s Ranges and is at least `minMinutes` long; uses up to
// `maxMinutes` of it; and removes exactly that used slice from `windows`
// in place, splicing in whatever remains before/after it so later calls
// (the same activity's next fragment, or a lower-priority activity) see
// accurate remaining availability. Returns the placed {start,end}, or null
// if no window has room for at least minMinutes within the allowed ranges —
// the one, explicit place the "never place less than the requested minimum"
// invariant is enforced, so callers cannot accidentally bypass it.
// `allowed` is iterated in the OUTER loop, `windows` in the inner one: for an
// ordinary same-day preference `allowed` has exactly one entry, so this has
// no effect. For an overnight preference (e.g. earliest:"22:00",
// latest:"06:00"), splitOvernightRange() returns the "from earliest to
// midnight" piece first — trying it across every window before falling back
// to the "midnight to latest" piece means the scheduler naturally prefers
// placing time right after the requested start (22:00 onward) over jumping
// to the early-morning piece first, matching how a person reads "I'm free
// from 22:00 to 06:00". No other ordering guarantee is implied or needed.
function takeSlice(windows, allowed, minMinutes, maxMinutes) {
  for (const ar of allowed) {
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const start = Math.max(w.start, ar.start);
      const end = Math.min(w.end, ar.end);
      const avail = end - start;
      if (avail < minMinutes) continue;
      const use = Math.min(avail, maxMinutes);
      if (use < minMinutes) continue;
      const placedEnd = start + use;
      const before = w.start < start ? [{ start: w.start, end: start }] : [];
      const after = placedEnd < w.end ? [{ start: placedEnd, end: w.end }] : [];
      windows.splice(i, 1, ...before, ...after);
      return { start, end: placedEnd };
    }
  }
  return null;
}

/**
 * Greedily place a list of requested activities into the free windows of a day.
 * requests: [{ label, totalMinutes, minBlockMinutes=30, earliest, latest, priority }]
 * `earliest`/`latest` are "HH:MM" or null/undefined (no preference on that
 * side). When both are given and latest <= earliest, the preference window
 * wraps past midnight (e.g. earliest:"22:00", latest:"06:00") and is handled
 * via splitOvernightRange() exactly like an overnight busy block.
 * Returns { placed: [{label,start,end}] ("HH:MM"), warnings: [] }.
 * Every entry in `placed` is guaranteed >= that request's minBlockMinutes —
 * a fragment that would be smaller is never placed at all, only reflected in
 * `warnings` as unfit time, never as an undersized block.
 */
function placeActivities(busyBlocks, requests) {
  const windows = freeWindows(busyBlocks).map((w) => ({ ...w }));
  const placed = [];
  const warnings = [];
  const sorted = [...requests].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const req of sorted) {
    let remaining = req.totalMinutes;
    const minBlock = req.minBlockMinutes || Math.min(30, req.totalMinutes);
    const earliestMin = req.earliest ? hmToMinutes(req.earliest) : 0;
    const latestMin = req.latest ? hmToMinutes(req.latest) : DAY_MINUTES;
    const allowed = splitOvernightRange(earliestMin, latestMin);

    while (remaining > 0) {
      const slice = takeSlice(windows, allowed, minBlock, remaining);
      if (!slice) break;
      placed.push({ label: req.label, start: slice.start, end: slice.end });
      remaining -= slice.end - slice.start;
    }

    if (remaining > 0) {
      warnings.push(`Only fit ${req.totalMinutes - remaining} of ${req.totalMinutes} min for "${req.label}" — not enough free time today.`);
    }
  }

  return {
    placed: placed
      .sort((a, b) => a.start - b.start)
      .map((p) => ({ label: p.label, start: minutesToHm(p.start), end: minutesToHm(p.end) })),
    warnings,
  };
}

/** Detect overlaps between arbitrary {start,end} ISO datetime items. Not used by Plan. */
function detectOverlaps(items) {
  const conflicts = [];
  const sorted = [...items].sort((a, b) => new Date(a.start) - new Date(b.start));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (rangesOverlap(sorted[i].start, sorted[i].end, sorted[j].start, sorted[j].end)) {
        conflicts.push([sorted[i], sorted[j]]);
      }
    }
  }
  return conflicts;
}

module.exports = {
  DAY_MINUTES,
  hmToMinutes,
  minutesToHm,
  splitOvernightRange,
  toRanges,
  buildBusyBlocks,
  freeWindows,
  placeActivities,
  detectOverlaps,
  mergeBlocks,
  DEFAULT_PROTECTED_BLOCKS,
  MEAL_DEFAULTS,
  DECOMPRESSION_MINUTES,
};
