// Deterministic smart-scheduling engine. Spec §10.
//
// AI is used only to turn natural language into structured constraints
// (see src/lib/ai.js -> parseLifePlan). All date math, availability
// calculation, conflict detection and slot placement happens here in plain
// JavaScript so it is fast, free, and predictable.

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
 * Build the list of busy blocks for one day from fixed commitments
 * (work hours, appointments, sleep, meals). Each block: {label, start, end}
 * in HH:MM, may wrap past midnight for sleep.
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
  return mergeBlocks(blocks);
}

function toRanges(blocks) {
  // Expand blocks into non-wrapping minute ranges within a single day (0..1440),
  // splitting any block that crosses midnight.
  const ranges = [];
  for (const b of blocks) {
    let s = hmToMinutes(b.start);
    let e = hmToMinutes(b.end);
    if (e <= s) {
      ranges.push({ label: b.label, start: s, end: DAY_MINUTES });
      ranges.push({ label: b.label, start: 0, end: e });
    } else {
      ranges.push({ label: b.label, start: s, end: e });
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}

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

/** Free windows = complement of busy blocks within the day. */
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

/**
 * Greedily place a list of requested activities into the free windows of a day.
 * requests: [{ label, totalMinutes, minBlockMinutes=30, earliest, latest, priority }]
 * Returns { placed: [{label,start,end}], unplaced: [{label,minutesShort}], warnings: [] }
 */
function placeActivities(busyBlocks, requests) {
  let windows = freeWindows(busyBlocks).map((w) => ({ ...w }));
  const placed = [];
  const warnings = [];
  const sorted = [...requests].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const req of sorted) {
    let remaining = req.totalMinutes;
    const minBlock = req.minBlockMinutes || Math.min(30, req.totalMinutes);
    const earliest = req.earliest ? hmToMinutes(req.earliest) : 0;
    const latest = req.latest ? hmToMinutes(req.latest) : DAY_MINUTES;

    for (const w of windows) {
      if (remaining <= 0) break;
      const start = Math.max(w.start, earliest);
      const end = Math.min(w.end, latest);
      const avail = end - start;
      if (avail < minBlock) continue;

      const use = Math.min(avail, remaining);
      placed.push({ label: req.label, start, end: start + use });
      remaining -= use;
      w.start = start + use; // shrink window
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

/** Detect overlaps between arbitrary {start,end} ISO datetime items. */
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
  hmToMinutes,
  minutesToHm,
  buildBusyBlocks,
  freeWindows,
  placeActivities,
  detectOverlaps,
  mergeBlocks,
  DEFAULT_PROTECTED_BLOCKS,
  MEAL_DEFAULTS,
  DECOMPRESSION_MINUTES,
};
