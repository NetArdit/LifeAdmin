const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('ecolife', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('log an eco action, list it, see it in the summary rollup', async () => {
    const c = makeClient(app.base);
    await signUp(c);

    const created = await c.post('/api/ecolife', { category: 'transport', action: 'Took the bus', quantity: 12, unit: 'km' });
    assert.equal(created.status, 201);

    const list = await c.get('/api/ecolife');
    assert.equal(list.data.logs.length, 1);

    const summary = await c.get('/api/ecolife/summary');
    assert.equal(summary.status, 200);
    assert.equal(summary.data.summary.transport.count, 1);
    assert.equal(summary.data.summary.transport.totalQuantity, 12);
    assert.equal(summary.data.totalLogs, 1);
  });

  await t.test('validation: invalid category and empty action are rejected', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const badCategory = await c.post('/api/ecolife', { category: 'not-a-real-category', action: 'x' });
    assert.equal(badCategory.status, 400);
    const noAction = await c.post('/api/ecolife', { category: 'transport', action: '' });
    assert.equal(noAction.status, 400);
  });

  await t.test('delete a log, and a log is private to its owner', async () => {
    const a = makeClient(app.base);
    await signUp(a);
    const created = await a.post('/api/ecolife', { category: 'waste', action: 'Recycled paper' });
    const id = created.data.log.id;

    const b = makeClient(app.base);
    await signUp(b);
    const forbidden = await b.del(`/api/ecolife/${id}`);
    assert.equal(forbidden.status, 404);

    const ok = await a.del(`/api/ecolife/${id}`);
    assert.equal(ok.status, 200);
  });

  await t.test('eco tips endpoint degrades cleanly without an AI key', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const res = await c.post('/api/ecolife/tips', {});
    assert.equal(res.status, 200);
    assert.equal(res.data.ok, false);
  });
});
