// Email ownership (the link flow), signup that reveals nothing, Google sign-in and account linking.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { startApp, makeClient, uniqueUser, signUp, verificationTokenFor, verifyEmailOf } = require('./helpers');

test('identity: email verification, uniform signup, Google sign-in', async (t) => {
  // A stand-in for Google's token endpoint: it answers with whatever claims the test sets.
  const mock = { claims: null, status: 200, calls: [] };
  const mockServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      mock.calls.push(new URLSearchParams(body));
      const payload = Buffer.from(JSON.stringify(mock.claims || {})).toString('base64url');
      res.writeHead(mock.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id_token: `x.${payload}.y` }));
    });
  });
  await new Promise((r) => mockServer.listen(0, r));
  process.env.GOOGLE_CLIENT_ID = 'test-client';
  process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
  process.env.GOOGLE_TOKEN_URL = `http://127.0.0.1:${mockServer.address().port}/token`;

  const app = await startApp();
  const db = require('../src/db');
  t.after(async () => {
    await app.close();
    mockServer.close();
  });

  const fresh = () => makeClient(app.base);

  // ---- email ownership -----------------------------------------------------------------------------------
  await t.test('an account starts unverified; the confirmation link verifies it, once, and the status comes from the server', async () => {
    const c = fresh();
    const { res, payload } = await signUp(c);
    assert.equal(res.data.user.emailVerified, false);
    assert.ok(verificationTokenFor(payload.email), 'signup sent the confirmation link');
    const token = verificationTokenFor(payload.email);

    const anon = fresh(); // opened on another device, not signed in: the token is the proof
    const ok = await anon.post('/api/auth/verify-email', { token });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.alreadyVerified, false);
    assert.equal((await c.get('/api/auth/me')).data.user.emailVerified, true);

    const twice = await anon.post('/api/auth/verify-email', { token });
    assert.equal(twice.status, 200, 'clicking the link twice is not an error');
    assert.equal(twice.data.alreadyVerified, true);
  });

  await t.test('a client cannot declare its own email verified: no route takes the flag, the old demo code is gone for email', async () => {
    const c = fresh();
    await signUp(c);
    const s = await c.patch('/api/settings/profile', { emailVerified: true, email_verified: 1 });
    assert.notEqual(s.data && s.data.user && s.data.user.emailVerified, true);
    assert.equal((await c.get('/api/auth/me')).data.user.emailVerified, false);
    const req = await c.post('/api/auth/verify/email/request', {});
    assert.equal(req.status, 400);
    assert.equal(req.data.demoCode, undefined);
    assert.equal((await c.post('/api/auth/verify/email/confirm', { code: '123456' })).status, 400);
  });

  await t.test('a wrong, expired or replaced link fails with one message; a link made for an old address proves nothing', async () => {
    const c = fresh();
    const { payload } = await signUp(c);
    const first = verificationTokenFor(payload.email);
    assert.equal((await fresh().post('/api/auth/verify-email', { token: 'not-a-real-token-at-all-0000' })).status, 400);
    assert.equal((await fresh().post('/api/auth/verify-email', {})).status, 400);

    // A newer link replaces the older one.
    const resend = await c.post('/api/auth/verify-email/resend', {});
    assert.equal(resend.status, 200);
    assert.equal(resend.data.delivered, true);
    const second = verificationTokenFor(payload.email);
    assert.notEqual(first, second);
    assert.equal((await fresh().post('/api/auth/verify-email', { token: first })).status, 400, 'the older link no longer works');

    // Expired.
    await db.run('UPDATE email_verification_tokens SET expires_at = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)', [Date.now() - 1000, payload.email]);
    assert.equal((await fresh().post('/api/auth/verify-email', { token: second })).status, 400);
    assert.equal((await c.get('/api/auth/me')).data.user.emailVerified, false, 'nothing was verified by the failures');

    // The address changed after the link was sent.
    await c.post('/api/auth/verify-email/resend', {});
    const third = verificationTokenFor(payload.email);
    await db.run('UPDATE users SET email = ? WHERE email = ?', [`moved.${payload.email}`, payload.email]);
    assert.equal((await fresh().post('/api/auth/verify-email', { token: third })).status, 400);
  });

  await t.test('resending is rate limited and needs a session; a verified account is told so', async () => {
    const c = fresh();
    const { payload } = await signUp(c);
    assert.equal((await fresh().post('/api/auth/verify-email/resend', {})).status, 401);
    assert.equal((await c.post('/api/auth/verify-email/resend', {})).status, 200);
    assert.equal((await c.post('/api/auth/verify-email/resend', {})).status, 200);
    assert.equal((await c.post('/api/auth/verify-email/resend', {})).status, 200);
    assert.equal((await c.post('/api/auth/verify-email/resend', {})).status, 429);
    const v = fresh();
    const { payload: p2 } = await signUp(v);
    await verifyEmailOf(v, p2.email);
    assert.equal((await v.post('/api/auth/verify-email/resend', {})).data.alreadyVerified, true);
    assert.ok(payload);
  });

  // ---- signup that reveals nothing -------------------------------------------------------------------------
  await t.test('signup: new and existing addresses get the same answer; the existing owner gets a notice, not a second account', async () => {
    const mailer = require('../src/lib/mailer');
    const owner = fresh();
    const { payload } = await signUp(owner);
    const before = (await db.get('SELECT COUNT(*) AS c FROM users')).c;

    const anon = fresh();
    const dup = await anon.post('/api/auth/signup', uniqueUser({ email: payload.email.toUpperCase() }));
    const novel = await anon.post('/api/auth/signup', uniqueUser());
    assert.equal(dup.status, 202);
    assert.deepEqual(dup.data, novel.data);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM users')).c, Number(before) + 1, 'only the new address made an account');
    const notice = mailer.getOutbox().filter((m) => m.to === payload.email && /already has one/.test(m.text)).pop();
    assert.ok(notice, 'the owner of the existing account was told');
  });

  await t.test('signup attempts are rate limited per address without telling new from existing apart', async () => {
    const anon = fresh();
    const u = uniqueUser();
    const codes = [];
    for (let i = 0; i < 4; i++) codes.push((await anon.post('/api/auth/signup', { ...u })).status);
    assert.deepEqual(codes, [202, 202, 202, 429]);
  });

  await t.test('a phone number already used by another account is not an error and is not revealed', async () => {
    const a = fresh();
    const { payload } = await signUp(a);
    const anon = fresh();
    const other = uniqueUser({ phone: payload.phone });
    assert.equal((await anon.post('/api/auth/signup', other)).status, 202);
    const login = await anon.post('/api/auth/login', { identifier: other.email, password: other.password });
    assert.equal(login.status, 200);
    assert.equal(login.data.user.phone, null);
  });

  // ---- Google ---------------------------------------------------------------------------------------------
  const setCookies = (res) => (res.headers.getSetCookie ? res.headers.getSetCookie() : []);
  async function googleSignIn(claims = {}, { mutate } = {}) {
    const start = await fetch(`${app.base}/api/auth/google/start`, { redirect: 'manual' });
    assert.equal(start.status, 302);
    const loc = new URL(start.headers.get('location'));
    const state = loc.searchParams.get('state');
    const nonce = loc.searchParams.get('nonce');
    const stateCookie = setCookies(start).find((c) => c.startsWith('la_oauth=')).split(';')[0];
    mock.claims = {
      iss: 'https://accounts.google.com',
      aud: 'test-client',
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce,
      sub: `sub-${Math.random()}`,
      email: `g.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.test`,
      email_verified: true,
      given_name: 'Gina',
      family_name: 'Google',
      ...claims,
    };
    const cb = await fetch(`${app.base}/api/auth/google/callback?code=abc&state=${mutate && mutate.state ? mutate.state : state}`, {
      redirect: 'manual',
      headers: { cookie: mutate && mutate.noCookie ? '' : stateCookie },
    });
    const session = setCookies(cb).find((c) => c.startsWith('la_session='));
    return { start, loc, state, stateCookie, cb, location: cb.headers.get('location'), session: session ? session.split(';')[0] : null, claims: mock.claims };
  }
  const meWith = async (cookie) => (await fetch(`${app.base}/api/auth/me`, { headers: { cookie } })).json();

  await t.test('start: PKCE S256 + state + nonce, the state cookie is HttpOnly, no secret in the address', async () => {
    const start = await fetch(`${app.base}/api/auth/google/start`, { redirect: 'manual' });
    const loc = new URL(start.headers.get('location'));
    assert.equal(loc.origin + loc.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
    assert.equal(loc.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(loc.searchParams.get('code_challenge').length >= 40);
    assert.ok(loc.searchParams.get('state').length >= 40);
    assert.ok(loc.searchParams.get('nonce'));
    assert.equal(loc.searchParams.get('client_id'), 'test-client');
    assert.match(loc.searchParams.get('redirect_uri'), /\/api\/auth\/google\/callback$/);
    assert.doesNotMatch(start.headers.get('location'), /test-secret/);
    const cookie = setCookies(start).find((c) => c.startsWith('la_oauth='));
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
  });

  await t.test('a new Google person gets an account (verified email, no phone) and a session; coming back finds the same one', async () => {
    const a = await googleSignIn({ sub: 'sub-new-person', email: 'newgoogle@example.test' });
    assert.equal(a.location, '/');
    assert.ok(a.session);
    const me = (await meWith(a.session)).user;
    assert.equal(me.email, 'newgoogle@example.test');
    assert.equal(me.emailVerified, true);
    assert.equal(me.phone, null);
    const b = await googleSignIn({ sub: 'sub-new-person', email: 'newgoogle@example.test' });
    assert.equal((await meWith(b.session)).user.id, me.id);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM users WHERE email = ?', ['newgoogle@example.test'])).c, 1);
    // The PKCE verifier went to Google's token endpoint with the code.
    assert.ok(mock.calls.at(-1).get('code_verifier'));
    assert.equal(mock.calls.at(-1).get('grant_type'), 'authorization_code');
  });

  await t.test('linking: a password account with a VERIFIED email is joined to the Google identity and keeps its password', async () => {
    const c = fresh();
    const { res, payload } = await signUp(c);
    await verifyEmailOf(c, payload.email);
    const g = await googleSignIn({ email: payload.email });
    assert.equal(g.location, '/');
    assert.equal((await meWith(g.session)).user.id, res.data.user.id);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM google_identities WHERE user_id = ?', [res.data.user.id])).c, 1);
    assert.equal((await fresh().post('/api/auth/login', { identifier: payload.email, password: payload.password })).status, 200);
  });

  await t.test('no takeover: a password account whose email was never verified is NOT joined, and nobody is signed in', async () => {
    const c = fresh();
    const { res, payload } = await signUp(c); // an attacker may have registered the victim's address like this
    const g = await googleSignIn({ email: payload.email });
    assert.match(g.location, /auth_error=google_link_needs_signin/);
    assert.equal(g.session, null);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM google_identities WHERE user_id = ?', [res.data.user.id])).c, 0);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM users WHERE email = ?', [payload.email])).c, 1, 'no second account was made');
  });

  await t.test('a Google email that Google itself has not verified is refused', async () => {
    const g = await googleSignIn({ email_verified: false });
    assert.match(g.location, /auth_error=google_unverified/);
    assert.equal(g.session, null);
  });

  await t.test('callback checks: state from another browser, state without cookie, reused state, wrong audience/issuer/nonce, expired token, cancelled', async () => {
    const other = await googleSignIn({});
    assert.ok(other.session);
    const reuse = await fetch(`${app.base}/api/auth/google/callback?code=abc&state=${other.state}`, { redirect: 'manual', headers: { cookie: other.stateCookie } });
    assert.match(reuse.headers.get('location'), /google_failed/, 'a state works once');

    assert.match((await googleSignIn({}, { mutate: { noCookie: true } })).location, /google_failed/);
    assert.match((await googleSignIn({}, { mutate: { state: 'forged-state-value' } })).location, /google_failed/);
    assert.match((await googleSignIn({ aud: 'someone-else' })).location, /google_failed/);
    assert.match((await googleSignIn({ iss: 'https://evil.example' })).location, /google_failed/);
    assert.match((await googleSignIn({ nonce: 'wrong' })).location, /google_failed/);
    assert.match((await googleSignIn({ exp: Math.floor(Date.now() / 1000) - 10 })).location, /google_failed/);
    mock.status = 400;
    assert.match((await googleSignIn({})).location, /google_failed/);
    mock.status = 200;

    const start = await fetch(`${app.base}/api/auth/google/start`, { redirect: 'manual' });
    const cookie = setCookies(start).find((c) => c.startsWith('la_oauth=')).split(';')[0];
    const denied = await fetch(`${app.base}/api/auth/google/callback?error=access_denied`, { redirect: 'manual', headers: { cookie } });
    assert.match(denied.headers.get('location'), /google_cancelled/);
    assert.equal(denied.headers.get('location').includes('access_denied'), false, 'the address carries our short code only');
  });

  await t.test('when Google is not configured the button is hidden and the start says so, kindly', async () => {
    assert.equal((await (await fetch(`${app.base}/api/config`)).json()).googleConfigured, true);
    const id = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = '';
    try {
      assert.equal((await (await fetch(`${app.base}/api/config`)).json()).googleConfigured, false);
      const start = await fetch(`${app.base}/api/auth/google/start`, { redirect: 'manual' });
      assert.match(start.headers.get('location'), /google_unavailable/);
    } finally {
      process.env.GOOGLE_CLIENT_ID = id;
    }
  });
});
