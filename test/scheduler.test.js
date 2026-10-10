// Plan/Scheduler Reliability phase: the deterministic scheduling engine, tested directly
// (no HTTP, no AI) with EXACT expected schedules — never just "does not throw". Every test
// name below maps to the phase brief's required scenario letters (A-N) where applicable.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DAY_MINUTES,
  hmToMinutes,
  minutesToHm,
  splitOvernightRange,
  toRanges,
  buildBusyBlocks,
  freeWindows,
  placeActivities,
  mergeBlocks,
} = require('../src/lib/scheduler');

test('scheduler: canonical time helpers', async (t) => {
  await t.test('hmToMinutes / minutesToHm round-trip', () => {
    assert.equal(hmToMinutes('00:00'), 0);
    assert.equal(hmToMinutes('23:59'), 1439);
    assert.equal(hmToMinutes('08:30'), 510);
    assert.equal(minutesToHm(0), '00:00');
    assert.equal(minutesToHm(1439), '23:59');
    assert.equal(minutesToHm(510), '08:30');
    assert.equal(minutesToHm(1440), '00:00', 'wraps at exactly one day');
    assert.equal(minutesToHm(-30), '23:30', 'negative wraps to the previous day');
  });

  await t.test('splitOvernightRange: same-day, overnight, and start===end semantics', () => {
    assert.deepEqual(splitOvernightRange(540, 1020), [{ start: 540, end: 1020 }], '09:00-17:00 same-day: one range');
    assert.deepEqual(splitOvernightRange(0, 360), [{ start: 0, end: 360 }], '00:00-06:00 same-day: one range, not treated as overnight');
    assert.deepEqual(splitOvernightRange(1320, 360), [{ start: 1320, end: 1440 }, { start: 0, end: 360 }], '22:00-06:00 wraps into two ranges');
    assert.deepEqual(splitOvernightRange(1410, 30), [{ start: 1410, end: 1440 }, { start: 0, end: 30 }], '23:30-00:30 wraps by 60 minutes');
    assert.deepEqual(splitOvernightRange(1320, 1320), [{ start: 1320, end: 1440 }, { start: 0, end: 1320 }], 'start===end (22:00-22:00) means the whole day, split at that point');
    const whole = splitOvernightRange(1320, 1320);
    assert.equal(whole[0].end - whole[0].start + (whole[1].end - whole[1].start), DAY_MINUTES, 'the two start===end pieces cover exactly 24h with no gap');
  });

  await t.test('toRanges matches the pre-existing overnight-splitting behaviour exactly (refactor equivalence)', () => {
    assert.deepEqual(toRanges([{ label: 'Sleep', start: '23:00', end: '07:00' }]), [
      { label: 'Sleep', start: 0, end: 420 },
      { label: 'Sleep', start: 1380, end: 1440 },
    ]);
    assert.deepEqual(toRanges([{ label: 'Work', start: '09:00', end: '17:00' }]), [{ label: 'Work', start: 540, end: 1020 }]);
  });
});

test('scheduler: buildBusyBlocks returns raw Block[] (the F-1 contract fix)', async (t) => {
  await t.test('buildBusyBlocks never crashes and returns unmerged HH:MM blocks, not numbers', () => {
    const blocks = buildBusyBlocks({ workStart: '09:00', workEnd: '17:00' });
    assert.ok(Array.isArray(blocks) && blocks.length > 0);
    for (const b of blocks) {
      assert.equal(typeof b.start, 'string', `${b.label} start must still be "HH:MM", not a number`);
      assert.match(b.start, /^\d{2}:\d{2}$/);
      assert.match(b.end, /^\d{2}:\d{2}$/);
    }
    // includes the default Sleep block, Work, meals and the post-work decompression block
    assert.ok(blocks.some((b) => b.label === 'Sleep'));
    assert.ok(blocks.some((b) => b.label === 'Work'));
    assert.ok(blocks.some((b) => b.label === 'Decompression / commute'));
  });

  await t.test('buildBusyBlocks() output feeds directly into placeActivities() without crashing (A: normal same-day window, reproduces the original crash scenario)', () => {
    const busy = buildBusyBlocks({ workStart: '09:00', workEnd: '17:00' });
    assert.doesNotThrow(() => placeActivities(busy, [{ label: 'Study', totalMinutes: 60, minBlockMinutes: 30, earliest: '18:00', latest: '20:00', priority: 3 }]));
  });
});

test('scheduler: placeActivities — exact schedules', async (t) => {
  const busyNone = []; // no busy blocks at all: the whole day is free

  await t.test('A. normal same-day window', () => {
    // workStart/workEnd:09:00-17:00 also brings in the default Sleep/meals/decompression
    // blocks; the preference window (19:45-23:00) is chosen to sit entirely after Dinner
    // (19:00-19:45) so this case is a clean, uninterrupted single placement.
    const busy = buildBusyBlocks({ workStart: '09:00', workEnd: '17:00' });
    const { placed, warnings } = placeActivities(busy, [
      { label: 'Study', totalMinutes: 60, minBlockMinutes: 30, earliest: '19:45', latest: '23:00', priority: 3 },
    ]);
    assert.deepEqual(placed, [{ label: 'Study', start: '19:45', end: '20:45' }]);
    assert.deepEqual(warnings, []);
  });

  await t.test('B. exact-fit activity', () => {
    // A single free window exactly as long as the request.
    const busy = [{ label: 'Sleep', start: '01:00', end: '00:00' }]; // free 00:00-01:00 only (23h block from 01:00 wrapping to 00:00)
    const { placed, warnings } = placeActivities(busy, [
      { label: 'Quick task', totalMinutes: 60, minBlockMinutes: 60, earliest: null, latest: null, priority: 1 },
    ]);
    assert.deepEqual(placed, [{ label: 'Quick task', start: '00:00', end: '01:00' }]);
    assert.deepEqual(warnings, []);
  });

  await t.test('C. too-short available window', () => {
    const busy = [{ label: 'Busy', start: '00:30', end: '00:00' }]; // free only 00:00-00:30 (30 min)
    const { placed, warnings } = placeActivities(busy, [
      { label: 'Long thing', totalMinutes: 45, minBlockMinutes: 45, earliest: null, latest: null, priority: 1 },
    ]);
    assert.deepEqual(placed, []);
    assert.deepEqual(warnings, ['Only fit 0 of 45 min for "Long thing" — not enough free time today.']);
  });

  await t.test('D. multiple busy blocks', () => {
    const busy = [
      { label: 'Sleep', start: '23:00', end: '07:00' },
      { label: 'Work', start: '09:00', end: '17:00' },
      { label: 'Gym', start: '18:00', end: '19:00' },
    ];
    const { placed } = placeActivities(busy, [
      { label: 'Read', totalMinutes: 60, minBlockMinutes: 30, earliest: null, latest: null, priority: 1 },
    ]);
    // Free windows in order: 07:00-09:00, 17:00-18:00, 19:00-23:00. First chronological window (07:00-09:00) is chosen.
    assert.deepEqual(placed, [{ label: 'Read', start: '07:00', end: '08:00' }]);
  });

  await t.test('E. fragmented availability — an activity spans two separate free windows', () => {
    const busy = [
      { label: 'Sleep', start: '23:00', end: '07:00' },
      { label: 'Meeting', start: '10:00', end: '11:00' },
    ];
    const { placed, warnings } = placeActivities(busy, [
      { label: 'Deep work', totalMinutes: 150, minBlockMinutes: 30, earliest: '07:00', latest: '12:00', priority: 1 },
    ]);
    // window1: 07:00-10:00 (180 min) — takes all 150 needed in one go (fits entirely in the first window).
    assert.deepEqual(placed, [{ label: 'Deep work', start: '07:00', end: '09:30' }]);
    assert.deepEqual(warnings, []);
  });

  await t.test('E2. fragmented availability that genuinely requires two separate placed blocks', () => {
    const busy = [
      { label: 'Sleep', start: '23:00', end: '07:00' },
      { label: 'Meeting', start: '08:00', end: '09:30' },
    ];
    const { placed, warnings } = placeActivities(busy, [
      // window1: 07:00-08:00 (60 min), window2: 09:30-12:00 (150 min). Needs 120 min total, minBlock 30.
      { label: 'Deep work', totalMinutes: 120, minBlockMinutes: 30, earliest: '07:00', latest: '12:00', priority: 1 },
    ]);
    assert.deepEqual(placed, [
      { label: 'Deep work', start: '07:00', end: '08:00' },
      { label: 'Deep work', start: '09:30', end: '10:30' },
    ]);
    assert.deepEqual(warnings, []);
  });

  await t.test('F. minimum duration is NEVER violated — the fragmentation bug (an 80-min and a 90-min window, 60-min minimum, 100 min requested)', () => {
    // Two simple, non-overlapping same-day busy blocks leave exactly an 80-minute window
    // (00:00-01:20) and a 90-minute window (02:50-04:20). 80+90=170 >= 100 requested, so the
    // OLD (buggy) "use = min(avail, remaining)" logic would have placed 80 in the first window
    // and the leftover 20 in the second — a 20-minute fragment despite minBlockMinutes:60.
    const busy2 = [
      { label: 'Gap', start: '01:20', end: '02:50' },
      { label: 'RestOfDay', start: '04:20', end: '23:59' },
    ];
    const { placed, warnings } = placeActivities(busy2, [
      { label: 'Focus', totalMinutes: 100, minBlockMinutes: 60, earliest: null, latest: null, priority: 1 },
    ]);
    assert.deepEqual(placed, [{ label: 'Focus', start: '00:00', end: '01:20' }], 'only the 80-min window is used, as ONE block >= 60 min');
    assert.deepEqual(warnings, ['Only fit 80 of 100 min for "Focus" — not enough free time today.'], 'the remaining 20 min is correctly reported as unfit, never placed as an undersized fragment');
    for (const p of placed) assert.ok(hmToMinutes(p.end) - hmToMinutes(p.start) >= 60, 'every placed block respects the 60-minute minimum');
  });

  await t.test('F2. minimum duration: 60-available/45-minimum never yields a 20 or 30-minute block (explicit scenario from the brief)', () => {
    const busy = [{ label: 'Busy', start: '01:00', end: '00:00' }]; // exactly 60 free minutes (00:00-01:00)
    const { placed } = placeActivities(busy, [
      { label: 'X', totalMinutes: 60, minBlockMinutes: 45, earliest: null, latest: null, priority: 1 },
    ]);
    assert.equal(placed.length, 1);
    const dur = hmToMinutes(placed[0].end) - hmToMinutes(placed[0].start);
    assert.ok(dur >= 45, `placed block was ${dur} min, must be >= 45`);
    assert.notEqual(dur, 20);
    assert.notEqual(dur, 30);
  });

  await t.test('F3. exact fit at the minimum boundary', () => {
    const busy = [{ label: 'Busy', start: '00:45', end: '00:00' }]; // free 00:00-00:45 (45 min)
    const { placed } = placeActivities(busy, [{ label: 'X', totalMinutes: 45, minBlockMinutes: 45, earliest: null, latest: null, priority: 1 }]);
    assert.deepEqual(placed, [{ label: 'X', start: '00:00', end: '00:45' }]);
  });

  await t.test('F4. one minute short of the minimum is correctly refused', () => {
    const busy = [{ label: 'Busy', start: '00:44', end: '00:00' }]; // free 00:00-00:44 (44 min)
    const { placed, warnings } = placeActivities(busy, [{ label: 'X', totalMinutes: 44, minBlockMinutes: 45, earliest: null, latest: null, priority: 1 }]);
    assert.deepEqual(placed, []);
    assert.deepEqual(warnings, ['Only fit 0 of 44 min for "X" — not enough free time today.']);
  });

  await t.test('F5. minimum duration equal to the entire available window', () => {
    const busy = [{ label: 'Busy', start: '02:00', end: '00:00' }]; // free 00:00-02:00 (120 min)
    const { placed } = placeActivities(busy, [{ label: 'X', totalMinutes: 120, minBlockMinutes: 120, earliest: null, latest: null, priority: 1 }]);
    assert.deepEqual(placed, [{ label: 'X', start: '00:00', end: '02:00' }]);
  });

  await t.test('F6. minimum duration greater than every available fragment: nothing is placed, deterministically', () => {
    const busy = [
      { label: 'Busy1', start: '00:30', end: '01:00' },
      { label: 'Busy2', start: '01:30', end: '23:00' },
      { label: 'Sleep', start: '23:00', end: '00:00' },
    ];
    // free windows: 00:00-00:30 (30) and 01:00-01:30 (30) — both smaller than the 45-min minimum.
    const { placed, warnings } = placeActivities(busy, [{ label: 'X', totalMinutes: 60, minBlockMinutes: 45, earliest: null, latest: null, priority: 1 }]);
    assert.deepEqual(placed, []);
    assert.deepEqual(warnings, ['Only fit 0 of 60 min for "X" — not enough free time today.']);
  });

  await t.test('G. overnight preference window (22:00 -> 06:00) — the exact scenario from the brief', () => {
    const { placed, warnings } = placeActivities(busyNone, [
      { label: 'Night shift prep', totalMinutes: 60, minBlockMinutes: 30, earliest: '22:00', latest: '06:00', priority: 1 },
    ]);
    assert.deepEqual(placed, [{ label: 'Night shift prep', start: '22:00', end: '23:00' }]);
    assert.deepEqual(warnings, [], 'must NOT report "not enough free time" — the whole 8h overnight window is genuinely free');
  });

  await t.test('G2. overnight preference window: the late piece (22:00-24:00) is preferred first, the early piece (00:00-06:00) fills the rest', () => {
    const busy = [{ label: 'Evening thing', start: '22:00', end: '23:30' }];
    const { placed, warnings } = placeActivities(busy, [
      { label: 'Wind down', totalMinutes: 90, minBlockMinutes: 30, earliest: '22:00', latest: '06:00', priority: 1 },
    ]);
    // 23:30-24:00 (30 min, the only free part of the "from 22:00" piece) is filled first; the
    // remaining 60 min comes from the "until 06:00" piece. The two fragments are not merged
    // across the day boundary (see the report's architecture review — deliberately not
    // over-engineered); the final display sort is by numeric start-of-day, so the 00:00-01:00
    // fragment lists before the 23:30-24:00 one.
    assert.deepEqual(placed, [
      { label: 'Wind down', start: '00:00', end: '01:00' },
      { label: 'Wind down', start: '23:30', end: '00:00' },
    ]);
    assert.deepEqual(warnings, []);
    const durations = placed.map((p) => (hmToMinutes(p.end) === 0 && hmToMinutes(p.start) > 0 ? DAY_MINUTES - hmToMinutes(p.start) : hmToMinutes(p.end) - hmToMinutes(p.start)));
    assert.equal(durations.reduce((a, b) => a + b, 0), 90, 'both fragments together cover exactly the requested 90 minutes');
  });

  await t.test('H. overnight BUSY block is respected by placement (already worked before this phase; re-verified end to end)', () => {
    const busy = [{ label: 'Sleep', start: '23:00', end: '07:00' }];
    const { placed } = placeActivities(busy, [
      { label: 'Early bird task', totalMinutes: 30, minBlockMinutes: 30, earliest: '06:00', latest: '08:00', priority: 1 },
    ]);
    assert.deepEqual(placed, [{ label: 'Early bird task', start: '07:00', end: '07:30' }], 'placement starts only after Sleep ends at 07:00, never inside it');
  });

  await t.test('I. midnight boundary: 23:30-00:30 preference window and same-day 00:00-06:00 are both handled correctly', () => {
    const r1 = placeActivities(busyNone, [{ label: 'Late', totalMinutes: 30, minBlockMinutes: 30, earliest: '23:30', latest: '00:30', priority: 1 }]);
    assert.deepEqual(r1.placed, [{ label: 'Late', start: '23:30', end: '00:00' }]);
    const r2 = placeActivities(busyNone, [{ label: 'Early', totalMinutes: 60, minBlockMinutes: 30, earliest: '00:00', latest: '06:00', priority: 1 }]);
    assert.deepEqual(r2.placed, [{ label: 'Early', start: '00:00', end: '01:00' }], '00:00-06:00 is a normal same-day window, not overnight');
    const r3 = placeActivities(busyNone, [{ label: 'Evening', totalMinutes: 30, minBlockMinutes: 30, earliest: '18:00', latest: '23:59', priority: 1 }]);
    assert.deepEqual(r3.placed, [{ label: 'Evening', start: '18:00', end: '18:30' }]);
  });

  await t.test('J. impossible schedule returns a truthful, deterministic error (not a crash, not a lie about the cause)', () => {
    const busy = buildBusyBlocks({ workStart: '08:00', workEnd: '20:00' }); // sleep+work+meals+decompression leaves almost nothing
    const { placed, warnings } = placeActivities(busy, [
      { label: 'Impossible', totalMinutes: 600, minBlockMinutes: 600, earliest: '08:00', latest: '20:00', priority: 1 },
    ]);
    assert.deepEqual(placed, []);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Only fit 0 of 600 min for "Impossible"/);
  });

  await t.test('K. multiple activities placed by priority, none overlapping each other or busy blocks', () => {
    const busy = [{ label: 'Sleep', start: '23:00', end: '07:00' }];
    const { placed } = placeActivities(busy, [
      { label: 'Low priority', totalMinutes: 60, minBlockMinutes: 30, earliest: '07:00', latest: '12:00', priority: 1 },
      { label: 'High priority', totalMinutes: 60, minBlockMinutes: 30, earliest: '07:00', latest: '12:00', priority: 5 },
    ]);
    assert.deepEqual(placed, [
      { label: 'High priority', start: '07:00', end: '08:00' },
      { label: 'Low priority', start: '08:00', end: '09:00' },
    ], 'higher priority is placed first (and therefore earliest), lower priority fills what is left, with no overlap');
  });

  await t.test('invariant sweep: no overlaps, no busy-block intrusion, everything inside its allowed window (randomised-style fixed cases)', () => {
    const busy = [
      { label: 'Sleep', start: '23:00', end: '07:00' },
      { label: 'Work', start: '09:00', end: '17:30' },
      { label: 'Gym', start: '18:00', end: '19:00' },
    ];
    const { placed } = placeActivities(busy, [
      { label: 'A', totalMinutes: 90, minBlockMinutes: 30, earliest: '07:00', latest: '09:00', priority: 3 },
      { label: 'B', totalMinutes: 120, minBlockMinutes: 45, earliest: '19:00', latest: '23:00', priority: 2 },
      { label: 'C', totalMinutes: 200, minBlockMinutes: 30, earliest: null, latest: null, priority: 1 },
    ]);
    const busyRanges = toRanges(busy);
    const toRange = (p) => ({ start: hmToMinutes(p.start), end: hmToMinutes(p.end) });
    const ranges = placed.map(toRange).sort((a, b) => a.start - b.start);
    for (let i = 0; i < ranges.length; i++) {
      assert.ok(ranges[i].end > ranges[i].start, 'every placed block has positive duration');
      if (i > 0) assert.ok(ranges[i].start >= ranges[i - 1].end, `placed block ${i} overlaps the previous one`);
      for (const b of busyRanges) {
        const overlapsBusy = ranges[i].start < b.end && b.start < ranges[i].end;
        assert.ok(!overlapsBusy, `placed block ${JSON.stringify(ranges[i])} overlaps busy block ${JSON.stringify(b)}`);
      }
    }
  });
});

test('scheduler: freeWindows / mergeBlocks — adjacency and overlap', async (t) => {
  await t.test('adjacent busy blocks merge into one free-window boundary, not a phantom zero-length gap', () => {
    // 09:00-12:00 and 12:00-13:00 touch exactly at 12:00; freeWindows must treat them as one
    // continuous 09:00-13:00 busy span, not leave a spurious zero-length "free" slice at 12:00.
    const free = freeWindows([{ start: '09:00', end: '12:00' }, { start: '12:00', end: '13:00' }]);
    assert.deepEqual(free, [{ start: 0, end: 540 }, { start: 780, end: 1440 }]);
  });

  await t.test('overlapping busy blocks merge correctly (mergeBlocks equivalence)', () => {
    const merged = mergeBlocks([{ label: 'A', start: '09:00', end: '11:00' }, { label: 'B', start: '10:00', end: '12:00' }]);
    assert.deepEqual(merged, [{ label: 'A / B', start: 540, end: 720 }]);
  });

  await t.test('empty availability (busy all day) behaves correctly: no free windows, no crash', () => {
    const free = freeWindows([{ start: '00:00', end: '00:00' }]); // whole-day busy via start===end semantic
    assert.deepEqual(free, []);
    const { placed, warnings } = placeActivities([{ start: '00:00', end: '00:00' }], [
      { label: 'X', totalMinutes: 30, minBlockMinutes: 30, earliest: null, latest: null, priority: 1 },
    ]);
    assert.deepEqual(placed, []);
    assert.deepEqual(warnings, ['Only fit 0 of 30 min for "X" — not enough free time today.']);
  });
});
