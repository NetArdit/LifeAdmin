const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, uniqueUser, signUp } = require('./helpers');

test('auth', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('GET /api/config reports AI as not configured (no ANTHROPIC_API_KEY in test env)', async () => {
    const c = makeClient(app.base);
    const res = await c.get('/api/config');
    assert.equal(res.status, 200);
    assert.equal(res.data.aiConfigured, false);
  });

  await t.test('signup rejects missing/invalid fields with field-level errors', async () => {
    const c = makeClient(app.base);
    const res = await c.post('/api/auth/signup', { firstName: '', email: 'not-an-email', phone: '1', password: 'short' });
    assert.equal(res.status, 400);
    assert.ok(res.data.fields.firstName);
    assert.ok(res.data.fields.email);
    assert.ok(res.data.fields.phone);
    assert.ok(res.data.fields.password);
  });

  await t.test('signup succeeds with valid data and sets a session (GET /me returns the user)', async () => {
    const c = makeClient(app.base);
    const { res } = await signUp(c);
    assert.equal(res.status, 201);
    assert.ok(res.data.user.id);
    assert.equal(res.data.user.emailVerified, false);

    const me = await c.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.data.user.id, res.data.user.id);
  });

  await t.test('signup rejects a duplicate email/phone', async () => {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);

    const c2 = makeClient(app.base);
    const dup = await c2.post('/api/auth/signup', uniqueUser({ email: payload.email }));
    assert.equal(dup.status, 400);
  });

  await t.test('login fails with wrong password, succeeds with correct password', async () => {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    c.clearCookie();

    const bad = await c.post('/api/auth/login', { identifier: payload.email, password: 'wrongpassword' });
    assert.equal(bad.status, 400);

    const good = await c.post('/api/auth/login', { identifier: payload.email, password: payload.password });
    assert.equal(good.status, 200);
    assert.equal(good.data.user.email, payload.email);
  });

  await t.test('unauthenticated requests to protected routes are rejected with 401', async () => {
    const c = makeClient(app.base);
    const res = await c.get('/api/tasks');
    assert.equal(res.status, 401);
  });

  await t.test('logout clears the session', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const out = await c.post('/api/auth/logout');
    assert.equal(out.status, 200);
    const me = await c.get('/api/auth/me');
    assert.equal(me.data.user, null);
  });
});
