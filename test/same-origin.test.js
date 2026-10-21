// A browser's own page must always be allowed to sign in and chat, even when APP_BASE_URL names another
// address (it did in production: every POST was refused with "This request did not come from LifeAdmin").
// Pages of other sites stay refused.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('same-origin rule', async (t) => {
  process.env.APP_BASE_URL = 'https://some-other-address.example.test';
  const app = await startApp();
  process.env.APP_BASE_URL = 'https://some-other-address.example.test'; // startApp blanks it; the wrong one is the point
  t.after(async () => {
    process.env.APP_BASE_URL = '';
    await app.close();
  });
  const c = makeClient(app.base);
  const { payload } = await signUp(c);
  const post = (url, body, headers) => fetch(app.base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

  await t.test('the page served by this very server can sign in although APP_BASE_URL is another address', async () => {
    const r = await post('/api/auth/login', { identifier: payload.email, password: payload.password }, { Origin: app.base, 'Sec-Fetch-Site': 'same-origin' });
    assert.equal(r.status, 200);
  });

  await t.test('behind a proxy: the forwarded host counts as this site', async () => {
    const r = await post('/api/auth/login', { identifier: payload.email, password: payload.password }, { Origin: 'https://my-site.example.test', 'X-Forwarded-Host': 'my-site.example.test' });
    assert.equal(r.status, 200);
  });

  await t.test('another site is still refused, with or without the configured address', async () => {
    for (const origin of ['https://evil.example', 'http://127.0.0.1:1', 'https://some-other-address.example.test.evil.example']) {
      const r = await post('/api/auth/login', { identifier: payload.email, password: payload.password }, { Origin: origin });
      assert.equal(r.status, 403, origin);
    }
    const r = await post('/api/auth/login', { identifier: payload.email, password: payload.password }, { 'Sec-Fetch-Site': 'cross-site' });
    assert.equal(r.status, 403);
  });
});
