// Phase 8.3: the Resend adapter behind sendMail(), exercised against a LOCAL
// mock HTTP server (never the real provider — no credentials exist in this
// environment, so nothing here proves real delivery). Covers configuration,
// request shape, failure handling, enumeration safety and token protection.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startApp, makeClient, signUp } = require('./helpers');

const FAKE_KEY = 're_test_FAKE_KEY_1234567890';
const PROVIDER_SECRET_BODY = 'PROVIDER-INTERNAL-DETAIL-do-not-leak';

test('email provider (Resend adapter) and delivery-failure behaviour', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const mailer = require('../src/lib/mailer');

  // --- mock provider ---
  const calls = [];
  let mode = 'ok'; // ok | 401 | 500 | hang
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, headers: req.headers, body });
      if (mode === 'hang') return; // never answers -> client timeout
      if (mode === 'ok') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"id":"mock-1"}'); }
      res.writeHead(Number(mode), { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: PROVIDER_SECRET_BODY }));
    });
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  t.after(() => { mock.closeAllConnections?.(); return new Promise((r) => mock.close(r)); });
  const mockBase = `http://127.0.0.1:${mock.address().port}`;

  const saved = {};
  const KEYS = ['MAIL_TRANSPORT', 'RESEND_API_KEY', 'MAIL_FROM', 'RESEND_API_BASE', 'MAIL_TIMEOUT_MS', 'APP_BASE_URL', 'NODE_ENV'];
  for (const k of KEYS) saved[k] = process.env[k];
  t.after(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });
  const configure = (over = {}) => {
    Object.assign(process.env, {
      MAIL_TRANSPORT: 'resend', RESEND_API_KEY: FAKE_KEY, MAIL_FROM: 'LifeAdmin <no-reply@mail.example.test>',
      RESEND_API_BASE: mockBase, MAIL_TIMEOUT_MS: '2000', APP_BASE_URL: 'https://app.example.test',
    }, over);
    for (const [k, v] of Object.entries(over)) if (v === undefined) delete process.env[k];
  };

  // capture everything the server logs so we can prove nothing sensitive is printed
  const logs = [];
  const origErr = console.error, origLog = console.log, origWarn = console.warn;
  const capture = (...a) => logs.push(a.map(String).join(' '));
  const startCapture = () => { logs.length = 0; console.error = capture; console.log = capture; console.warn = capture; };
  const stopCapture = () => { console.error = origErr; console.log = origLog; console.warn = origWarn; };
  t.after(stopCapture);

  const message = { to: 'someone@example.test', subject: 'Hi', text: 'plain body', html: '<p>html body</p>' };
  const unusedTokens = (userId) => db.get('SELECT COUNT(*) c FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL AND expires_at > ?', [userId, Date.now()]).c;

  async function userWithEmail() {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    const id = (await c.get('/api/auth/me')).data.user.id;
    return { payload, id };
  }

  await t.test('transport selection: explicit, production auto-select, and safe defaults', () => {
    for (const k of KEYS) delete process.env[k];
    process.env.NODE_ENV = 'test';
    assert.equal(mailer.transportName(), 'outbox');
    process.env.NODE_ENV = 'production';
    assert.equal(mailer.transportName(), 'none', 'production without provider config sends nothing');
    process.env.RESEND_API_KEY = FAKE_KEY;
    assert.equal(mailer.transportName(), 'none', 'key alone is not enough');
    process.env.MAIL_FROM = 'a@b.test';
    assert.equal(mailer.transportName(), 'resend', 'key + sender in production selects resend');
    process.env.MAIL_TRANSPORT = 'none';
    assert.equal(mailer.transportName(), 'none', 'explicit value wins');
    process.env.MAIL_TRANSPORT = 'smtp';
    assert.equal(mailer.transportName(), 'resend', 'unknown value is ignored (no SMTP fallback exists)');
    process.env.NODE_ENV = 'test';
  });

  await t.test('success: correct endpoint, Bearer key, JSON body with from/to/subject/text/html', async () => {
    configure(); calls.length = 0; mode = 'ok';
    const r = await mailer.sendMail(message);
    assert.deepEqual(r, { delivered: true, transport: 'resend' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].url, '/emails');
    assert.equal(calls[0].headers.authorization, `Bearer ${FAKE_KEY}`);
    const body = JSON.parse(calls[0].body);
    assert.equal(body.from, 'LifeAdmin <no-reply@mail.example.test>');
    assert.deepEqual(body.to, ['someone@example.test']);
    assert.equal(body.subject, 'Hi');
    assert.equal(body.text, 'plain body');
    assert.equal(body.html, '<p>html body</p>');
  });

  await t.test('missing key or sender: no HTTP call, delivered:false, generic code, nothing thrown', async () => {
    calls.length = 0;
    for (const over of [{ RESEND_API_KEY: undefined }, { MAIL_FROM: undefined }]) {
      configure(over);
      startCapture();
      const r = await mailer.sendMail(message);
      stopCapture();
      assert.equal(r.delivered, false);
      assert.equal(r.error, 'not_configured');
      assert.ok(!logs.join('\n').includes(FAKE_KEY));
    }
    assert.equal(calls.length, 0);
  });

  await t.test('provider 401 / 500: delivered:false, no throw, provider body and key never logged or returned', async () => {
    configure();
    for (const status of ['401', '500']) {
      mode = status; calls.length = 0; startCapture();
      const r = await mailer.sendMail(message);
      stopCapture();
      assert.equal(r.delivered, false);
      assert.equal(r.error, 'provider_rejected');
      assert.ok(!JSON.stringify(r).includes(PROVIDER_SECRET_BODY));
      const out = logs.join('\n');
      assert.ok(out.includes(`HTTP ${status}`), 'status code is logged');
      assert.ok(!out.includes(PROVIDER_SECRET_BODY), 'provider body not logged');
      assert.ok(!out.includes(FAKE_KEY), 'API key not logged');
      assert.ok(!out.includes(message.text), 'message content not logged');
    }
  });

  await t.test('timeout and unreachable provider: bounded wait, delivered:false, no throw', async () => {
    configure({ MAIL_TIMEOUT_MS: '300' }); mode = 'hang';
    const t0 = Date.now();
    const r = await mailer.sendMail(message);
    assert.equal(r.delivered, false);
    assert.equal(r.error, 'provider_unreachable');
    assert.ok(Date.now() - t0 < 3000, 'did not hang');
    configure({ RESEND_API_BASE: 'http://127.0.0.1:1' });
    const r2 = await mailer.sendMail(message);
    assert.equal(r2.error, 'provider_unreachable');
    mode = 'ok';
  });

  await t.test('production: RESEND_API_BASE override is ignored so the key can never be redirected', async () => {
    configure({ NODE_ENV: 'production' }); calls.length = 0;
    // In production the adapter targets api.resend.com; block the real network by pointing fetch at a dead
    // socket via a stub so this test never touches the internet.
    const realFetch = global.fetch; let hitUrl = null;
    global.fetch = async (u) => { hitUrl = String(u); throw new Error('stubbed'); };
    startCapture();
    try { await mailer.sendMail(message); } finally { global.fetch = realFetch; stopCapture(); }
    process.env.NODE_ENV = 'test';
    assert.equal(hitUrl, 'https://api.resend.com/emails');
    assert.equal(calls.length, 0, 'mock server never contacted');
  });

  await t.test('forgot password via the adapter: generic response, email built from APP_BASE_URL, reset works end to end', async () => {
    configure(); mode = 'ok'; calls.length = 0;
    const u = await userWithEmail();
    const anon = makeClient(app.base);
    const res = await anon.post('/api/auth/forgot-password', { email: u.payload.email });
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    const sent = JSON.parse(calls[0].body);
    assert.deepEqual(sent.to, [u.payload.email.toLowerCase()]);
    assert.equal(sent.subject, 'Reset your LifeAdmin password');
    const m = /(https:\/\/app\.example\.test)\/#\/reset-password\/([A-Za-z0-9_-]+)/.exec(sent.text);
    assert.ok(m, 'link uses the configured https origin and fragment route');
    assert.doesNotMatch(sent.text + sent.html, /localhost|127\.0\.0\.1/);
    assert.match(sent.text, /30 minutes/);
    assert.match(sent.text, /didn't request this/i);
    assert.doesNotMatch(sent.text + sent.html, new RegExp(u.payload.password));
    assert.doesNotMatch(sent.html, /<img|tracking|pixel/i);
    assert.match(sent.html, /<a href="https:\/\/app\.example\.test\/#\/reset-password\//);
    // the token never appears in the HTTP response
    assert.ok(!JSON.stringify(res.data).includes(m[2]));
    const done = await anon.post('/api/auth/reset-password', { token: m[2], password: 'provider-new-pass-1', confirmPassword: 'provider-new-pass-1' });
    assert.equal(done.status, 200);
    assert.notEqual((await makeClient(app.base).post('/api/auth/login', { identifier: u.payload.email, password: u.payload.password })).status, 200, 'old password fails');
    assert.equal((await makeClient(app.base).post('/api/auth/login', { identifier: u.payload.email, password: 'provider-new-pass-1' })).status, 200, 'new password works');
  });

  await t.test('unknown email: identical response, provider never called', async () => {
    configure(); mode = 'ok';
    const u = await userWithEmail();
    const anon = makeClient(app.base);
    calls.length = 0;
    const known = await anon.post('/api/auth/forgot-password', { email: u.payload.email });
    const nBefore = calls.length;
    const unknown = await anon.post('/api/auth/forgot-password', { email: 'nobody-here@example.test' });
    assert.equal(calls.length, nBefore, 'no provider call for an unknown address');
    assert.equal(unknown.status, known.status);
    assert.deepEqual(unknown.data, known.data);
  });

  await t.test('provider failure: response still generic, no usable token left, nothing sensitive logged', async () => {
    configure(); mode = '500';
    const u = await userWithEmail();
    const anon = makeClient(app.base);
    calls.length = 0; startCapture();
    const res = await anon.post('/api/auth/forgot-password', { email: u.payload.email });
    stopCapture();
    assert.equal(res.status, 200, 'same status as success (enumeration-safe)');
    assert.equal(res.data.ok, true);
    assert.ok(!JSON.stringify(res.data).includes(PROVIDER_SECRET_BODY));
    assert.equal(calls.length, 1);
    assert.equal(unusedTokens(u.id), 0, 'the undeliverable token was invalidated');
    const sent = JSON.parse(calls[0].body);
    const token = /reset-password\/([A-Za-z0-9_-]+)/.exec(sent.text)[1];
    assert.equal((await anon.post('/api/auth/reset-password', { token, password: 'never-works-123', confirmPassword: 'never-works-123' })).status, 400);
    const out = logs.join('\n');
    assert.ok(!out.includes(token), 'token not logged');
    assert.ok(!out.includes(PROVIDER_SECRET_BODY));
    assert.ok(!out.includes(FAKE_KEY));
    // same shape as the success path for an existing account
    mode = 'ok';
    const other = await userWithEmail();
    const ok = await anon.post('/api/auth/forgot-password', { email: other.payload.email });
    assert.deepEqual(ok.data, res.data);
  });

  await t.test('provider timeout during forgot password: generic response, token invalidated', async () => {
    configure({ MAIL_TIMEOUT_MS: '300' }); mode = 'hang';
    const u = await userWithEmail();
    const res = await makeClient(app.base).post('/api/auth/forgot-password', { email: u.payload.email });
    assert.equal(res.status, 200);
    assert.equal(unusedTokens(u.id), 0);
    mode = 'ok';
  });

  await t.test('production without APP_BASE_URL (or with http): no email, no token, same generic response', async () => {
    configure({ NODE_ENV: 'production' }); mode = 'ok';
    const u = await userWithEmail();
    calls.length = 0;
    for (const base of [undefined, 'http://app.example.test']) {
      configure({ NODE_ENV: 'production', APP_BASE_URL: base });
      startCapture();
      const res = await makeClient(app.base).post('/api/auth/forgot-password', { email: u.payload.email });
      stopCapture();
      assert.equal(res.status, 200);
      assert.equal(res.data.ok, true);
    }
    process.env.NODE_ENV = 'test';
    assert.equal(calls.length, 0);
    assert.equal(unusedTokens(u.id), 0);
  });

  await t.test('production logs contain no reset token or link even when the request succeeds', async () => {
    configure(); mode = 'ok';
    const u = await userWithEmail(); // sign up in test mode; only the forgot request runs as production
    configure({ NODE_ENV: 'production' });
    // Production ignores RESEND_API_BASE, so stub the adapter's fetch (only for calls to the provider URL)
    // to keep this test off the real network.
    const realFetch = global.fetch;
    global.fetch = async (u, init) => {
      if (String(u).startsWith('https://api.resend.com/')) {
        calls.push({ method: init.method, url: String(u), headers: {}, body: init.body });
        return new Response('{"id":"stub"}', { status: 200 });
      }
      return realFetch(u, init);
    };
    calls.length = 0; startCapture();
    let fres;
    try {
      fres = await makeClient(app.base).post('/api/auth/forgot-password', { email: u.payload.email });
    } finally { global.fetch = realFetch; stopCapture(); }
    assert.equal(fres.status, 200, JSON.stringify(fres.data));
    process.env.NODE_ENV = 'test';
    assert.equal(calls.length, 1);
    const token = /reset-password\/([A-Za-z0-9_-]+)/.exec(JSON.parse(calls[0].body).text)[1];
    assert.ok(!logs.join('\n').includes(token));
    assert.ok(!logs.join('\n').includes('reset-password'));
  });
});
