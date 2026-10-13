// Reminders, unit 2: the worker that takes what is due. Overlapping runs, a run that dies, an item that
// changed after it was claimed. What is delivered here is the notification of the bell; nothing leaves the
// application.

const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

function ahead(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

test('reminders: the worker', async (t) => {
  // The app first: it points the database module at this file's own disposable database.
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const worker = require('../src/lib/reminderWorker');

  async function person() {
    const c = makeClient(app.base);
    const { res } = await signUp(c);
    return { c, id: res.data.user.id };
  }
  const planned = (type, id) => db.all('SELECT * FROM planned_reminders WHERE source_type = ? AND source_id = ? ORDER BY user_id, id', [type, id]);
  const bells = async (userId) => (await db.all("SELECT type, title, body, link FROM notifications WHERE user_id = ? AND title LIKE 'Reminder%' ORDER BY id", [userId]));
  // The moment just after a row is due.
  const dueOf = (row) => Date.parse(row.scheduled_at) + 1000;
  // Each test leaves nothing due behind for the next.
  t.afterEach(() => db.run("DELETE FROM planned_reminders WHERE status IN ('pending','claimed')"));

  await t.test('what is not due yet is left alone; what is due is sent once, to the bell', async () => {
    const { c, id } = await person();
    const task = (await c.post('/api/tasks', { title: 'Renew passport', dueDate: ahead(10) })).data.task;
    const [row] = await planned('task', task.id);

    assert.deepEqual(await worker.runDue({ now: Date.parse(row.scheduled_at) - 60000 }).then((x) => x.claimed), 0);
    assert.equal((await bells(id)).length, 0);

    const first = await worker.runDue({ now: dueOf(row) });
    assert.deepEqual({ claimed: first.claimed, sent: first.sent }, { claimed: 1, sent: 1 });
    assert.deepEqual(await bells(id), [{ type: 'task', title: 'Reminder: task due', body: 'Renew passport', link: `#/tasks/${task.id}` }]);
    const [after] = await planned('task', task.id);
    assert.deepEqual({ status: after.status, token: after.claim_token, lease: after.claimed_until, attempts: after.attempts }, { status: 'sent', token: null, lease: null, attempts: 1 });
    assert.ok(after.sent_at);

    const second = await worker.runDue({ now: dueOf(row) + 900000 });
    assert.equal(second.claimed, 0);
    assert.equal((await bells(id)).length, 1);
  });

  await t.test('two runs at the same moment send each reminder once between them', async () => {
    const { c, id } = await person();
    const due = ahead(10);
    for (const title of ['One', 'Two', 'Three', 'Four']) await c.post('/api/tasks', { title, dueDate: due });
    const now = Date.parse((await db.get("SELECT MAX(scheduled_at) AS s FROM planned_reminders WHERE user_id = ?", [id])).s) + 1000;
    const [a, b] = await Promise.all([worker.runDue({ now }), worker.runDue({ now })]);
    assert.equal(a.sent + b.sent, 4);
    assert.equal(a.claimed + b.claimed, 4);
    assert.deepEqual((await bells(id)).map((x) => x.body).sort(), ['Four', 'One', 'Three', 'Two']);
  });

  await t.test('a run takes a bounded batch; the rest waits for the next run', async () => {
    const { c, id } = await person();
    for (const title of ['One', 'Two', 'Three']) await c.post('/api/tasks', { title, dueDate: ahead(10) });
    const now = Date.parse((await db.get("SELECT MAX(scheduled_at) AS s FROM planned_reminders WHERE user_id = ?", [id])).s) + 1000;
    assert.equal((await worker.runDue({ now, limit: 2 })).sent, 2);
    assert.equal((await worker.runDue({ now, limit: 2 })).sent, 1);
    assert.equal((await bells(id)).length, 3);
  });

  await t.test('a run that runs out of time gives back what it did not reach, and that is not counted as an attempt', async () => {
    const { c, id } = await person();
    for (const title of ['One', 'Two', 'Three']) await c.post('/api/tasks', { title, dueDate: ahead(10) });
    const now = Date.parse((await db.get("SELECT MAX(scheduled_at) AS s FROM planned_reminders WHERE user_id = ?", [id])).s) + 1000;
    const out = await worker.runDue({ now, budgetMs: -1 });
    assert.deepEqual({ claimed: out.claimed, sent: out.sent, released: out.released }, { claimed: 3, sent: 0, released: 3 });
    const left = await db.all("SELECT status, attempts, claim_token FROM planned_reminders WHERE user_id = ?", [id]);
    assert.deepEqual(left, Array(3).fill({ status: 'pending', attempts: 0, claim_token: null }));
    assert.equal((await worker.runDue({ now })).sent, 3, 'the next run takes them at once');
    assert.equal((await bells(id)).length, 3);
  });

  await t.test('a run that died: its row is taken again after the lease, and the dead run can no longer finish it', async () => {
    const { c, id } = await person();
    const task = (await c.post('/api/tasks', { title: 'Lease', dueDate: ahead(10) })).data.task;
    const [row] = await planned('task', task.id);
    const now = dueOf(row);

    const dead = await worker.claimDue({ now });
    assert.equal(dead.rows.length, 1);
    // Inside the lease nobody else takes it.
    assert.equal((await worker.claimDue({ now: now + 60000 })).rows.length, 0);
    // After it, another run does.
    const live = await worker.claimDue({ now: now + (worker.LEASE_SECONDS + 1) * 1000 });
    assert.equal(live.rows.length, 1);
    assert.notEqual(live.token, dead.token);
    assert.equal(live.rows[0].attempts, 2);

    // The first run wakes up late: it changes nothing and delivers nothing.
    assert.equal(await worker.handle(dead.rows[0], dead.token, { now }), 'lost');
    assert.equal((await bells(id)).length, 0);
    assert.equal((await planned('task', task.id))[0].status, 'claimed');

    assert.equal(await worker.handle(live.rows[0], live.token, { now }), 'sent');
    assert.equal((await bells(id)).length, 1);
    // And still nothing when the dead run tries once more.
    assert.equal(await worker.handle(dead.rows[0], dead.token, { now }), 'lost');
    assert.equal((await bells(id)).length, 1);
  });

  await t.test('an item that changed after it was claimed is not announced: completed, moved, deleted', async () => {
    const { c, id } = await person();
    const done = (await c.post('/api/tasks', { title: 'Done meanwhile', dueDate: ahead(10) })).data.task;
    const moved = (await c.post('/api/tasks', { title: 'Moved meanwhile', dueDate: ahead(10) })).data.task;
    const gone = (await c.post('/api/tasks', { title: 'Deleted meanwhile', dueDate: ahead(10) })).data.task;
    const paid = (await c.post('/api/bills', { name: 'Paid meanwhile', amount: 5, dueDate: ahead(13), recurrence: 'none' })).data.bill;
    const now = Date.parse((await db.get("SELECT MAX(scheduled_at) AS s FROM planned_reminders WHERE user_id = ?", [id])).s) + 1000;

    const claim = await worker.claimDue({ now });
    assert.equal(claim.rows.length, 4);
    await c.patch(`/api/tasks/${done.id}`, { status: 'completed' });
    await c.patch(`/api/tasks/${moved.id}`, { dueDate: ahead(20) });
    await c.del(`/api/tasks/${gone.id}`);
    await c.post(`/api/bills/${paid.id}/pay`);

    const outcomes = {};
    for (const row of claim.rows) outcomes[`${row.source_type}:${row.source_id}`] = await worker.handle(row, claim.token, { now });
    assert.deepEqual(outcomes, { [`task:${done.id}`]: 'cancelled', [`task:${moved.id}`]: 'cancelled', [`task:${gone.id}`]: 'lost', [`bill:${paid.id}`]: 'cancelled' });
    assert.equal((await bells(id)).length, 0);
    // The moved task keeps its new, pending reminder.
    assert.deepEqual((await planned('task', moved.id)).map((p) => [p.occurrence_key, p.status]).sort(), [[ahead(10), 'cancelled'], [ahead(20), 'pending']]);
  });

  await t.test('somebody who left the circle after the claim is not reminded of its task; the owner is', async () => {
    const owner = await person();
    const helper = await person();
    const family = (await owner.c.post('/api/family', { name: 'Home' })).data.family;
    await helper.c.post('/api/family/join', { code: family.inviteCode });
    const task = (await owner.c.post('/api/tasks', { title: 'Fix the roof', dueDate: ahead(15), familyId: family.id, visibility: 'family', assignedTo: helper.id })).data.task;
    const rows = await planned('task', task.id);
    assert.equal(rows.length, 2);
    const now = Math.max(...rows.map(dueOf));

    const claim = await worker.claimDue({ now });
    // Access is taken away behind the planner's back, as a failure would leave it.
    await db.run('DELETE FROM family_members WHERE family_id = ? AND user_id = ?', [family.id, helper.id]);
    for (const row of claim.rows) await worker.handle(row, claim.token, { now });
    assert.equal((await bells(owner.id)).length, 1);
    assert.equal((await bells(helper.id)).length, 0);
    const mine = (await planned('task', task.id)).find((p) => p.user_id === helper.id);
    assert.deepEqual({ status: mine.status, why: mine.last_error }, { status: 'cancelled', why: 'not_wanted' });
  });

  await t.test('a delivery that fails is tried again, a bounded number of times, and leaves no half-sent trace', async () => {
    const { c, id } = await person();
    const task = (await c.post('/api/tasks', { title: 'Flaky', dueDate: ahead(10) })).data.task;
    const [row] = await planned('task', task.id);
    const now = dueOf(row);
    const broken = async () => {
      const err = new Error('the push service is down');
      err.code = 'EPUSHDOWN';
      throw err;
    };

    for (let attempt = 1; attempt < worker.MAX_ATTEMPTS; attempt++) {
      const out = await worker.runDue({ now, deliver: broken });
      assert.deepEqual({ claimed: out.claimed, retry: out.retry }, { claimed: 1, retry: 1 }, `attempt ${attempt}`);
      const [again] = await planned('task', task.id);
      assert.deepEqual({ status: again.status, attempts: again.attempts, why: again.last_error, sent: again.sent_at }, { status: 'pending', attempts: attempt, why: 'EPUSHDOWN', sent: null });
    }
    const last = await worker.runDue({ now, deliver: broken });
    assert.equal(last.failed, 1);
    assert.equal((await planned('task', task.id))[0].status, 'failed');
    assert.equal((await worker.runDue({ now })).claimed, 0, 'given up on: not taken again');
    assert.equal((await bells(id)).length, 0);
    await db.run("DELETE FROM planned_reminders WHERE status = 'failed'");
  });

  await t.test('a delivery that fails after writing something takes that writing back with it', async () => {
    const { c, id } = await person();
    const task = (await c.post('/api/tasks', { title: 'Half', dueDate: ahead(10) })).data.task;
    const [row] = await planned('task', task.id);
    const halfway = async (r) => {
      await worker.deliverToBell(r);
      throw new Error('died after the bell');
    };
    assert.equal((await worker.runDue({ now: dueOf(row), deliver: halfway })).retry, 1);
    assert.equal((await bells(id)).length, 0);
    assert.equal((await worker.runDue({ now: dueOf(row) })).sent, 1);
    assert.equal((await bells(id)).length, 1);
  });

  await t.test('a row whose runs all died is given up on; a reminder found days late is dropped, not sent', async () => {
    const { c, id } = await person();
    const dead = (await c.post('/api/tasks', { title: 'Dead', dueDate: ahead(10) })).data.task;
    const late = (await c.post('/api/tasks', { title: 'Late', dueDate: ahead(10) })).data.task;
    const [deadRow] = await planned('task', dead.id);
    const [lateRow] = await planned('task', late.id);
    await db.run("UPDATE planned_reminders SET status = 'claimed', claim_token = 'gone', claimed_until = '2000-01-01T00:00:00Z', attempts = ? WHERE id = ?", [worker.MAX_ATTEMPTS, deadRow.id]);
    await db.run("UPDATE planned_reminders SET scheduled_at = '2000-01-01T00:00:00Z' WHERE id = ?", [lateRow.id]);

    const out = await worker.runDue({ now: Date.now() });
    assert.deepEqual({ claimed: out.claimed, cancelled: out.cancelled }, { claimed: 1, cancelled: 1 });
    assert.equal((await planned('task', dead.id))[0].status, 'failed');
    const [dropped] = await planned('task', late.id);
    assert.deepEqual({ status: dropped.status, why: dropped.last_error }, { status: 'cancelled', why: 'stale' });
    assert.equal((await bells(id)).length, 0);
    await db.run("DELETE FROM planned_reminders WHERE status = 'failed'");
  });

  await t.test('bills, goals and steps are announced in their own words; a kind the person switched off is finished silently', async () => {
    const { c, id } = await person();
    const bill = (await c.post('/api/bills', { name: 'Internet', amount: 20, dueDate: ahead(30) })).data.bill;
    const goal = (await c.post('/api/goals', { title: 'Run 10 km', targetDate: ahead(60) })).data.goal;
    const stepGoal = (await c.post('/api/goals', { title: 'Read more' })).data.goal;
    await c.post(`/api/goals/${stepGoal.id}/milestones`, { title: 'Book one', dueDate: ahead(20) });
    const far = Date.now() + 70 * 86400000;
    // Not stale: each is handled at its own moment.
    for (const p of await db.all("SELECT * FROM planned_reminders WHERE user_id = ? AND status = 'pending' ORDER BY scheduled_at", [id])) {
      assert.equal((await worker.runDue({ now: dueOf(p) })).sent, 1);
    }
    assert.ok(far);
    assert.deepEqual((await bells(id)).map((b) => [b.type, b.title, b.link]).sort(), [
      ['bill', 'Reminder: bill due', '#/billsense'],
      ['goal', 'Reminder: goal date is near', `#/goals/${goal.id}`],
      ['goal', 'Reminder: next step of a goal', `#/goals/${stepGoal.id}`],
    ]);

    await c.patch('/api/settings/preferences', { notifPrefs: { bill: false } });
    const other = (await c.post('/api/bills', { name: 'Quiet', amount: 5, dueDate: ahead(40) })).data.bill;
    const [row] = await planned('bill', other.id);
    assert.equal((await worker.runDue({ now: dueOf(row) })).sent, 1);
    assert.equal((await bells(id)).length, 3, 'no bell for a kind that is switched off');
    assert.equal((await planned('bill', other.id))[0].status, 'sent');
    assert.ok(bill.id);
  });

  await t.test('only the known states and choices can be stored', async () => {
    const { c, id } = await person();
    const task = (await c.post('/api/tasks', { title: 'Checked', dueDate: ahead(10) })).data.task;
    await assert.rejects(db.run("UPDATE tasks SET reminder_mode = 'loud' WHERE id = ?", [task.id]));
    await assert.rejects(db.run("UPDATE planned_reminders SET status = 'maybe' WHERE user_id = ?", [id]));
  });

  await t.test('the scheduled function answers with counts and nothing else', async () => {
    const { handler } = require('../netlify/functions/reminders');
    const res = await handler();
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.deepEqual(Object.keys(body).sort(), ['cancelled', 'claimed', 'failed', 'lost', 'ms', 'pushes', 'released', 'retry', 'sent', 'sessionsEnded']);
    // The pushes that were still owed: counts too.
    assert.deepEqual(Object.keys(body.pushes).sort(), ['closed', 'expired', 'retry', 'sent', 'tried']);
  });
});
