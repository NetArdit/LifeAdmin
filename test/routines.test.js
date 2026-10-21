// Routines: recurrence in the person's own time zone (DST, a change of zone), reminders that are planned once
// per occurrence, pause / edit / delete, missed days that are never "done", and ownership.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

const DAILY = (time) => ({ time_of_day: time, days_of_week: '[]', follow_profile_zone: 1, enabled: 1 });
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

test('routines: the clock arithmetic (no database)', async (t) => {
  const r = require('../src/lib/reminders');

  await t.test('every day at one time: that time on every day, in the zone', () => {
    const now = Date.UTC(2026, 5, 10, 6, 0); // 08:00 in Budapest (CEST)
    const occ = r.routineOccurrences(DAILY('07:30'), 'Europe/Budapest', now, { backHours: 0, ahead: 3 });
    assert.deepEqual(occ.map((o) => o.date), ['2026-06-11', '2026-06-12', '2026-06-13']);
    for (const o of occ) assert.equal(r.wallAt(o.at, 'Europe/Budapest').time, '07:30');
  });

  await t.test('chosen weekdays only', () => {
    const routine = { time_of_day: '18:00', days_of_week: JSON.stringify([1, 3]), follow_profile_zone: 1, enabled: 1 }; // Mon, Wed
    const now = Date.UTC(2026, 5, 8, 0, 0); // Monday 2026-06-08
    const occ = r.routineOccurrences(routine, 'Europe/Budapest', now, { backHours: 0, ahead: 8 });
    assert.deepEqual(occ.map((o) => o.date), ['2026-06-08', '2026-06-10', '2026-06-15', '2026-06-17'].slice(0, occ.length));
    for (const o of occ) assert.ok([1, 3].includes(new Date(`${o.date}T00:00:00Z`).getUTCDay()));
  });

  await t.test('spring forward: a time that does not exist happens at the later moment, once', () => {
    const now = Date.UTC(2026, 2, 28, 12, 0);
    const occ = r.routineOccurrences(DAILY('02:30'), 'Europe/Budapest', now, { backHours: 0, ahead: 2 });
    const day = occ.find((o) => o.date === '2026-03-29');
    assert.equal(iso(day.at), '2026-03-29T01:30:00Z'); // 03:30 CEST: 02:30 never happened
    assert.equal(occ.filter((o) => o.date === '2026-03-29').length, 1);
    // The days around it keep 02:30 local.
    assert.equal(r.wallAt(occ.find((o) => o.date === '2026-03-30').at, 'Europe/Budapest').time, '02:30');
  });

  await t.test('fall back: a time that happens twice is one occurrence, the later one', () => {
    const now = Date.UTC(2026, 9, 24, 12, 0);
    const occ = r.routineOccurrences(DAILY('02:30'), 'Europe/Budapest', now, { backHours: 0, ahead: 2 });
    const day = occ.filter((o) => o.date === '2026-10-25');
    assert.equal(day.length, 1);
    assert.equal(iso(day[0].at), '2026-10-25T01:30:00Z'); // the second 02:30 (CET)
  });

  await t.test('a normal 07:30 keeps its wall time across the change of clocks', () => {
    const now = Date.UTC(2026, 2, 27, 12, 0);
    const occ = r.routineOccurrences(DAILY('07:30'), 'Europe/Budapest', now, { backHours: 0, ahead: 3 });
    for (const o of occ) assert.equal(r.wallAt(o.at, 'Europe/Budapest').time, '07:30');
    assert.equal(iso(occ.find((o) => o.date === '2026-03-28').at), '2026-03-28T06:30:00Z'); // CET
    assert.equal(iso(occ.find((o) => o.date === '2026-03-30').at), '2026-03-30T05:30:00Z'); // CEST
  });

  await t.test('another zone gives other moments for the same wall time', () => {
    const now = Date.UTC(2026, 5, 10, 0, 0);
    const a = r.routineOccurrences(DAILY('08:00'), 'Europe/Budapest', now, { backHours: 0, ahead: 1 })[0];
    const b = r.routineOccurrences(DAILY('08:00'), 'America/New_York', now, { backHours: 0, ahead: 1 })[0];
    assert.equal(r.wallAt(a.at, 'Europe/Budapest').time, '08:00');
    assert.equal(r.wallAt(b.at, 'America/New_York').time, '08:00');
    assert.equal(b.at - a.at, 6 * 3600000);
  });

  await t.test('a paused routine has no next moment', () => {
    assert.equal(r.nextRoutineMoment({ ...DAILY('08:00'), enabled: 0 }, 'Europe/Budapest', Date.now()), null);
  });
});

test('routines: the API, the plan and the clock', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const worker = require('../src/lib/reminderWorker');
  const r = require('../src/lib/reminders');

  async function person() {
    const c = makeClient(app.base);
    const { res } = await signUp(c);
    await c.patch('/api/settings/reminders', { timezone: 'Europe/Budapest' });
    return { c, id: res.data.user.id };
  }
  const rows = (id, status) => db.all(`SELECT * FROM planned_reminders WHERE source_type = 'routine' AND source_id = ?${status ? ' AND status = ?' : ''} ORDER BY scheduled_at`, status ? [id, status] : [id]);
  const localTimeIn = (zone, ms) => r.wallAt(ms, zone).time;

  await t.test('creating validates, stores the zone, and plans one reminder per coming occurrence', async () => {
    const { c } = await person();
    assert.equal((await c.post('/api/routines', { title: '', time: '07:30' })).status, 400);
    assert.equal((await c.post('/api/routines', { title: 'Run', time: '7:30' })).status, 400);
    assert.equal((await c.post('/api/routines', { title: 'Run', time: '07:30', days: [7] })).status, 400);
    assert.equal((await c.post('/api/routines', { title: 'Run', time: '07:30', kind: 'surgery' })).status, 400);
    assert.equal((await c.post('/api/routines', { title: 'Run', time: '07:30', timezone: 'Mars/Base' })).status, 400);
    const made = await c.post('/api/routines', { title: 'Morning run', details: 'Park loop', kind: 'exercise', time: '07:30' });
    assert.equal(made.status, 201);
    const routine = made.data.routine;
    assert.equal(routine.timezone, 'Europe/Budapest');
    assert.deepEqual(routine.days, []);
    assert.equal(routine.enabled, true);
    assert.equal(routine.followsProfileZone, true);
    assert.ok(routine.nextAt);
    const planned = await rows(routine.id, 'pending');
    assert.ok(planned.length >= 2 && planned.length <= 3);
    for (const p of planned) assert.equal(localTimeIn('Europe/Budapest', Date.parse(p.scheduled_at)), '07:30');
    // Planning again changes nothing: no duplicates.
    await r.replanRoutine(routine.id);
    await r.replanAllRoutines();
    assert.equal((await rows(routine.id)).length, planned.length);
    const keys = new Set((await rows(routine.id)).map((p) => `${p.occurrence_key}|${p.rule_key}`));
    assert.equal(keys.size, planned.length);
  });

  await t.test('the clock delivers an occurrence once, to the bell, with words that claim nothing', async () => {
    const { c, id } = await person();
    const routine = (await c.post('/api/routines', { title: 'Meditate', kind: 'meditation', time: '21:00' })).data.routine;
    const [first] = await rows(routine.id, 'pending');
    const now = Date.parse(first.scheduled_at) + 1000;
    const a = await worker.runDue({ now });
    const b = await worker.runDue({ now });
    assert.equal(a.sent, 1);
    assert.equal(b.sent, 0, 'the same occurrence is not sent twice');
    const bell = await db.all("SELECT title, body, link FROM notifications WHERE user_id = ? AND type = 'routine'", [id]);
    assert.equal(bell.length, 1);
    assert.equal(bell[0].body, 'Meditate');
    assert.doesNotMatch(`${bell[0].title} ${bell[0].body}`, /done|completed|took|did it/i);
    // It never became a check-in by itself.
    assert.equal(Number((await db.get('SELECT COUNT(*) AS c FROM routine_checkins')).c), 0);
  });

  await t.test('pause cancels what is pending and sends nothing; resume plans again', async () => {
    const { c, id } = await person();
    const routine = (await c.post('/api/routines', { title: 'Stretch', time: '06:45' })).data.routine;
    assert.ok((await rows(routine.id, 'pending')).length > 0);
    const paused = await c.patch(`/api/routines/${routine.id}`, { enabled: false });
    assert.equal(paused.data.routine.enabled, false);
    assert.equal(paused.data.routine.nextAt, null);
    assert.equal((await rows(routine.id, 'pending')).length, 0);
    const far = Date.now() + 5 * 86400000;
    await worker.runDue({ now: far });
    assert.equal(Number((await db.get("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND type = 'routine'", [id])).c), 0);
    assert.equal((await rows(routine.id, 'pending')).length, 0, 'the clock does not plan a paused routine');
    await c.patch(`/api/routines/${routine.id}`, { enabled: true });
    assert.ok((await rows(routine.id, 'pending')).length > 0);
  });

  await t.test('editing the time cancels the old reminders and plans the new ones; weekdays are respected', async () => {
    const { c } = await person();
    const routine = (await c.post('/api/routines', { title: 'Yoga', time: '07:00' })).data.routine;
    const before = (await rows(routine.id, 'pending')).map((p) => p.scheduled_at);
    const edited = await c.patch(`/api/routines/${routine.id}`, { time: '19:15', days: [1, 2, 3, 4, 5] });
    assert.equal(edited.data.routine.time, '19:15');
    const all = await rows(routine.id);
    const pending = all.filter((p) => p.status === 'pending');
    for (const p of pending) {
      assert.equal(localTimeIn('Europe/Budapest', Date.parse(p.scheduled_at)), '19:15');
      const dow = new Date(`${p.occurrence_key}T00:00:00Z`).getUTCDay();
      assert.ok(dow >= 1 && dow <= 5, 'weekends have none');
    }
    for (const old of before) assert.ok(!pending.some((p) => p.scheduled_at === old), 'the old moments are gone');
    assert.ok(all.some((p) => p.status === 'cancelled'), 'the old rows are cancelled, not left to fire');
  });

  await t.test('a change of the person’s time zone moves a routine that follows it, and not one with a fixed zone', async () => {
    const { c } = await person();
    const follows = (await c.post('/api/routines', { title: 'Follows me', time: '08:00' })).data.routine;
    const fixed = (await c.post('/api/routines', { title: 'Fixed', time: '08:00', timezone: 'Asia/Tokyo' })).data.routine;
    assert.equal(fixed.followsProfileZone, false);
    const s = await c.patch('/api/settings/reminders', { timezone: 'America/New_York' });
    assert.equal(s.status, 200);
    for (const p of await rows(follows.id, 'pending')) assert.equal(localTimeIn('America/New_York', Date.parse(p.scheduled_at)), '08:00');
    for (const p of await rows(fixed.id, 'pending')) assert.equal(localTimeIn('Asia/Tokyo', Date.parse(p.scheduled_at)), '08:00');
    const list = (await c.get('/api/routines')).data.routines;
    assert.equal(list.find((x) => x.id === follows.id).timezone, 'America/New_York');
    assert.equal(list.find((x) => x.id === fixed.id).timezone, 'Asia/Tokyo');
  });

  await t.test('delete removes the routine and every planned reminder', async () => {
    const { c } = await person();
    const routine = (await c.post('/api/routines', { title: 'Temp', time: '10:00' })).data.routine;
    assert.equal((await c.del(`/api/routines/${routine.id}`)).status, 200);
    assert.equal((await rows(routine.id)).length, 0);
    assert.equal((await c.del(`/api/routines/${routine.id}`)).status, 404);
  });

  await t.test('today: upcoming, due and missed; a missed one is never done; only the person ticks it', async () => {
    const { c } = await person();
    const zone = 'Europe/Budapest';
    const at = (deltaMin) => r.wallAt(Date.now() + deltaMin * 60000, zone);
    const hm = (m) => at(m).time;
    const sameDay = (m) => at(m).date === at(0).date;
    const missed = (await c.post('/api/routines', { title: 'Missed one', time: hm(-180) })).data.routine;
    const due = (await c.post('/api/routines', { title: 'Due one', time: hm(-10) })).data.routine;
    const upcoming = (await c.post('/api/routines', { title: 'Later one', time: hm(120) })).data.routine;
    const med = (await c.post('/api/routines', { title: 'My tablet', kind: 'medication', time: hm(-300) })).data.routine;
    assert.match(med.note, /not medical advice/i);
    assert.match(med.note, /never suggests/i);

    const today = (await c.get('/api/routines/today')).data.items;
    const get = (rt) => today.filter((i) => i.routineId === rt.id);
    if (sameDay(-180)) assert.equal(get(missed).find((i) => i.date === at(0).date).status, 'missed');
    if (sameDay(-10)) assert.equal(get(due).find((i) => i.date === at(0).date).status, 'due');
    if (sameDay(120)) assert.equal(get(upcoming).find((i) => i.date === at(0).date).status, 'upcoming');
    assert.ok(today.every((i) => i.status !== 'done'), 'nothing is done until the person says so');
    assert.ok(today.find((i) => i.routineId === med.id).note);

    // The person ticks one; it can be repeated and taken back.
    const day = get(missed)[0] ? get(missed)[0].date : at(0).date;
    assert.equal((await c.post(`/api/routines/${missed.id}/checkin`, { date: day })).status, 200);
    assert.equal((await c.post(`/api/routines/${missed.id}/checkin`, { date: day })).status, 200);
    assert.equal(Number((await db.get('SELECT COUNT(*) AS c FROM routine_checkins WHERE routine_id = ?', [missed.id])).c), 1);
    assert.equal((await c.get('/api/routines/today')).data.items.find((i) => i.routineId === missed.id && i.date === day).status, 'done');
    assert.equal((await c.del(`/api/routines/${missed.id}/checkin/${day}`)).status, 200);
    assert.equal((await c.get('/api/routines/today')).data.items.find((i) => i.routineId === missed.id && i.date === day).status, 'missed');
    // A day that is not an occurrence, or is far away, cannot be ticked.
    assert.equal((await c.post(`/api/routines/${missed.id}/checkin`, { date: '2001-01-01' })).status, 400);
    assert.equal((await c.post(`/api/routines/${missed.id}/checkin`, {})).status, 400);
  });

  await t.test('only the owner can see, change, tick or delete a routine', async () => {
    const a = await person();
    const b = await person();
    const routine = (await a.c.post('/api/routines', { title: 'Private', time: '09:00' })).data.routine;
    assert.equal((await b.c.get('/api/routines')).data.routines.length, 0);
    assert.equal((await b.c.patch(`/api/routines/${routine.id}`, { title: 'Hijack' })).status, 404);
    assert.equal((await b.c.del(`/api/routines/${routine.id}`)).status, 404);
    assert.equal((await b.c.post(`/api/routines/${routine.id}/checkin`, { date: '2030-01-01' })).status, 404);
    assert.equal((await makeClient(app.base).get('/api/routines')).status, 401);
    assert.equal((await db.get('SELECT title FROM routines WHERE id = ?', [routine.id])).title, 'Private');
  });

  await t.test('a person may keep up to 30 routines', async () => {
    const { c } = await person();
    for (let i = 0; i < 30; i++) assert.equal((await c.post('/api/routines', { title: `R${i}`, time: '12:00' })).status, 201);
    assert.equal((await c.post('/api/routines', { title: 'One more', time: '12:00' })).status, 400);
  });
});
