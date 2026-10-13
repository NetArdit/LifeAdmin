// Reminders that depend on time, unit 1: the moment is worked out in the person's own time zone, and the
// table of planned reminders follows what happens to the item. Nothing is sent yet.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

const ZONE = 'Europe/Belgrade';
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
// A date far enough ahead that none of its reminders is already in the past.
function ahead(days) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
}

test('reminders: the clock', async (t) => {
  // The app first: it is what points the database module at this file's own disposable database. Loading
  // the planner before it would open the developer's database instead.
  const app = await startApp();
  t.after(() => app.close());
  const r = require('../src/lib/reminders');

  await t.test('a wall time becomes the right UTC moment in winter and in summer', () => {
    assert.equal(iso(r.wallToUtc('2026-01-15', '09:00', ZONE)), '2026-01-15T08:00:00Z');
    assert.equal(iso(r.wallToUtc('2026-07-15', '09:00', ZONE)), '2026-07-15T07:00:00Z');
    assert.equal(iso(r.wallToUtc('2026-07-15', '09:00', 'America/New_York')), '2026-07-15T13:00:00Z');
    assert.deepEqual({ date: r.wallAt(Date.parse('2026-07-15T22:30:00Z'), ZONE).date, time: r.wallAt(Date.parse('2026-07-15T22:30:00Z'), ZONE).time }, { date: '2026-07-16', time: '00:30' });
  });

  await t.test('"three days before at 09:00" stays at 09:00 across a change of clocks', () => {
    // Clocks go back on 2026-10-25 and forward on 2027-03-28.
    assert.equal(iso(r.remindAt({ date: '2026-10-26', time: '09:00' }, 4320, ZONE)), '2026-10-23T07:00:00Z');
    assert.equal(iso(r.remindAt({ date: '2027-03-29', time: '09:00' }, 4320, ZONE)), '2027-03-26T08:00:00Z');
    // Hours are taken off the clock: one hour before 09:00.
    assert.equal(iso(r.remindAt({ date: '2026-07-15', time: '09:00' }, 60, ZONE)), '2026-07-15T06:00:00Z');
  });

  await t.test('an hour that does not exist, or happens twice, gives the later moment', () => {
    // 02:30 on 2027-03-28 does not exist in this zone: the reminder is at 03:30.
    assert.equal(iso(r.wallToUtc('2027-03-28', '02:30', ZONE)), '2027-03-28T01:30:00Z');
    // 02:30 on 2026-10-25 happens twice: the second one.
    assert.equal(iso(r.wallToUtc('2026-10-25', '02:30', ZONE)), '2026-10-25T01:30:00Z');
  });

  await t.test('zones and choices from a client are checked', () => {
    assert.equal(r.isZone('Europe/Belgrade'), true);
    for (const bad of ['Mars/Olympus', '', null, 42, 'Europe/Belgrade; DROP', 'x'.repeat(80)]) assert.equal(r.isZone(bad), false);
    assert.deepEqual(r.parseReminder({ mode: 'custom', minutesBefore: 1440 }), { mode: 'custom', minutes: 1440 });
    assert.deepEqual(r.parseReminder({ mode: 'none', minutesBefore: 60 }), { mode: 'none', minutes: null });
    assert.equal(r.parseReminder(undefined), undefined);
    for (const bad of [null, 'none', { mode: 'loud' }, { mode: 'custom' }, { mode: 'custom', minutesBefore: 17 }, { mode: 'custom', minutesBefore: '60' }]) {
      assert.throws(() => r.parseReminder(bad), { name: 'ValidationError' });
    }
    assert.throws(() => r.parsePrefs({ dateOnlyTime: '25:00' }), { name: 'ValidationError' });
    assert.throws(() => r.parsePrefs({ bill: 17 }), { name: 'ValidationError' });
    assert.throws(() => r.parsePrefs({ somethingElse: 1 }), { name: 'ValidationError' });
    assert.deepEqual(r.parsePrefs({ bill: null, dateOnlyTime: '07:30' }), { bill: null, dateOnlyTime: '07:30' });
  });
});

test('reminders: what is planned', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const r = require('../src/lib/reminders');

  const rows = (type, id, status = 'pending') =>
    db.all('SELECT user_id, occurrence_key, rule_key, scheduled_at, timezone, status FROM planned_reminders WHERE source_type = ? AND source_id = ? AND status = ? ORDER BY user_id, id', [type, id, status]);

  async function person() {
    const c = makeClient(app.base);
    const { res } = await signUp(c);
    return { c, id: res.data.user.id };
  }

  await t.test('a task with a date only: that day at 09:00 in the fallback zone, until the person has one', async () => {
    const { c } = await person();
    const due = ahead(10);
    const task = (await c.post('/api/tasks', { title: 'Renew passport', dueDate: due })).data.task;
    assert.deepEqual(task.reminder, { mode: 'default', minutesBefore: null });
    const [row] = await rows('task', task.id);
    assert.equal(row.rule_key, 'before:0');
    assert.equal(row.occurrence_key, due);
    assert.equal(row.timezone, ZONE);
    assert.equal(row.scheduled_at, iso(r.wallToUtc(due, '09:00', ZONE)));
  });

  await t.test('a task with a time: one hour before the moment itself', async () => {
    const { c } = await person();
    const due = ahead(10);
    const start = new Date(r.wallToUtc(due, '15:00', ZONE)).toISOString();
    const task = (await c.post('/api/tasks', { title: 'Dentist', dueDate: due, startTime: start })).data.task;
    const [row] = await rows('task', task.id);
    assert.equal(row.rule_key, 'before:60');
    assert.equal(row.scheduled_at, iso(Date.parse(start) - 3600000));
  });

  await t.test('no date, no reminder; a reminder that would already be in the past is not planned', async () => {
    const { c } = await person();
    const none = (await c.post('/api/tasks', { title: 'Someday' })).data.task;
    assert.equal((await rows('task', none.id)).length, 0);
    const late = (await c.post('/api/tasks', { title: 'Yesterday', dueDate: ahead(-1) })).data.task;
    assert.equal((await rows('task', late.id)).length, 0);
  });

  await t.test("an item's own choice: none, custom, back to default; a wrong choice is refused", async () => {
    const { c } = await person();
    const due = ahead(20);
    const task = (await c.post('/api/tasks', { title: 'Tax return', dueDate: due, reminder: { mode: 'custom', minutesBefore: 4320 } })).data.task;
    assert.deepEqual(task.reminder, { mode: 'custom', minutesBefore: 4320 });
    assert.equal((await rows('task', task.id))[0].scheduled_at, iso(r.wallToUtc(ahead(17), '09:00', ZONE)));

    const silenced = (await c.patch(`/api/tasks/${task.id}`, { reminder: { mode: 'none' } })).data.task;
    assert.deepEqual(silenced.reminder, { mode: 'none', minutesBefore: null });
    assert.equal((await rows('task', task.id)).length, 0);
    assert.equal((await rows('task', task.id, 'cancelled')).length, 1);

    await c.patch(`/api/tasks/${task.id}`, { reminder: { mode: 'default' } });
    assert.equal((await rows('task', task.id))[0].rule_key, 'before:0');

    assert.equal((await c.patch(`/api/tasks/${task.id}`, { reminder: { mode: 'custom', minutesBefore: 17 } })).status, 400);
    assert.equal((await c.post('/api/tasks', { title: 'x', dueDate: due, reminder: 'soon' })).status, 400);
    // The older single number still works.
    const old = (await c.post('/api/tasks', { title: 'Old client', dueDate: due, reminderMinutesBefore: 1440 })).data.task;
    assert.deepEqual(old.reminder, { mode: 'custom', minutesBefore: 1440 });
  });

  await t.test('moving, completing, reopening and deleting a task', async () => {
    const { c } = await person();
    const task = (await c.post('/api/tasks', { title: 'Car service', dueDate: ahead(10) })).data.task;

    await c.patch(`/api/tasks/${task.id}`, { dueDate: ahead(12) });
    let pending = await rows('task', task.id);
    assert.equal(pending.length, 1, 'one pending row, for the new date');
    assert.equal(pending[0].occurrence_key, ahead(12));

    await c.post(`/api/tasks/${task.id}/postpone`, { days: 2 });
    pending = await rows('task', task.id);
    assert.deepEqual(pending.map((p) => p.occurrence_key), [ahead(14)]);

    await c.patch(`/api/tasks/${task.id}`, { status: 'completed' });
    assert.equal((await rows('task', task.id)).length, 0, 'a completed task reminds nobody');

    await c.patch(`/api/tasks/${task.id}`, { status: 'todo' });
    assert.deepEqual((await rows('task', task.id)).map((p) => p.occurrence_key), [ahead(14)], 'reopened: planned again, in the same row');
    const all = await db.all("SELECT id FROM planned_reminders WHERE source_type = 'task' AND source_id = ? AND occurrence_key = ?", [task.id, ahead(14)]);
    assert.equal(all.length, 1);

    await c.del(`/api/tasks/${task.id}`);
    assert.equal((await db.all("SELECT id FROM planned_reminders WHERE source_type = 'task' AND source_id = ?", [task.id])).length, 0);
  });

  await t.test('a reminder that was sent is not planned again when the item is edited back', async () => {
    const { c } = await person();
    const task = (await c.post('/api/tasks', { title: 'Call the bank', dueDate: ahead(10) })).data.task;
    await db.run("UPDATE planned_reminders SET status = 'sent', sent_at = datetime('now') WHERE source_type = 'task' AND source_id = ?", [task.id]);
    await c.patch(`/api/tasks/${task.id}`, { dueDate: ahead(11) });
    await c.patch(`/api/tasks/${task.id}`, { dueDate: ahead(10) });
    assert.equal((await rows('task', task.id)).length, 0);
    assert.equal((await rows('task', task.id, 'sent')).length, 1);
  });

  await t.test('a repeating task: completing it plans the next occurrence', async () => {
    const { c } = await person();
    const task = (await c.post('/api/tasks', { title: 'Water the plants', dueDate: ahead(10), recurrence: 'weekly' })).data.task;
    await c.patch(`/api/tasks/${task.id}`, { status: 'completed' });
    const next = await db.get("SELECT id, due_date FROM tasks WHERE title = 'Water the plants' AND id <> ?", [task.id]);
    assert.equal(next.due_date, ahead(17));
    assert.deepEqual((await rows('task', next.id)).map((p) => p.occurrence_key), [ahead(17)]);
    assert.equal((await rows('task', task.id)).length, 0);
  });

  await t.test('a bill: three days before; paid and rolled to the next month, the reminder moves; paid for good, it ends', async () => {
    const { c } = await person();
    const due = ahead(40);
    const bill = (await c.post('/api/bills', { name: 'Internet', amount: 20, dueDate: due, recurrence: 'monthly' })).data.bill;
    assert.deepEqual(bill.reminder, { mode: 'default', minutesBefore: null });
    let pending = await rows('bill', bill.id);
    assert.equal(pending[0].scheduled_at, iso(r.wallToUtc(ahead(37), '09:00', ZONE)));

    const paid = (await c.post(`/api/bills/${bill.id}/pay`)).data.bill;
    pending = await rows('bill', bill.id);
    assert.deepEqual(pending.map((p) => p.occurrence_key), [paid.dueDate]);
    assert.notEqual(paid.dueDate, due);

    const once = (await c.post('/api/bills', { name: 'Fine', amount: 30, dueDate: due, recurrence: 'none', reminder: { mode: 'custom', minutesBefore: 1440 } })).data.bill;
    assert.equal((await rows('bill', once.id))[0].rule_key, 'before:1440');
    await c.post(`/api/bills/${once.id}/pay`);
    assert.equal((await rows('bill', once.id)).length, 0);

    await c.del(`/api/bills/${bill.id}`);
    assert.equal((await db.all("SELECT id FROM planned_reminders WHERE source_type = 'bill' AND source_id = ?", [bill.id])).length, 0);
  });

  await t.test('a goal: its own date a week before, until it has dated steps; then each open step a day before', async () => {
    const { c } = await person();
    const goal = (await c.post('/api/goals', { title: 'Run 10 km', targetDate: ahead(60) })).data.goal;
    assert.equal((await rows('goal', goal.id))[0].scheduled_at, iso(r.wallToUtc(ahead(53), '09:00', ZONE)));

    const first = (await c.post(`/api/goals/${goal.id}/milestones`, { title: 'Run 3 km', dueDate: ahead(20) })).data.milestone;
    const second = (await c.post(`/api/goals/${goal.id}/milestones`, { title: 'Run 6 km', dueDate: ahead(40) })).data.milestone;
    assert.equal((await rows('goal', goal.id)).length, 0, 'the steps speak for the goal now');
    assert.equal((await rows('milestone', first.id))[0].scheduled_at, iso(r.wallToUtc(ahead(19), '09:00', ZONE)));

    await c.patch(`/api/goals/${goal.id}/milestones/${first.id}`, { done: true });
    assert.equal((await rows('milestone', first.id)).length, 0);
    assert.equal((await rows('milestone', second.id)).length, 1);

    await c.del(`/api/goals/${goal.id}/milestones/${second.id}`);
    assert.equal((await db.all("SELECT id FROM planned_reminders WHERE source_type = 'milestone' AND source_id = ?", [second.id])).length, 0);

    await c.patch(`/api/goals/${goal.id}`, { status: 'abandoned' });
    assert.equal((await db.all("SELECT id FROM planned_reminders WHERE status = 'pending' AND ((source_type = 'goal' AND source_id = ?) OR (source_type = 'milestone' AND source_id = ?))", [goal.id, first.id])).length, 0);

    const other = (await c.post('/api/goals', { title: 'Read 12 books', targetDate: ahead(60) })).data.goal;
    const step = (await c.post(`/api/goals/${other.id}/milestones`, { title: 'Book one', dueDate: ahead(30) })).data.milestone;
    await c.del(`/api/goals/${other.id}`);
    assert.equal((await db.all("SELECT id FROM planned_reminders WHERE (source_type = 'goal' AND source_id = ?) OR (source_type = 'milestone' AND source_id = ?)", [other.id, step.id])).length, 0);
  });

  await t.test("settings: the person's zone and defaults move what is already planned; bad values are refused", async () => {
    const { c } = await person();
    const due = ahead(30);
    const task = (await c.post('/api/tasks', { title: 'Visa', dueDate: due })).data.task;
    const bill = (await c.post('/api/bills', { name: 'Rent', amount: 300, dueDate: due })).data.bill;

    const before = (await c.get('/api/settings/reminders')).data.reminders;
    assert.equal(before.timezone, null);
    assert.equal(before.effectiveTimezone, ZONE);
    assert.equal(before.defaults.bill, 4320);

    const after = (await c.patch('/api/settings/reminders', { timezone: 'America/New_York', defaults: { dateOnlyTime: '07:30', bill: 1440 } })).data.reminders;
    assert.equal(after.timezone, 'America/New_York');
    assert.deepEqual({ time: after.defaults.dateOnlyTime, bill: after.defaults.bill, goal: after.defaults.goal }, { time: '07:30', bill: 1440, goal: 10080 });

    const [taskRow] = await rows('task', task.id);
    assert.equal(taskRow.timezone, 'America/New_York');
    assert.equal(taskRow.scheduled_at, iso(r.wallToUtc(due, '07:30', 'America/New_York')));
    assert.equal((await db.all("SELECT id FROM planned_reminders WHERE source_type = 'task' AND source_id = ?", [task.id])).length, 1, 'moved in place, not doubled');
    const [billRow] = await rows('bill', bill.id);
    assert.equal(billRow.rule_key, 'before:1440');

    // "No reminder for bills" as a default.
    await c.patch('/api/settings/reminders', { defaults: { bill: null } });
    assert.equal((await rows('bill', bill.id)).length, 0);

    assert.equal((await c.patch('/api/settings/reminders', { timezone: 'Mars/Olympus' })).status, 400);
    assert.equal((await c.patch('/api/settings/reminders', { defaults: { bill: 17 } })).status, 400);
    assert.equal((await c.patch('/api/settings/reminders', { defaults: 'none' })).status, 400);
    assert.equal((await makeClient(app.base).get('/api/settings/reminders')).status, 401);
  });

  await t.test('many edits of one task at once leave one pending reminder, for the date the task ends with', async () => {
    const { c } = await person();
    const task = (await c.post('/api/tasks', { title: 'Moving target', dueDate: ahead(10) })).data.task;
    const answers = await Promise.all([11, 12, 13, 14, 15, 16, 17, 18].map((d) => c.patch(`/api/tasks/${task.id}`, { dueDate: ahead(d) })));
    assert.ok(answers.every((a) => a.status === 200));
    const final = (await db.get('SELECT due_date FROM tasks WHERE id = ?', [task.id])).due_date;
    assert.deepEqual((await rows('task', task.id)).map((p) => p.occurrence_key), [final]);
  });

  await t.test('a change and its plan stand or fall together', async () => {
    const { c } = await person();
    const task = (await c.post('/api/tasks', { title: 'All or nothing', dueDate: ahead(10) })).data.task;
    // The planner fails in the middle of the request: the task must not have moved either.
    await db.exec('ALTER TABLE planned_reminders RENAME TO planned_reminders_away');
    const failed = await c.patch(`/api/tasks/${task.id}`, { dueDate: ahead(12) });
    await db.exec('ALTER TABLE planned_reminders_away RENAME TO planned_reminders');
    assert.equal(failed.status, 500);
    assert.equal((await db.get('SELECT due_date FROM tasks WHERE id = ?', [task.id])).due_date, ahead(10));
    assert.deepEqual((await rows('task', task.id)).map((p) => p.occurrence_key), [ahead(10)]);
  });

  await t.test('a day that is not in the calendar is refused everywhere, and never planned if it is already stored', async () => {
    const { c, id } = await person();
    for (const bad of ['2026-02-31', '2027-02-29', '2026-13-01', 'tomorrow', '2026-10-13T09:00']) {
      assert.equal((await c.post('/api/tasks', { title: 'x', dueDate: bad })).status, 400, bad);
    }
    assert.equal((await c.post('/api/bills', { name: 'x', amount: 5, dueDate: '2026-02-31' })).status, 400);
    assert.equal((await c.post('/api/goals', { title: 'x', targetDate: '2026-02-31' })).status, 400);
    const goal = (await c.post('/api/goals', { title: 'Real', targetDate: '2028-02-29' })).data.goal;
    assert.equal((await c.post(`/api/goals/${goal.id}/milestones`, { title: 'x', dueDate: '2026-04-31' })).status, 400);
    assert.equal((await c.patch(`/api/goals/${goal.id}`, { targetDate: '2026-02-30' })).status, 400);
    const task = (await c.post('/api/tasks', { title: 'Fine', dueDate: ahead(10) })).data.task;
    assert.equal((await c.patch(`/api/tasks/${task.id}`, { dueDate: '2026-02-31' })).status, 400);
    assert.equal((await c.patch(`/api/tasks/${task.id}`, { dueDate: null })).status, 200, 'a date can still be taken away');
    assert.equal((await rows('task', task.id)).length, 0);
    // Written before the check existed.
    const old = await db.run("INSERT INTO tasks (owner_id, title, due_date) VALUES (?, 'Old row', '2099-02-31')", [id]);
    await r.replanTask(old.lastInsertRowid);
    assert.equal((await rows('task', old.lastInsertRowid)).length, 0);
  });

  await t.test('the demo data gets its reminders, and loses them when it is cleared', async () => {
    const { c, id } = await person();
    const { seedDemoForUser, clearDemoForUser } = require('../src/db/seed-demo');
    await seedDemoForUser(id);
    const planned = (await db.get("SELECT COUNT(*) c FROM planned_reminders WHERE user_id = ? AND status = 'pending'", [id])).c;
    assert.ok(planned > 0, 'something of the demo data is ahead and planned');
    await clearDemoForUser(id);
    const lost = await db.get("SELECT COUNT(*) c FROM planned_reminders WHERE user_id = ? AND source_type = 'task' AND source_id NOT IN (SELECT id FROM tasks)", [id]);
    assert.equal(lost.c, 0);
    assert.equal((await c.get('/api/tasks')).status, 200);
  });

  await t.test("rebuilding a person's plan from nothing gives the same plan", async () => {
    const { c, id } = await person();
    await c.post('/api/tasks', { title: 'One', dueDate: ahead(9) });
    await c.post('/api/bills', { name: 'Two', amount: 5, dueDate: ahead(30) });
    const picture = () => db.all("SELECT source_type, source_id, occurrence_key, rule_key, scheduled_at FROM planned_reminders WHERE user_id = ? AND status = 'pending' ORDER BY source_type, source_id", [id]);
    const before = await picture();
    assert.equal(before.length, 2);
    await db.run('DELETE FROM planned_reminders WHERE user_id = ?', [id]);
    await r.replanUser(id);
    assert.deepEqual(await picture(), before);
  });

  await t.test('a transactional route answers only after its changes are stored', async () => {
    const { txRoute } = require('../src/middleware/errorHandler');
    await db.exec('CREATE TABLE IF NOT EXISTS tx_probe (id integer PRIMARY KEY, parent integer REFERENCES tx_probe(id) DEFERRABLE INITIALLY DEFERRED)');
    const call = (handler) =>
      new Promise((resolve) => {
        const seen = { status: null, body: null, error: null };
        const res = { status: (c) => ((seen.status = c), res), json: (b) => ((seen.body = b), resolve(seen), res) };
        txRoute(handler)({}, res, (err) => ((seen.error = err), resolve(seen)));
      });

    const ok = await call(async (req, res) => {
      await db.run('INSERT INTO tx_probe (id) VALUES (1)');
      res.status(201).json({ ok: true });
    });
    assert.deepEqual({ status: ok.status, body: ok.body, error: ok.error }, { status: 201, body: { ok: true }, error: null });

    // The handler answered and then failed: the answer is never written.
    const late = await call(async (req, res) => {
      await db.run('INSERT INTO tx_probe (id) VALUES (2)');
      res.json({ ok: true });
      throw new Error('after the answer');
    });
    assert.deepEqual({ status: late.status, body: late.body, message: late.error && late.error.message }, { status: null, body: null, message: 'after the answer' });

    // The handler finished without an error and the COMMIT itself fails (a constraint checked only then).
    const commit = await call(async (req, res) => {
      await db.run('INSERT INTO tx_probe (id, parent) VALUES (3, 999)');
      res.json({ ok: true });
    });
    assert.equal(commit.body, null, 'no "done" for what was rolled back');
    assert.ok(commit.error);
    assert.deepEqual((await db.all('SELECT id FROM tx_probe ORDER BY id')).map((r) => r.id), [1]);
  });

  await t.test('a circle task: the owner and the assignee are reminded, each in their own zone; nobody else; not after leaving', async () => {
    const owner = await person();
    const helper = await person();
    const bystander = await person();
    const family = (await owner.c.post('/api/family', { name: 'Home' })).data.family;
    assert.equal((await helper.c.post('/api/family/join', { code: family.inviteCode })).status, 201);
    assert.equal((await bystander.c.post('/api/family/join', { code: family.inviteCode })).status, 201);
    await helper.c.patch('/api/settings/reminders', { timezone: 'America/New_York' });

    const due = ahead(15);
    const task = (await owner.c.post('/api/tasks', { title: 'Fix the roof', dueDate: due, familyId: family.id, visibility: 'family', assignedTo: helper.id })).data.task;
    const pending = await rows('task', task.id);
    assert.deepEqual(pending.map((p) => p.user_id).sort((a, b) => a - b), [owner.id, helper.id].sort((a, b) => a - b));
    const mine = pending.find((p) => p.user_id === helper.id);
    assert.equal(mine.scheduled_at, iso(r.wallToUtc(due, '09:00', 'America/New_York')));
    assert.equal(pending.find((p) => p.user_id === owner.id).scheduled_at, iso(r.wallToUtc(due, '09:00', ZONE)));

    assert.equal((await helper.c.post(`/api/family/${family.id}/leave`)).status, 200);
    assert.deepEqual((await rows('task', task.id)).map((p) => p.user_id), [owner.id], 'somebody who left the circle is no longer reminded of its task');
  });
});

test('reminders: a test that named no database of its own gets none', () => {
  const { execFileSync } = require('node:child_process');
  const path = require('node:path');
  const env = { ...process.env, NODE_ENV: 'test' };
  delete env.LIFEADMIN_DB_PATH;
  delete env.DATABASE_URL;
  const out = execFileSync(process.execPath, ['-e', "const db = require('./src/db'); db.get('SELECT 1 AS x').then(() => console.log('OPENED'), (e) => console.log('REFUSED ' + e.message))"], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8' });
  assert.match(out, /^REFUSED Tests need their own database/);
});
