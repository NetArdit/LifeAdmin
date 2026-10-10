// Phase 8.2: password recovery lifecycle + auth/session hardening + an
// authorization (IDOR) matrix. Uses only node:test and the shared helpers.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { startApp, makeClient, signUp } = require('./helpers');

function tokenFromMail(mail) {
  const m = /#\/reset-password\/([A-Za-z0-9_-]+)/.exec(mail.text);
  return m ? m[1] : null;
}

test('account recovery + auth hardening', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  // Loaded only AFTER startApp so they bind to the disposable test database.
  const db = require('../src/db');
  const mailer = require('../src/lib/mailer');
  const { resetAllLimits } = require('../src/lib/authLimits');
  t.beforeEach(() => {
    resetAllLimits();
    mailer.clearOutbox();
  });

  async function newUser() {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    return { c, payload };
  }
  async function requestReset(email) {
    const anon = makeClient(app.base);
    const res = await anon.post('/api/auth/forgot-password', { email });
    const mail = mailer.getOutbox().filter((m) => m.to === email.trim().toLowerCase()).pop();
    return { res, mail, token: mail ? tokenFromMail(mail) : null };
  }

  // --- pre-existing bug verification: OTP expiry ---------------------------
  await t.test('verification code that expired earlier the same day is rejected', async () => {
    const { c } = await newUser();
    const req = await c.post('/api/auth/verify/email/request', {});
    const code = req.data.demoCode;
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    db.run("UPDATE otp_codes SET expires_at = ? WHERE code = ?", [past, code]);
    const res = await c.post('/api/auth/verify/email/confirm', { code });
    assert.equal(res.status, 400, 'an expired verification code must not be accepted');
  });

  // --- forgot password: enumeration + token handling -----------------------
  await t.test('forgot-password gives an identical response for existing and unknown emails; only the existing one gets mail', async () => {
    const { payload } = await newUser();
    const existing = await requestReset(payload.email);
    const unknown = await requestReset('nobody-here@example.test');
    assert.equal(existing.res.status, 200);
    assert.equal(unknown.res.status, 200);
    assert.deepEqual(existing.res.data, unknown.res.data);
    assert.ok(existing.mail, 'existing account should get a reset email');
    assert.equal(unknown.mail, undefined, 'unknown account must get no email');
    assert.equal(JSON.stringify(existing.res.data).includes(existing.token), false, 'the token must never be in the HTTP response');
  });

  await t.test('token is 256-bit random, stored only as a SHA-256 hash, with a 30-minute expiry', async () => {
    const { payload } = await newUser();
    const { token } = await requestReset(payload.email);
    assert.ok(token && token.length >= 43, 'base64url of 32 random bytes is 43 chars');
    const rows = db.all('SELECT * FROM password_reset_tokens');
    assert.equal(JSON.stringify(rows).includes(token), false, 'raw token must not be persisted');
    const row = rows.find((r) => r.token_hash === crypto.createHash('sha256').update(token).digest('hex'));
    assert.ok(row, 'the SHA-256 hash of the token is stored');
    const ttl = row.expires_at - row.created_at;
    assert.equal(ttl, 30 * 60 * 1000);
  });

  await t.test('successful reset: new password works, old fails, token is single-use, every session is signed out', async () => {
    const { c, payload } = await newUser();
    assert.equal((await c.get('/api/auth/me')).data.user.email, payload.email.toLowerCase());
    const { token } = await requestReset(payload.email);

    const anon = makeClient(app.base);
    assert.equal((await anon.post('/api/auth/reset-password/check', { token })).status, 200);
    const done = await anon.post('/api/auth/reset-password', { token, password: 'brand-new-pass-1', confirmPassword: 'brand-new-pass-1' });
    assert.equal(done.status, 200);

    assert.equal((await c.get('/api/auth/me')).data.user, null, 'pre-existing session must be invalidated by a reset');
    const login = makeClient(app.base);
    assert.equal((await login.post('/api/auth/login', { identifier: payload.email, password: payload.password })).status, 400);
    assert.equal((await login.post('/api/auth/login', { identifier: payload.email, password: 'brand-new-pass-1' })).status, 200);

    const reuse = await anon.post('/api/auth/reset-password', { token, password: 'another-pass-22', confirmPassword: 'another-pass-22' });
    assert.equal(reuse.status, 400, 'a used token must not work again');
    assert.equal((await anon.post('/api/auth/reset-password/check', { token })).status, 400);
    assert.equal((await makeClient(app.base).post('/api/auth/login', { identifier: payload.email, password: 'another-pass-22' })).status, 400);
  });

  await t.test('a newer reset request supersedes the older link', async () => {
    const { payload } = await newUser();
    const first = await requestReset(payload.email);
    const second = await requestReset(payload.email);
    assert.notEqual(first.token, second.token);
    const anon = makeClient(app.base);
    assert.equal((await anon.post('/api/auth/reset-password', { token: first.token, password: 'supersede-pass-1', confirmPassword: 'supersede-pass-1' })).status, 400);
    assert.equal((await anon.post('/api/auth/reset-password', { token: second.token, password: 'supersede-pass-1', confirmPassword: 'supersede-pass-1' })).status, 200);
  });

  await t.test('expired, malformed, and unknown tokens all fail with the same generic message', async () => {
    const { payload } = await newUser();
    const { token } = await requestReset(payload.email);
    db.run('UPDATE password_reset_tokens SET expires_at = ?', [Date.now() - 1000]);
    const anon = makeClient(app.base);
    const expired = await anon.post('/api/auth/reset-password', { token, password: 'expired-pass-11', confirmPassword: 'expired-pass-11' });
    assert.equal(expired.status, 400);
    const garbage = await anon.post('/api/auth/reset-password', { token: 'garbage-token-that-is-long-enough', password: 'expired-pass-11', confirmPassword: 'expired-pass-11' });
    const missing = await anon.post('/api/auth/reset-password', { password: 'expired-pass-11', confirmPassword: 'expired-pass-11' });
    assert.equal(garbage.status, 400);
    assert.equal(missing.status, 400);
    assert.equal(expired.data.error, garbage.data.error);
    assert.equal(garbage.data.error, missing.data.error);
    assert.equal((await makeClient(app.base).post('/api/auth/login', { identifier: payload.email, password: 'expired-pass-11' })).status, 400);
  });

  await t.test('invalid new password (too short / mismatch) is rejected without consuming the token', async () => {
    const { payload } = await newUser();
    const { token } = await requestReset(payload.email);
    const anon = makeClient(app.base);
    const short = await anon.post('/api/auth/reset-password', { token, password: 'short', confirmPassword: 'short' });
    const mismatch = await anon.post('/api/auth/reset-password', { token, password: 'long-enough-1', confirmPassword: 'long-enough-2' });
    assert.equal(short.status, 400);
    assert.ok(short.data.fields.password);
    assert.equal(mismatch.status, 400);
    assert.ok(mismatch.data.fields.confirmPassword);
    assert.equal((await anon.post('/api/auth/reset-password/check', { token })).status, 200, 'token still valid after a validation failure');
  });

  // --- rate limiting ----------------------------------------------------------
  await t.test('forgot-password is rate limited per email and returns 429 with Retry-After', async () => {
    const { payload } = await newUser();
    const anon = makeClient(app.base);
    for (let i = 0; i < 3; i++) assert.equal((await anon.post('/api/auth/forgot-password', { email: payload.email })).status, 200);
    const res = await fetch(app.base + '/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: payload.email }) });
    assert.equal(res.status, 429);
    assert.ok(res.headers.get('retry-after'));
    // The same limit applies to an unknown address, so it reveals nothing about existence.
    const u = 'ghost@example.test';
    for (let i = 0; i < 3; i++) await anon.post('/api/auth/forgot-password', { email: u });
    assert.equal((await anon.post('/api/auth/forgot-password', { email: u })).status, 429);
  });

  await t.test('repeated failed logins are locked out (429), regardless of whether the account exists', async () => {
    const { payload } = await newUser();
    const anon = makeClient(app.base);
    for (let i = 0; i < 8; i++) assert.equal((await anon.post('/api/auth/login', { identifier: payload.email, password: 'wrong-pass-' + i })).status, 400);
    assert.equal((await anon.post('/api/auth/login', { identifier: payload.email, password: payload.password })).status, 429, 'locked out even with the right password');
    for (let i = 0; i < 8; i++) await anon.post('/api/auth/login', { identifier: 'nobody@example.test', password: 'x' + i });
    assert.equal((await anon.post('/api/auth/login', { identifier: 'nobody@example.test', password: 'x' })).status, 429);
  });

  await t.test('a successful login resets the failure counter', async () => {
    const { payload } = await newUser();
    const anon = makeClient(app.base);
    for (let i = 0; i < 5; i++) await anon.post('/api/auth/login', { identifier: payload.email, password: 'nope' + i });
    assert.equal((await anon.post('/api/auth/login', { identifier: payload.email, password: payload.password })).status, 200);
    for (let i = 0; i < 5; i++) assert.equal((await anon.post('/api/auth/login', { identifier: payload.email, password: 'nope' + i })).status, 400);
  });

  await t.test('verification-code confirmation is locked after repeated wrong codes', async () => {
    const { c } = await newUser();
    await c.post('/api/auth/verify/email/request', {});
    for (let i = 0; i < 10; i++) assert.equal((await c.post('/api/auth/verify/email/confirm', { code: '00000' + (i % 10) })).status, 400);
    assert.equal((await c.post('/api/auth/verify/email/confirm', { code: '000000' })).status, 429);
  });

  await t.test('login by an unknown identifier takes comparable time to a wrong password (no cheap timing oracle)', async () => {
    const { payload } = await newUser();
    const anon = makeClient(app.base);
    async function median(identifier) {
      const times = [];
      for (let i = 0; i < 5; i++) {
        const s = process.hrtime.bigint();
        await anon.post('/api/auth/login', { identifier, password: 'wrong-password-' + i });
        times.push(Number(process.hrtime.bigint() - s) / 1e6);
      }
      return times.sort((a, b) => a - b)[2];
    }
    const known = await median(payload.email);
    resetAllLimits();
    const unknown = await median('missing.person@example.test');
    assert.ok(unknown >= known * 0.5, `unknown-user login (${unknown.toFixed(1)}ms) should not be much faster than wrong-password (${known.toFixed(1)}ms)`);
  });

  // --- mail transport + reset URL configuration -------------------------------
  await t.test('with no mail provider (transport "none") the response is unchanged and nothing is sent', async () => {
    const { payload } = await newUser();
    process.env.MAIL_TRANSPORT = 'none';
    try {
      const res = await makeClient(app.base).post('/api/auth/forgot-password', { email: payload.email });
      assert.equal(res.status, 200);
      assert.equal(mailer.getOutbox().length, 0);
    } finally {
      delete process.env.MAIL_TRANSPORT;
    }
  });

  await t.test('production: no APP_BASE_URL or a non-https one builds no link and sends nothing; https base is used verbatim', async () => {
    const { payload } = await newUser();
    const prev = { env: process.env.NODE_ENV, base: process.env.APP_BASE_URL, mt: process.env.MAIL_TRANSPORT };
    process.env.NODE_ENV = 'production';
    process.env.MAIL_TRANSPORT = 'outbox'; // only so a send would be observable
    const before = db.get('SELECT COUNT(*) c FROM password_reset_tokens').c;
    try {
      delete process.env.APP_BASE_URL;
      assert.equal((await makeClient(app.base).post('/api/auth/forgot-password', { email: payload.email })).status, 200);
      process.env.APP_BASE_URL = 'http://insecure.example.test';
      resetAllLimits();
      assert.equal((await makeClient(app.base).post('/api/auth/forgot-password', { email: payload.email })).status, 200);
      assert.equal(mailer.getOutbox().length, 0, 'no email without a valid https APP_BASE_URL in production');
      assert.equal(db.get('SELECT COUNT(*) c FROM password_reset_tokens').c, before, 'no token is even created');

      process.env.APP_BASE_URL = 'https://app.example.test/';
      resetAllLimits();
      await makeClient(app.base).post('/api/auth/forgot-password', { email: payload.email });
      const mail = mailer.getOutbox()[0];
      assert.ok(mail.text.includes('https://app.example.test/#/reset-password/'), 'link uses the configured origin, not the Host header');
    } finally {
      process.env.NODE_ENV = prev.env;
      if (prev.base === undefined) delete process.env.APP_BASE_URL; else process.env.APP_BASE_URL = prev.base;
      if (prev.mt === undefined) delete process.env.MAIL_TRANSPORT; else process.env.MAIL_TRANSPORT = prev.mt;
    }
  });

  await t.test('a spoofed Host header cannot influence the reset link', async () => {
    const { payload } = await newUser();
    await fetch(app.base + '/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': 'evil.example', 'Origin': 'https://evil.example' },
      body: JSON.stringify({ email: payload.email }),
    });
    const mail = mailer.getOutbox().pop();
    assert.ok(mail);
    assert.equal(mail.text.includes('evil.example'), false);
  });

  // --- session hardening -------------------------------------------------------
  await t.test('session cookie is HttpOnly + SameSite=Lax, and Secure only in production', async () => {
    async function setCookieFor(nodeEnv) {
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = nodeEnv;
      try {
        const payload = { firstName: 'C', lastName: 'K', email: `cookie.${nodeEnv}.${Date.now()}@example.test`, phone: '+38344' + String(Math.floor(100000 + Math.random() * 899999)), password: 'cookiepass123', confirmPassword: 'cookiepass123' };
        const res = await fetch(app.base + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return res.headers.get('set-cookie');
      } finally {
        process.env.NODE_ENV = prev;
      }
    }
    const dev = await setCookieFor('test');
    const prod = await setCookieFor('production');
    assert.match(dev, /HttpOnly/i);
    assert.match(dev, /SameSite=Lax/i);
    assert.doesNotMatch(dev, /Secure/i);
    assert.match(prod, /HttpOnly/i);
    assert.match(prod, /SameSite=Lax/i);
    assert.match(prod, /Secure/i);
  });

  await t.test('changing your password signs out other sessions but keeps the current one', async () => {
    const { c, payload } = await newUser();
    const other = makeClient(app.base);
    assert.equal((await other.post('/api/auth/login', { identifier: payload.email, password: payload.password })).status, 200);
    assert.ok((await other.get('/api/auth/me')).data.user);

    const changed = await c.post('/api/settings/password', { currentPassword: payload.password, newPassword: 'changed-pass-77' });
    assert.equal(changed.status, 200);
    assert.ok((await c.get('/api/auth/me')).data.user, 'the session that changed the password stays signed in');
    assert.equal((await other.get('/api/auth/me')).data.user, null, 'the other session is signed out');
  });

  await t.test('logout invalidates the session server-side (the old cookie no longer works)', async () => {
    const { payload } = await newUser();
    const raw = await fetch(app.base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: payload.email, password: payload.password }) });
    const cookie = raw.headers.get('set-cookie').split(';')[0];
    const me = (ck) => fetch(app.base + '/api/auth/me', { headers: { Cookie: ck } }).then((r) => r.json());
    assert.ok((await me(cookie)).user);
    await fetch(app.base + '/api/auth/logout', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal((await me(cookie)).user, null, 'replaying the pre-logout cookie must fail');
  });

  await t.test('account deletion still cascades reset tokens and the owner block message is accurate', async () => {
    const { c, payload } = await newUser();
    await requestReset(payload.email);
    await c.post('/api/family', { name: 'Blocked Family' });
    const blocked = await c.del('/api/settings/account', { password: payload.password });
    assert.equal(blocked.status, 400);
    assert.match(blocked.data.error, /isn't available/i, 'copy must not instruct actions that do not exist');
    assert.doesNotMatch(blocked.data.error, /transfer ownership or delete the family before/i);

    const { c: c2, payload: p2 } = await newUser();
    await requestReset(p2.email);
    const uid = db.get('SELECT id FROM users WHERE email = ?', [p2.email.toLowerCase()]).id;
    assert.equal((await c2.del('/api/settings/account', { password: p2.password })).status, 200);
    assert.equal(db.get('SELECT COUNT(*) c FROM password_reset_tokens WHERE user_id = ?', [uid]).c, 0);
  });

  // --- authorization (IDOR) matrix --------------------------------------------
  await t.test('IDOR matrix: a second user cannot read or mutate the first user\'s private or family data', async () => {
    const { c: a } = await newUser();
    const { c: b } = await newUser();
    const task = (await a.post('/api/tasks', { title: 'A private task' })).data.task;
    const bill = (await a.post('/api/bills', { name: 'A bill', amount: 5, dueDate: '2027-01-01' })).data.bill;
    const goal = (await a.post('/api/goals', { title: 'A goal' })).data.goal;
    const decision = (await a.post('/api/decisions', { question: 'A question' })).data.decision;
    const eco = (await a.post('/api/ecolife', { category: 'waste', action: 'A log' })).data.log;
    const family = (await a.post('/api/family', { name: 'A family' })).data.family;
    const item = (await a.post(`/api/family/${family.id}/shopping`, { name: 'milk' })).data.item;

    const denied = (r) => assert.ok(r.status === 403 || r.status === 404, `expected 403/404, got ${r.status}`);
    denied(await b.get(`/api/tasks/${task.id}`));
    denied(await b.patch(`/api/tasks/${task.id}`, { title: 'hijacked' }));
    denied(await b.del(`/api/tasks/${task.id}`));
    denied(await b.post(`/api/tasks/${task.id}/comments`, { body: 'x' }));
    denied(await b.post(`/api/tasks/${task.id}/postpone`, { days: 1 }));
    denied(await b.patch(`/api/bills/${bill.id}`, { amount: 999 }));
    denied(await b.post(`/api/bills/${bill.id}/pay`, {}));
    denied(await b.del(`/api/bills/${bill.id}`));
    denied(await b.get(`/api/goals/${goal.id}`));
    denied(await b.patch(`/api/goals/${goal.id}`, { title: 'hijacked' }));
    denied(await b.post(`/api/goals/${goal.id}/milestones`, { title: 'x' }));
    denied(await b.del(`/api/goals/${goal.id}`));
    denied(await b.get(`/api/decisions/${decision.id}`));
    denied(await b.post(`/api/decisions/${decision.id}/options`, { name: 'x' }));
    denied(await b.del(`/api/decisions/${decision.id}`));
    denied(await b.del(`/api/ecolife/${eco.id}`));
    denied(await b.get(`/api/family/${family.id}`));
    denied(await b.get(`/api/family/${family.id}/activity`));
    denied(await b.get(`/api/family/${family.id}/shopping`));
    denied(await b.post(`/api/family/${family.id}/shopping`, { name: 'x' }));
    denied(await b.patch(`/api/family/${family.id}/shopping/${item.id}`, { done: true }));
    denied(await b.del(`/api/family/${family.id}/shopping/${item.id}`));
    denied(await b.post(`/api/family/${family.id}/members`, { phone: '+38344999999' }));
    denied(await b.get(`/api/chat/${family.id}/messages`));
    denied(await b.post(`/api/chat/${family.id}/messages`, { body: 'x' }));

    // ...and A's data is intact afterwards.
    assert.equal((await a.get(`/api/tasks/${task.id}`)).data.task.title, 'A private task');
    assert.equal((await a.get(`/api/goals/${goal.id}`)).data.goal.title, 'A goal');
  });
}
);
