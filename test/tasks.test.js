const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('tasks', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('create/list/get/patch/postpone/delete a task (contract + happy path)', async () => {
    const c = makeClient(app.base);
    await signUp(c);

    const created = await c.post('/api/tasks', { title: 'Buy groceries', priority: 'high', dueDate: '2026-01-10' });
    assert.equal(created.status, 201);
    const id = created.data.task.id;
    assert.equal(created.data.task.title, 'Buy groceries');
    assert.equal(created.data.task.status, 'todo');

    const list = await c.get('/api/tasks');
    assert.equal(list.status, 200);
    assert.ok(list.data.tasks.some((t2) => t2.id === id));

    const detail = await c.get(`/api/tasks/${id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.data.task.id, id);
    assert.deepEqual(detail.data.comments, []);

    const patched = await c.patch(`/api/tasks/${id}`, { title: 'Buy groceries and milk' });
    assert.equal(patched.status, 200);
    assert.equal(patched.data.task.title, 'Buy groceries and milk');

    const postponed = await c.post(`/api/tasks/${id}/postpone`, { days: 2 });
    assert.equal(postponed.status, 200);
    assert.equal(postponed.data.task.dueDate, '2026-01-12');

    const deleted = await c.del(`/api/tasks/${id}`);
    assert.equal(deleted.status, 200);
    const afterDelete = await c.get(`/api/tasks/${id}`);
    assert.equal(afterDelete.status, 404);
  });

  await t.test('creating a task without a title fails validation', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const res = await c.post('/api/tasks', { priority: 'low' });
    assert.equal(res.status, 400);
    assert.ok(res.data.fields.title);
  });

  await t.test('comments: add a comment and see it on the task', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/tasks', { title: 'Task with comments' });
    const id = created.data.task.id;

    const empty = await c.post(`/api/tasks/${id}/comments`, { body: '   ' });
    assert.equal(empty.status, 400);

    const comment = await c.post(`/api/tasks/${id}/comments`, { body: 'First comment' });
    assert.equal(comment.status, 201);
    assert.equal(comment.data.comment.body, 'First comment');

    const detail = await c.get(`/api/tasks/${id}`);
    assert.equal(detail.data.comments.length, 1);
  });

  // --- Fix #3: task assignment must be validated against family membership ---
  await t.test('assignment fix: assignedTo without a familyId is rejected on create', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const res = await c.post('/api/tasks', { title: 'No family context', assignedTo: 999999 });
    assert.equal(res.status, 400);
    assert.ok(res.data.fields.assignedTo);
  });

  await t.test('assignment fix: assignedTo referencing a real user who is NOT a family member is rejected', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const stranger = makeClient(app.base);
    const { res: strangerUser } = await signUp(stranger);

    const family = await owner.post('/api/family', { name: 'Owner Family' });
    assert.equal(family.status, 201);

    const res = await owner.post('/api/tasks', {
      title: 'Assign to a stranger',
      familyId: family.data.family.id,
      assignedTo: strangerUser.data.user.id,
    });
    assert.equal(res.status, 400);
    assert.ok(res.data.fields.assignedTo);

    // Confirm no task was created and the stranger cannot see anything.
    const strangerTasks = await stranger.get('/api/tasks');
    assert.equal(strangerTasks.data.tasks.length, 0);
  });

  await t.test('assignment fix: assigning to an actual family member succeeds and they can see it', async () => {
    const owner = makeClient(app.base);
    const { res: ownerUser } = await signUp(owner);
    const member = makeClient(app.base);
    const { res: memberUser } = await signUp(member);

    const family = await owner.post('/api/family', { name: 'Real Family' });
    const familyId = family.data.family.id;

    // Owner adds the member by phone (existing working flow), then assigns a task to them.
    const memberPhoneRes = await owner.post(`/api/family/${familyId}/members`, {
      phone: (await member.get('/api/auth/me')).data.user.phone,
    });
    assert.equal(memberPhoneRes.status, 201);

    const task = await owner.post('/api/tasks', {
      title: 'Do the dishes',
      familyId,
      visibility: 'family',
      assignedTo: memberUser.data.user.id,
    });
    assert.equal(task.status, 201);

    const memberTasks = await member.get('/api/tasks');
    assert.ok(memberTasks.data.tasks.some((t2) => t2.title === 'Do the dishes'));

    void ownerUser;
  });

  await t.test('assignment fix: PATCH also validates assignedTo, and unassigning (null) is always allowed', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const task = await owner.post('/api/tasks', { title: 'Reassign test' });
    const id = task.data.task.id;

    const badPatch = await owner.patch(`/api/tasks/${id}`, { assignedTo: 999999 });
    assert.equal(badPatch.status, 400);

    const unassign = await owner.patch(`/api/tasks/${id}`, { assignedTo: null });
    assert.equal(unassign.status, 200);
  });

  // --- Fix #2: recurring tasks create their next occurrence on completion ---
  await t.test('recurrence fix: completing a daily-recurring task creates the next occurrence', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/tasks', {
      title: 'Daily standup',
      dueDate: '2026-03-10',
      recurrence: 'daily',
    });
    const id = created.data.task.id;

    const completed = await c.patch(`/api/tasks/${id}`, { status: 'completed' });
    assert.equal(completed.status, 200);
    assert.equal(completed.data.task.status, 'completed');

    const list = await c.get('/api/tasks');
    const occurrences = list.data.tasks.filter((t2) => t2.title === 'Daily standup');
    assert.equal(occurrences.length, 2, 'expected the original (completed) task plus one new todo occurrence');
    const next = occurrences.find((t2) => t2.status === 'todo');
    assert.ok(next, 'a new todo occurrence should exist');
    assert.equal(next.dueDate, '2026-03-11');
    assert.equal(next.recurrence, 'daily');
  });

  await t.test('recurrence fix: weekly recurrence advances by 7 days', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/tasks', { title: 'Weekly review', dueDate: '2026-03-10', recurrence: 'weekly' });
    await c.patch(`/api/tasks/${created.data.task.id}`, { status: 'completed' });
    const list = await c.get('/api/tasks');
    const next = list.data.tasks.find((t2) => t2.title === 'Weekly review' && t2.status === 'todo');
    assert.ok(next);
    assert.equal(next.dueDate, '2026-03-17');
  });

  await t.test('recurrence fix: recurrenceUntil stops generation once passed', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/tasks', {
      title: 'Ending soon',
      dueDate: '2026-03-10',
      recurrence: 'daily',
      recurrenceUntil: '2026-03-10',
    });
    await c.patch(`/api/tasks/${created.data.task.id}`, { status: 'completed' });
    const list = await c.get('/api/tasks');
    const occurrences = list.data.tasks.filter((t2) => t2.title === 'Ending soon');
    assert.equal(occurrences.length, 1, 'no next occurrence should be created once recurrenceUntil has passed');
  });

  await t.test('recurrence fix: a task with no due date and recurrence set does not spawn anything (nothing to advance from)', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/tasks', { title: 'No due date', recurrence: 'daily' });
    await c.patch(`/api/tasks/${created.data.task.id}`, { status: 'completed' });
    const list = await c.get('/api/tasks');
    const occurrences = list.data.tasks.filter((t2) => t2.title === 'No due date');
    assert.equal(occurrences.length, 1);
  });

  await t.test('recurrence fix: a non-recurring task does not spawn a next occurrence', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/tasks', { title: 'One-off', dueDate: '2026-03-10' });
    await c.patch(`/api/tasks/${created.data.task.id}`, { status: 'completed' });
    const list = await c.get('/api/tasks');
    const occurrences = list.data.tasks.filter((t2) => t2.title === 'One-off');
    assert.equal(occurrences.length, 1);
  });
});
