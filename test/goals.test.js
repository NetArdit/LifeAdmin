const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('goals', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('create a goal, progress starts at 0 with no milestones', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/goals', { title: 'Learn TypeScript', category: 'learning' });
    assert.equal(created.status, 201);
    assert.equal(created.data.goal.progress, 0);
    assert.equal(created.data.goal.status, 'active');
  });

  await t.test('progress is derived from milestones done/total, never set directly', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const goal = await c.post('/api/goals', { title: 'Save 1000', category: 'financial' });
    const id = goal.data.goal.id;

    const m1 = await c.post(`/api/goals/${id}/milestones`, { title: 'Save 250' });
    await c.post(`/api/goals/${id}/milestones`, { title: 'Save 500' });
    await c.post(`/api/goals/${id}/milestones`, { title: 'Save 750' });
    await c.post(`/api/goals/${id}/milestones`, { title: 'Save 1000' });

    const afterOne = await c.patch(`/api/goals/${id}/milestones/${m1.data.milestone.id}`, { done: true });
    assert.equal(afterOne.data.goal.progress, 25);

    // A direct attempt to set progress via PATCH /goals/:id should have no effect —
    // progress is not in the accepted field map.
    const directAttempt = await c.patch(`/api/goals/${id}`, { progress: 99 });
    assert.equal(directAttempt.status, 200);
    const reloaded = await c.get(`/api/goals/${id}`);
    assert.equal(reloaded.data.goal.progress, 25, 'progress must remain derived from milestones, not settable directly');
  });

  await t.test('completing all milestones auto-completes the goal', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const goal = await c.post('/api/goals', { title: 'One milestone goal' });
    const id = goal.data.goal.id;
    const m = await c.post(`/api/goals/${id}/milestones`, { title: 'Only step' });
    const done = await c.patch(`/api/goals/${id}/milestones/${m.data.milestone.id}`, { done: true });
    assert.equal(done.data.goal.progress, 100);
    assert.equal(done.data.goal.status, 'completed');
  });

  await t.test('deleting a milestone recomputes progress', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const goal = await c.post('/api/goals', { title: 'Two milestones' });
    const id = goal.data.goal.id;
    const m1 = await c.post(`/api/goals/${id}/milestones`, { title: 'A' });
    const m2 = await c.post(`/api/goals/${id}/milestones`, { title: 'B' });
    await c.patch(`/api/goals/${id}/milestones/${m1.data.milestone.id}`, { done: true });
    const afterDelete = await c.del(`/api/goals/${id}/milestones/${m2.data.milestone.id}`);
    assert.equal(afterDelete.status, 200);
    const reloaded = await c.get(`/api/goals/${id}`);
    assert.equal(reloaded.data.goal.progress, 100, 'with the only remaining milestone done, progress should be 100');
  });

  await t.test('unchecking a milestone after completion reverts status to active (Batch 7C fix)', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const goal = await c.post('/api/goals', { title: 'Two-step goal' });
    const id = goal.data.goal.id;
    const m1 = await c.post(`/api/goals/${id}/milestones`, { title: 'A' });
    const m2 = await c.post(`/api/goals/${id}/milestones`, { title: 'B' });
    await c.patch(`/api/goals/${id}/milestones/${m1.data.milestone.id}`, { done: true });
    const completed = await c.patch(`/api/goals/${id}/milestones/${m2.data.milestone.id}`, { done: true });
    assert.equal(completed.data.goal.progress, 100);
    assert.equal(completed.data.goal.status, 'completed');

    // Previously this left status stuck at 'completed' while progress
    // dropped back under 100 — a real, reachable inconsistency.
    const reverted = await c.patch(`/api/goals/${id}/milestones/${m2.data.milestone.id}`, { done: false });
    assert.equal(reverted.data.goal.progress, 50);
    assert.equal(reverted.data.goal.status, 'active', 'status must revert to active once progress drops below 100');
  });

  await t.test('goals are private to their owner', async () => {
    const a = makeClient(app.base);
    await signUp(a);
    const goal = await a.post('/api/goals', { title: 'Private goal' });
    const b = makeClient(app.base);
    await signUp(b);
    const res = await b.get(`/api/goals/${goal.data.goal.id}`);
    assert.equal(res.status, 404);
  });
});
