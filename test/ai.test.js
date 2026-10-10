// The test environment intentionally has no ANTHROPIC_API_KEY set, so these
// tests verify the app's core promise (README): every AI feature must
// degrade to a clear "not configured" response rather than erroring or
// pretending to work — never that a real Claude call succeeds (that would
// require live network access and a paid key, out of scope for a contract
// test suite).
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('ai', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('GET /api/ai/status and /api/config both report AI as not configured', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const status = await c.get('/api/ai/status');
    assert.equal(status.status, 200);
    assert.equal(status.data.configured, false);

    const config = await c.get('/api/config');
    assert.equal(config.data.aiConfigured, false);
  });

  await t.test('AI-dependent endpoints return ok:false with a clear message instead of erroring', async () => {
    const c = makeClient(app.base);
    await signUp(c);

    const chat = await c.post('/api/ai/chat', { message: 'hello' });
    assert.equal(chat.status, 200);
    assert.equal(chat.data.ok, false);
    assert.match(chat.data.error, /ANTHROPIC_API_KEY/);

    const plan = await c.post('/api/ai/plan', { text: 'I want to study every day' });
    assert.equal(plan.data.ok, false);

    const review = await c.post('/api/ai/weekly-review', {});
    assert.equal(review.data.ok, false);
  });

  await t.test('bill insights and eco tips also degrade cleanly without a key', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    await c.post('/api/bills', { name: 'Test bill', amount: 10, dueDate: '2026-01-01' });
    const insights = await c.post('/api/bills/insights', {});
    assert.equal(insights.status, 200);
    assert.equal(insights.data.ok, false);

    const tips = await c.post('/api/ecolife/tips', {});
    assert.equal(tips.data.ok, false);
  });

  await t.test('decision AI analysis degrades cleanly without a key, and never fabricates a recommendation', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const decision = await c.post('/api/decisions', { question: 'Test decision' });
    await c.post(`/api/decisions/${decision.data.decision.id}/options`, { name: 'Option A' });
    const analyzed = await c.post(`/api/decisions/${decision.data.decision.id}/analyze`, {});
    assert.equal(analyzed.data.ok, false);
  });

  await t.test('AI endpoints still require authentication', async () => {
    const c = makeClient(app.base);
    const res = await c.post('/api/ai/chat', { message: 'hi' });
    assert.equal(res.status, 401);
  });

  // Batch 11: Settings' "Use AI features" checkbox (ai_enabled) was
  // persisted and shown to the user but never actually checked by any
  // AI-calling route — verified real gap, now enforced. These assert the
  // NEW behavior specifically: once turned off, every AI-calling endpoint
  // must refuse before ever reaching the (unconfigured, in this test env)
  // provider call, with a message that names Settings, not the server's
  // own missing API key — proving the two "AI unavailable" reasons are
  // now distinguishable, not collapsed into one generic message.
  await t.test('turning ai_enabled off blocks every AI-calling endpoint with a Settings-specific message', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    await c.patch('/api/settings/preferences', { aiEnabled: false });

    const chat = await c.post('/api/ai/chat', { message: 'hello' });
    assert.equal(chat.data.ok, false);
    assert.match(chat.data.error, /Settings/);
    assert.doesNotMatch(chat.data.error, /ANTHROPIC_API_KEY/);

    const plan = await c.post('/api/ai/plan', { text: 'plan my week' });
    assert.equal(plan.data.ok, false);
    assert.match(plan.data.error, /Settings/);

    const review = await c.post('/api/ai/weekly-review', {});
    assert.equal(review.data.ok, false);
    assert.match(review.data.error, /Settings/);

    const goal = await c.post('/api/goals', { title: 'Learn a language' });
    const suggested = await c.post(`/api/goals/${goal.data.goal.id}/suggest-milestones`, {});
    assert.equal(suggested.data.ok, false);
    assert.match(suggested.data.error, /Settings/);

    const decision = await c.post('/api/decisions', { question: 'Test decision' });
    await c.post(`/api/decisions/${decision.data.decision.id}/options`, { name: 'Option A' });
    const analyzed = await c.post(`/api/decisions/${decision.data.decision.id}/analyze`, {});
    assert.equal(analyzed.data.ok, false);
    assert.match(analyzed.data.error, /Settings/);

    await c.post('/api/bills', { name: 'Test bill', amount: 10, dueDate: '2026-01-01' });
    const insights = await c.post('/api/bills/insights', {});
    assert.equal(insights.data.ok, false);
    assert.match(insights.data.error, /Settings/);

    const tips = await c.post('/api/ecolife/tips', {});
    assert.equal(tips.data.ok, false);
    assert.match(tips.data.error, /Settings/);
  });

  await t.test('turning ai_enabled back on restores normal (unconfigured-server) behavior', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    await c.patch('/api/settings/preferences', { aiEnabled: false });
    await c.patch('/api/settings/preferences', { aiEnabled: true });
    const chat = await c.post('/api/ai/chat', { message: 'hello' });
    assert.equal(chat.data.ok, false);
    assert.match(chat.data.error, /ANTHROPIC_API_KEY/, 'back to the server-config reason, not the per-user Settings reason');
  });
});
