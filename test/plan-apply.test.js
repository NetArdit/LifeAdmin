// Plan/Scheduler Reliability phase: the HTTP-level Plan flow — /api/ai/plan and
// /api/ai/plan/apply — with the AI provider call stubbed at the same boundary the AI
// Recovery phase's own tests use (src/lib/ai.js's exported function), so these tests run
// with no credentials and exercise the REAL scheduler and the REAL /plan/apply route.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('plan / plan-apply route', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const aiLib = require('../src/lib/ai');
  const realParseLifePlan = aiLib.parseLifePlan;
  t.after(() => { aiLib.parseLifePlan = realParseLifePlan; });

  function stubPlan(data) {
    aiLib.parseLifePlan = async () => ({ ok: true, data });
  }

  async function newUser() {
    const c = makeClient(app.base);
    await signUp(c);
    return c;
  }

  await t.test('M. /plan/apply timezone behaviour: the client-supplied ISO instant is stored verbatim, independent of any date+"HH:MM" reconstruction', async () => {
    const c = await newUser();
    // Two distinct real UTC instants for the SAME calendar date + "HH:MM" label — proving the
    // server no longer reconstructs the instant itself (which would collapse both cases to the
    // same, server-timezone-dependent value).
    const preview = {
      '2027-03-10': {
        placed: [
          { label: 'Morning walk', start: '08:00', end: '08:30', startISO: '2027-03-10T08:00:00.000Z', endISO: '2027-03-10T08:30:00.000Z' },
          { label: 'Evening walk', start: '08:00', end: '08:30', startISO: '2027-03-09T22:00:00.000Z', endISO: '2027-03-09T22:30:00.000Z' }, // same "HH:MM" label, different real instant
        ],
        warnings: [],
      },
    };
    const res = await c.post('/api/ai/plan/apply', { preview });
    assert.equal(res.status, 201);
    assert.equal(res.data.created, 2);
    const rows = await db.all("SELECT title, due_date, start_time, duration_minutes FROM tasks WHERE notes = '[demo-seed]' OR notes = 'Created from AI weekly plan' ORDER BY start_time");
    const morning = rows.find((r) => r.title === 'Morning walk');
    const evening = rows.find((r) => r.title === 'Evening walk');
    assert.equal(morning.start_time, '2027-03-10T08:00:00.000Z', 'stored verbatim, not reconstructed from date+HH:MM');
    assert.equal(evening.start_time, '2027-03-09T22:00:00.000Z', 'a different client-computed instant for the identical "HH:MM" label is preserved, not collapsed');
    assert.equal(morning.duration_minutes, 30);
    assert.equal(evening.duration_minutes, 30);
    assert.equal(morning.due_date, '2027-03-10', 'the calendar date key is still taken from the preview structure');
  });

  await t.test('M2. malformed/missing ISO instants are rejected cleanly, and nothing is partially applied (transaction atomicity)', async () => {
    const c = await newUser();
    const before = (await db.get("SELECT COUNT(*) c FROM tasks WHERE notes = 'Created from AI weekly plan'")).c;
    const badCases = [
      { placed: [{ label: 'A', startISO: 'not-a-date', endISO: '2027-01-01T09:00:00.000Z' }] },
      { placed: [{ label: 'A', startISO: '2027-01-01T09:00:00.000Z', endISO: '2027-01-01T08:00:00.000Z' }] }, // end before start
      { placed: [{ label: 'A', startISO: '2027-01-01T09:00:00.000Z', endISO: '2027-01-03T09:00:01.000Z' }] }, // > 1 day, implausible
      { placed: [{ label: '', startISO: '2027-01-01T09:00:00.000Z', endISO: '2027-01-01T09:30:00.000Z' }] }, // no label
      { placed: [{ startISO: '2027-01-01T09:00:00.000Z', endISO: '2027-01-01T09:30:00.000Z' }] }, // missing label entirely
    ];
    for (const day of badCases) {
      const res = await c.post('/api/ai/plan/apply', { preview: { '2027-01-01': day } });
      assert.equal(res.status, 400, JSON.stringify(day));
    }
    assert.equal((await db.get("SELECT COUNT(*) c FROM tasks WHERE notes = 'Created from AI weekly plan'")).c, before, 'no task was created by any rejected request');
  });

  await t.test('M3. transaction atomicity: one bad block in an otherwise-valid multi-block request applies NONE of them', async () => {
    const c = await newUser();
    const before = (await db.get("SELECT COUNT(*) c FROM tasks WHERE notes = 'Created from AI weekly plan'")).c;
    const preview = {
      '2027-02-01': {
        placed: [
          { label: 'Good block', startISO: '2027-02-01T09:00:00.000Z', endISO: '2027-02-01T09:30:00.000Z' },
          { label: 'Bad block', startISO: 'garbage', endISO: '2027-02-01T10:30:00.000Z' },
        ],
      },
    };
    const res = await c.post('/api/ai/plan/apply', { preview });
    assert.equal(res.status, 400);
    assert.equal((await db.get("SELECT COUNT(*) c FROM tasks WHERE notes = 'Created from AI weekly plan'")).c, before, 'the valid "Good block" was NOT partially applied');
  });

  await t.test('/plan/apply requires authentication and only ever creates tasks owned by the caller', async () => {
    const anon = makeClient(app.base);
    const res = await anon.post('/api/ai/plan/apply', { preview: { '2027-01-01': { placed: [{ label: 'X', startISO: '2027-01-01T09:00:00.000Z', endISO: '2027-01-01T09:30:00.000Z' }] } } });
    assert.equal(res.status, 401);

    const c1 = await newUser();
    const c2 = await newUser();
    const me1 = (await c1.get('/api/auth/me')).data.user;
    const applyRes = await c1.post('/api/ai/plan/apply', { preview: { '2027-01-01': { placed: [{ label: 'Owned by c1', startISO: '2027-01-01T09:00:00.000Z', endISO: '2027-01-01T09:30:00.000Z' }] } } });
    assert.equal(applyRes.status, 201);
    const row = await db.get("SELECT owner_id FROM tasks WHERE title = 'Owned by c1'");
    assert.equal(row.owner_id, me1.id);
    const listedByC2 = (await c2.get('/api/tasks')).data.tasks.some((t2) => t2.title === 'Owned by c1');
    assert.equal(listedByC2, false, 'the other user cannot see the applied task');
  });

  await t.test('duplicate apply (known, pre-existing, unchanged limitation): applying the same preview twice creates two sets of tasks', async () => {
    const c = await newUser();
    const preview = { '2027-04-01': { placed: [{ label: 'Repeatable', startISO: '2027-04-01T09:00:00.000Z', endISO: '2027-04-01T09:30:00.000Z' }] } };
    const r1 = await c.post('/api/ai/plan/apply', { preview });
    const r2 = await c.post('/api/ai/plan/apply', { preview });
    assert.equal(r1.status, 201);
    assert.equal(r2.status, 201);
    const count = (await db.get("SELECT COUNT(*) c FROM tasks WHERE title = 'Repeatable'")).c;
    assert.equal(count, 2, 'documented, pre-existing, out-of-scope behaviour — not changed by this phase (see report)');
  });

  // ---------------- full /plan -> /plan/apply pipeline, AI stubbed ----------------
  await t.test('the real end-to-end pipeline: a realistic AI-shaped plan is placed by the real scheduler and applied with correct stored times', async () => {
    const c = await newUser();
    stubPlan({
      summary: 'A calm study week',
      workStart: '09:00',
      workEnd: '17:00',
      activities: [
        { label: 'Study JavaScript', totalMinutesPerDay: 60, minBlockMinutes: 30, earliest: '19:45', latest: '22:00', priority: 4, days: [] },
      ],
      notes: ['Protected sleep and meals.'],
    });
    const planRes = await c.post('/api/ai/plan', { text: 'I want to study JavaScript in the evenings.' });
    assert.equal(planRes.status, 200);
    assert.equal(planRes.data.ok, true);
    const days = Object.keys(planRes.data.preview);
    assert.ok(days.length >= 1, 'at least one day got a placement');
    for (const date of days) {
      assert.equal(planRes.data.preview[date].placed.length, 1);
      assert.equal(planRes.data.preview[date].placed[0].start, '19:45');
      assert.equal(planRes.data.preview[date].placed[0].end, '20:45');
      assert.deepEqual(planRes.data.preview[date].warnings, []);
    }

    // Client-side computation (mirrors PlanTab.jsx's handleApply exactly).
    const preview = {};
    for (const [date, day] of Object.entries(planRes.data.preview)) {
      preview[date] = { ...day, placed: day.placed.map((b) => ({ ...b, startISO: new Date(`${date}T${b.start}:00`).toISOString(), endISO: new Date(`${date}T${b.end}:00`).toISOString() })) };
    }
    const applyRes = await c.post('/api/ai/plan/apply', { preview });
    assert.equal(applyRes.status, 201);
    assert.equal(applyRes.data.created, days.length);

    const tasks = (await c.get('/api/tasks')).data.tasks.filter((t2) => t2.title === 'Study JavaScript');
    assert.equal(tasks.length, days.length);
    for (const t2 of tasks) {
      assert.equal(t2.durationMinutes, 60);
      const hh = new Date(t2.startTime).toISOString().slice(11, 16);
      // The stored instant, re-parsed, reproduces the SAME local wall-clock hour the test
      // process (acting as "the user's browser") originally computed it from — the whole
      // point of the timezone fix. (This test process and the app share one process/TZ here,
      // exactly like a real browser and a real server never do — which is precisely why the
      // conversion must happen client-side; see the report's timezone contract section.)
      assert.equal(hh, new Date(`${t2.dueDate}T19:45:00`).toISOString().slice(11, 16));
    }
  });

  await t.test('N. existing (non-Plan) task creation is unaffected: manual startTime is stored and returned unchanged', async () => {
    const c = await newUser();
    const startTime = new Date('2027-05-01T14:30:00.000Z').toISOString();
    const created = await c.post('/api/tasks', { title: 'Manual task', dueDate: '2027-05-01', startTime, durationMinutes: 45 });
    assert.equal(created.status, 201);
    assert.equal(created.data.task.startTime, startTime, 'manual task creation still stores the client-supplied instant verbatim, as it always has');
    const fetched = await c.get(`/api/tasks/${created.data.task.id}`);
    assert.equal(fetched.data.task.startTime, startTime);
  });
});
