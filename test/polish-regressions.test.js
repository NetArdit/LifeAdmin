const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

// One test per defect found in the whole-codebase review. Each one failed
// before its fix.
test('polish regressions', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  async function client() {
    const c = makeClient(app.base);
    await signUp(c);
    return c;
  }

  await t.test('a monthly bill due on the 31st moves to the last day of a shorter month, not into the month after', async () => {
    const c = await client();
    const bill = (await c.post('/api/bills', { name: 'Rent', amount: 100, dueDate: '2027-01-31', recurrence: 'monthly' })).data.bill;
    const paid = await c.post(`/api/bills/${bill.id}/pay`, {});
    assert.equal(paid.data.bill.dueDate, '2027-02-28');
  });

  await t.test('a bill cannot be saved with a recurrence that paying it cannot advance', async () => {
    const c = await client();
    const bad = await c.post('/api/bills', { name: 'Daily', amount: 5, dueDate: '2026-10-10', recurrence: 'daily' });
    assert.equal(bad.status, 400);

    const bill = (await c.post('/api/bills', { name: 'Ok', amount: 5, dueDate: '2026-10-10', recurrence: 'weekly' })).data.bill;
    assert.equal((await c.patch(`/api/bills/${bill.id}`, { recurrence: 'daily' })).status, 400);
    assert.equal((await c.patch(`/api/bills/${bill.id}`, { amount: -5 })).status, 400);
    assert.equal((await c.post(`/api/bills/${bill.id}/pay`, {})).status, 200);
  });

  await t.test('deleting the last milestone of a completed goal returns it to active at 0%', async () => {
    const c = await client();
    const goal = (await c.post('/api/goals', { title: 'Goal' })).data.goal;
    const ms = (await c.post(`/api/goals/${goal.id}/milestones`, { title: 'only step' })).data.milestone;
    const done = await c.patch(`/api/goals/${goal.id}/milestones/${ms.id}`, { done: true });
    assert.equal(done.data.goal.status, 'completed');

    await c.del(`/api/goals/${goal.id}/milestones/${ms.id}`);
    const after = (await c.get(`/api/goals/${goal.id}`)).data.goal;
    assert.equal(after.status, 'active');
    assert.equal(after.progress, 0);
  });

  await t.test('a goal or task cannot be given a status that does not exist', async () => {
    const c = await client();
    const goal = (await c.post('/api/goals', { title: 'Goal' })).data.goal;
    assert.equal((await c.patch(`/api/goals/${goal.id}`, { status: 'banana' })).status, 400);
    assert.equal((await c.patch(`/api/goals/${goal.id}`, { status: 'abandoned' })).status, 200);

    const task = (await c.post('/api/tasks', { title: 'Task' })).data.task;
    assert.equal((await c.patch(`/api/tasks/${task.id}`, { status: 'banana' })).status, 400);
    assert.equal((await c.patch(`/api/tasks/${task.id}`, { priority: 'urgent' })).status, 400);
  });

  await t.test('completing, reopening and completing a recurring task again creates the next occurrence only once', async () => {
    const c = await client();
    const task = (await c.post('/api/tasks', { title: 'Weekly review', dueDate: '2026-10-12', recurrence: 'weekly' })).data.task;
    await c.patch(`/api/tasks/${task.id}`, { status: 'completed' });
    const reopened = await c.patch(`/api/tasks/${task.id}`, { status: 'todo' });
    assert.equal(reopened.data.task.completedAt, null, 'a reopened task has no completion time');
    await c.patch(`/api/tasks/${task.id}`, { status: 'completed' });

    const copies = (await c.get('/api/tasks')).data.tasks.filter((x) => x.title === 'Weekly review');
    assert.deepEqual(copies.map((x) => `${x.dueDate} ${x.status}`).sort(), ['2026-10-12 completed', '2026-10-19 todo']);
  });

  await t.test('postponing a timed task moves its start time with its due date, and only ever forward', async () => {
    const c = await client();
    const start = '2026-10-12T16:00:00.000Z';
    const task = (await c.post('/api/tasks', { title: 'Call', dueDate: '2026-10-12', startTime: start, durationMinutes: 30 })).data.task;

    const once = (await c.post(`/api/tasks/${task.id}/postpone`, { days: 1 })).data.task;
    assert.equal(once.dueDate, '2026-10-13');
    assert.equal(new Date(once.startTime) - new Date(start), 24 * 60 * 60 * 1000);

    const negative = (await c.post(`/api/tasks/${task.id}/postpone`, { days: -400 })).data.task;
    assert.equal(negative.dueDate, '2026-10-14', 'a negative number of days postpones by one day');
  });

  await t.test('deleting the chosen option reopens the decision', async () => {
    const c = await client();
    const d = (await c.post('/api/decisions', { question: 'Which one?' })).data.decision;
    const a = (await c.post(`/api/decisions/${d.id}/options`, { name: 'A' })).data.option;
    await c.post(`/api/decisions/${d.id}/options`, { name: 'B' });
    await c.post(`/api/decisions/${d.id}/decide`, { optionId: a.id });

    await c.del(`/api/decisions/${d.id}/options/${a.id}`);
    const after = (await c.get(`/api/decisions/${d.id}`)).data.decision;
    assert.equal(after.status, 'open');
    assert.equal(after.chosenOptionId, null);
  });

  await t.test('the dashboard returns every overdue item it counts', async () => {
    const c = await client();
    await c.post('/api/tasks', { title: 'Long overdue', dueDate: '2020-01-01', priority: 'critical' });
    const dash = (await c.get('/api/dashboard')).data;
    assert.equal(dash.today.count, 1);
    assert.deepEqual(dash.overdue.map((i) => i.title), ['Long overdue']);
  });
});
