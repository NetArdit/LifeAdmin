const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('bills', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('create/list/patch/delete a bill', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/bills', { name: 'Internet', amount: 25, dueDate: '2026-04-01', category: 'internet', recurrence: 'monthly' });
    assert.equal(created.status, 201);
    const id = created.data.bill.id;

    const list = await c.get('/api/bills');
    assert.ok(list.data.bills.some((b) => b.id === id));

    const patched = await c.patch(`/api/bills/${id}`, { amount: 30 });
    assert.equal(patched.data.bill.amount, 30);

    const deleted = await c.del(`/api/bills/${id}`);
    assert.equal(deleted.status, 200);
  });

  await t.test('validation: name required, amount must be positive, dueDate required', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const noName = await c.post('/api/bills', { amount: 10, dueDate: '2026-04-01' });
    assert.equal(noName.status, 400);
    const badAmount = await c.post('/api/bills', { name: 'X', amount: -5, dueDate: '2026-04-01' });
    assert.equal(badAmount.status, 400);
    const noDate = await c.post('/api/bills', { name: 'X', amount: 5 });
    assert.equal(noDate.status, 400);
  });

  // --- Fix (date math): monthly rollover must land on the correct next month ---
  await t.test('paying a monthly-recurring bill rolls the due date forward by exactly one month', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/bills', { name: 'Rent', amount: 400, dueDate: '2026-03-15', recurrence: 'monthly' });
    const id = created.data.bill.id;

    const paid = await c.post(`/api/bills/${id}/pay`, {});
    assert.equal(paid.status, 200);
    assert.equal(paid.data.bill.status, 'unpaid', 'a recurring bill stays unpaid with the due date advanced, not marked paid forever');
    assert.equal(paid.data.bill.dueDate, '2026-04-15');
  });

  await t.test('paying a yearly-recurring bill rolls the due date forward by exactly one year', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/bills', { name: 'Car insurance', amount: 240, dueDate: '2026-05-01', recurrence: 'yearly' });
    const paid = await c.post(`/api/bills/${created.data.bill.id}/pay`, {});
    assert.equal(paid.data.bill.dueDate, '2027-05-01');
  });

  await t.test('paying a non-recurring bill marks it paid permanently', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const created = await c.post('/api/bills', { name: 'One-time fee', amount: 50, dueDate: '2026-05-01', recurrence: 'none' });
    const paid = await c.post(`/api/bills/${created.data.bill.id}/pay`, {});
    assert.equal(paid.data.bill.status, 'paid');
  });

  // --- Fix: a recorded payment must show up in the figures the page displays ---
  await t.test('paying bills adds their amounts to paidThisMonth, per user', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const rent = await c.post('/api/bills', { name: 'Rent', amount: 400, dueDate: '2026-03-15', recurrence: 'monthly' });
    const fee = await c.post('/api/bills', { name: 'One-time fee', amount: 50.5, dueDate: '2026-05-01', recurrence: 'none' });
    const usd = await c.post('/api/bills', { name: 'Hosting', amount: 20, currency: 'USD', dueDate: '2026-05-01', recurrence: 'monthly' });

    const before = await c.get('/api/bills/stats');
    assert.deepEqual(before.data.stats.paidThisMonth, []);
    assert.equal(before.data.stats.paidThisMonthCount, 0);

    await c.post(`/api/bills/${rent.data.bill.id}/pay`, {});
    await c.post(`/api/bills/${fee.data.bill.id}/pay`, {});
    await c.post(`/api/bills/${usd.data.bill.id}/pay`, {});

    const after = await c.get('/api/bills/stats');
    // Currencies are totalled separately, never added together.
    assert.deepEqual(after.data.stats.paidThisMonth, [
      { currency: 'EUR', total: 450.5, count: 2 },
      { currency: 'USD', total: 20, count: 1 },
    ]);
    assert.equal(after.data.stats.paidThisMonthCount, 3);

    // Another user's payments never leak into this total.
    const other = makeClient(app.base);
    await signUp(other);
    const otherStats = await other.get('/api/bills/stats');
    assert.deepEqual(otherStats.data.stats.paidThisMonth, []);
  });

  await t.test('stats endpoint computes category totals and overdue/upcoming counts deterministically', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    await c.post('/api/bills', { name: 'Electricity', amount: 60, dueDate: '2020-01-01', category: 'electricity' });
    await c.post('/api/bills', { name: 'Water', amount: 20, dueDate: '2020-01-01', category: 'water' });
    const stats = await c.get('/api/bills/stats');
    assert.equal(stats.status, 200);
    assert.equal(stats.data.stats.byCategory.electricity, 60);
    assert.equal(stats.data.stats.byCategory.water, 20);
    assert.equal(stats.data.overdue.length, 2, 'both bills are due in 2020, well in the past');
  });

  await t.test('a bill belongs to its owner only — another user cannot see or modify it', async () => {
    const a = makeClient(app.base);
    await signUp(a);
    const created = await a.post('/api/bills', { name: 'Private bill', amount: 10, dueDate: '2026-01-01' });

    const b = makeClient(app.base);
    await signUp(b);
    const bList = await b.get('/api/bills');
    assert.equal(bList.data.bills.length, 0);

    const bPatch = await b.patch(`/api/bills/${created.data.bill.id}`, { amount: 999 });
    assert.equal(bPatch.status, 404);
  });
});
