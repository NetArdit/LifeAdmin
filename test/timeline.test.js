const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('timeline', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('empty timeline for a fresh user', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const res = await c.get('/api/timeline');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.activity, []);
  });

  await t.test('actions across features are reflected in the unified timeline', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    await c.post('/api/tasks', { title: 'Timeline task' });
    await c.post('/api/family', { name: 'Timeline Family' });

    const res = await c.get('/api/timeline');
    assert.equal(res.status, 200);
    const types = res.data.activity.map((a) => a.type);
    assert.ok(types.includes('task_created'));
    assert.ok(types.includes('member_joined'));
  });

  await t.test('a user only sees their own activity plus their families’, not other users’ private activity', async () => {
    const a = makeClient(app.base);
    await signUp(a);
    await a.post('/api/tasks', { title: 'A private task' });

    const b = makeClient(app.base);
    await signUp(b);
    const res = await b.get('/api/timeline');
    assert.deepEqual(res.data.activity, []);
  });
});
