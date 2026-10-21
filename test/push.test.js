// Notifications on devices (Web Push), unit 3: who may connect which browser to which account, what is
// stored, what is sent, and the first capture of the time zone. No push service is ever called: the sender
// is replaced.

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { startApp, makeClient, signUp, uniqueUser } = require('./helpers');

const b64 = (n) => crypto.randomBytes(n).toString('base64url');
const browser = (host = 'fcm.googleapis.com') => ({ endpoint: `https://${host}/fcm/send/${b64(24)}`, expirationTime: null, keys: { p256dh: b64(65), auth: b64(16) } });

test('push: a server without keys says so and takes no subscription', async (t) => {
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  // A developer's .env may hold a pair: empty values here are not replaced by it.
  process.env.VAPID_PUBLIC_KEY = '';
  process.env.VAPID_PRIVATE_KEY = '';
  process.env.PUSH_STORE_KEY = '';
  process.env.APP_BASE_URL = '';
  process.env.ALLOWED_ORIGINS = '';
  const app = await startApp();
  t.after(() => app.close());
  const c = makeClient(app.base);
  await signUp(c);
  assert.deepEqual((await c.get('/api/push/status')).data, { configured: false, publicKey: null, thisDevice: false, devices: 0 });
  assert.equal((await c.post('/api/push/subscription', browser())).status, 503);
  assert.equal((await c.post('/api/push/test')).status, 503);

  // The rest of this file runs with a pair, in the same process and database.
  const keys = require('web-push').generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  process.env.PUSH_STORE_KEY = b64(32);
  const db = require('../src/db');
  const push = require('../src/lib/push');
  const sent = [];
  let answer = () => ({ statusCode: 201 });
  const restore = push.setSender(async (subscription, payload, options) => {
    sent.push({ subscription, payload, options });
    const out = answer(subscription);
    if (out.statusCode >= 400) throw Object.assign(new Error('push service'), out);
    return out;
  });
  t.after(restore);
  t.beforeEach(() => {
    sent.length = 0;
    answer = () => ({ statusCode: 201 });
  });

  async function person() {
    const client = makeClient(app.base);
    const { res, payload } = await signUp(client);
    return { c: client, id: res.data.user.id, login: { identifier: payload.email, password: payload.password } };
  }

  await t.test('only somebody signed in can connect a browser, and only with a real subscription', async () => {
    assert.equal((await makeClient(app.base).post('/api/push/subscription', browser())).status, 401);
    assert.equal((await makeClient(app.base).get('/api/push/status')).status, 401);
    const { c: me } = await person();
    const good = browser();
    const wrong = [
      null,
      'https://fcm.googleapis.com/x',
      { ...good, endpoint: good.endpoint.replace('https:', 'http:') },
      { ...good, endpoint: 'https://attacker.example/collect' },
      { ...good, endpoint: 'https://fcm.googleapis.com.attacker.example/x' },
      { ...good, endpoint: 'https://user:pass@fcm.googleapis.com/x' },
      { ...good, endpoint: 'https://fcm.googleapis.com:8443/x' },
      { ...good, endpoint: 'https://127.0.0.1/x' },
      { ...good, endpoint: `https://fcm.googleapis.com/${'x'.repeat(1100)}` },
      { ...good, keys: { p256dh: good.keys.p256dh } },
      { ...good, keys: { p256dh: 'short', auth: good.keys.auth } },
      { ...good, keys: { p256dh: good.keys.p256dh, auth: 'not base64 !!' } },
      { endpoint: good.endpoint },
    ];
    for (const bad of wrong) assert.equal((await me.post('/api/push/subscription', bad)).status, 400, JSON.stringify(bad).slice(0, 80));
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM push_subscriptions')).c, 0);
    // Not on the list until a real subscription has shown it, and never more than one label deep.
    for (const host of ['wns2-par02p.notify.windows.com', 'a.b.push.apple.com', 'evil.push.services.mozilla.com.example']) {
      assert.equal((await me.post('/api/push/subscription', browser(host))).status, 400, host);
    }
    for (const host of ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com']) {
      assert.equal((await me.post('/api/push/subscription', browser(host))).status, 201, host);
    }
    assert.equal((await me.get('/api/push/status')).data.devices, 1, 'one browser, one subscription: the newer replaced the older');
  });

  await t.test('what is stored cannot be read from the database; the key that is public is given, the other never', async () => {
    const { c: me, id } = await person();
    const mine = browser();
    const res = await me.post('/api/push/subscription', mine);
    assert.deepEqual(res.data, { ok: true, thisDevice: true, devices: 1 });
    const row = await db.get('SELECT * FROM push_subscriptions WHERE user_id = ?', [id]);
    assert.ok(!JSON.stringify(row).includes(mine.endpoint) && !JSON.stringify(row).includes(mine.keys.auth));
    assert.match(row.endpoint, /^v1\./);
    assert.match(row.endpoint_hash, /^[0-9a-f]{64}$/);
    const status = (await me.get('/api/push/status')).data;
    assert.equal(status.publicKey, keys.publicKey);
    assert.ok(!JSON.stringify(status).includes(keys.privateKey));
  });

  await t.test('the test notification goes to this browser only and says nothing about the person', async () => {
    const { c: me, id } = await person();
    const mine = browser();
    await me.post('/api/push/subscription', mine);
    await me.post('/api/tasks', { title: 'Very private title', dueDate: '2099-01-01' });

    const res = await me.post('/api/push/test');
    assert.deepEqual(res.data, { ok: true, sent: 1, gone: 0, failed: 0 });
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].subscription, { endpoint: mine.endpoint, keys: mine.keys }, 'the sender gets back exactly what the browser gave');
    assert.deepEqual(JSON.parse(sent[0].payload), { k: 'test', u: '/#/settings', g: 'test' });
    assert.ok(Buffer.byteLength(sent[0].payload) < 200);
    assert.equal(sent[0].options.vapidDetails.publicKey, keys.publicKey);
    assert.ok((await db.get('SELECT last_ok_at FROM push_subscriptions WHERE user_id = ?', [id])).last_ok_at);

    const other = await person();
    assert.equal((await other.c.post('/api/push/test')).status, 409, 'nothing to send to: this browser is not connected');
    assert.equal(sent.length, 1);
  });

  await t.test('a message can only point inside the app', async () => {
    assert.deepEqual(JSON.parse(push.payloadOf({ kind: 'chat', path: '/#/family/3', tag: 'chat-9' })), { k: 'chat', u: '/#/family/3', g: 'chat-9' });
    for (const path of ['https://evil.example/', '//evil.example', '/api/auth/logout', '/#/x?y=<script>', 'javascript:alert(1)', 42]) {
      assert.equal(JSON.parse(push.payloadOf({ kind: 'chat', path })).u, '/', String(path));
    }
    assert.equal(JSON.parse(push.payloadOf({ kind: 'Buy milk, says Arta' })).k, 'update', 'no free text travels as a kind');
    for (const tag of ['Buy milk', 'chat-9-arta', 'x'.repeat(40), 'chat_9']) assert.equal(JSON.parse(push.payloadOf({ kind: 'chat', tag })).g, null, tag);
  });

  await t.test('a subscription the push service no longer knows is removed; another failure keeps it and is counted', async () => {
    const { c: me, id } = await person();
    await me.post('/api/push/subscription', browser());
    answer = () => ({ statusCode: 500 });
    assert.deepEqual((await me.post('/api/push/test')).data, { ok: false, sent: 0, gone: 0, failed: 1 });
    assert.equal((await db.get('SELECT failures FROM push_subscriptions WHERE user_id = ?', [id])).failures, 1);
    answer = () => ({ statusCode: 410 });
    assert.deepEqual((await me.post('/api/push/test')).data, { ok: false, sent: 0, gone: 1, failed: 0 });
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM push_subscriptions WHERE user_id = ?', [id])).c, 0);
    assert.equal((await me.get('/api/push/status')).data.thisDevice, false);
    answer = () => ({ statusCode: 404 });
    await me.post('/api/push/subscription', browser());
    assert.equal((await me.post('/api/push/test')).data.gone, 1);
  });

  await t.test('a browser belongs to whoever is signed in on it now; the one before stops receiving there', async () => {
    const first = await person();
    const second = await person();
    const shared = browser();
    await first.c.post('/api/push/subscription', shared);
    await second.c.post('/api/push/subscription', shared);
    assert.equal((await first.c.get('/api/push/status')).data.devices, 0);
    assert.equal((await second.c.get('/api/push/status')).data.thisDevice, true);
    assert.deepEqual(await push.sendToUser(first.id, { kind: 'chat' }), { sent: 0, gone: 0, failed: 0 });
    assert.equal((await push.sendToUser(second.id, { kind: 'chat' })).sent, 1);
  });

  await t.test('turning off, signing out and a change of password each end what they should', async () => {
    const me = await person();
    await me.c.post('/api/push/subscription', browser());
    assert.deepEqual((await me.c.del('/api/push/subscription')).data, { ok: true, thisDevice: false, devices: 0 });

    // Two devices of one person.
    const phone = makeClient(app.base);
    assert.equal((await phone.post('/api/auth/login', me.login)).status, 200);
    await me.c.post('/api/push/subscription', browser());
    await phone.post('/api/push/subscription', browser('web.push.apple.com'));
    assert.equal((await me.c.get('/api/push/status')).data.devices, 2);
    assert.equal((await push.sendToUser(me.id, { kind: 'reminder' })).sent, 2);

    await phone.post('/api/auth/logout');
    assert.equal((await me.c.get('/api/push/status')).data.devices, 1, 'signing out on the phone disconnects the phone');

    const tablet = makeClient(app.base);
    await tablet.post('/api/auth/login', me.login);
    await tablet.post('/api/push/subscription', browser());
    assert.equal((await me.c.post('/api/settings/password', { currentPassword: me.login.password, newPassword: 'another-pass-123' })).status, 200);
    const left = (await me.c.get('/api/push/status')).data;
    assert.deepEqual({ here: left.thisDevice, devices: left.devices }, { here: true, devices: 1 }, 'the device that changed the password stays; the others are signed out and disconnected');
  });

  await t.test('a session that ran out receives nothing, though its row is still there', async () => {
    const me = await person();
    await me.c.post('/api/push/subscription', browser());
    await db.run("UPDATE sessions SET expires_at = '2000-01-01 00:00:00' WHERE user_id = ?", [me.id]);
    assert.deepEqual(await push.sendToUser(me.id, { kind: 'reminder' }), { sent: 0, gone: 0, failed: 0 });
    assert.equal(sent.length, 0);
    // It is not counted as a device either, and the clock removes it with its session.
    const again = makeClient(app.base);
    await again.post('/api/auth/login', me.login);
    assert.equal((await again.get('/api/push/status')).data.devices, 0);
    const ended = await require('../src/lib/reminderWorker').housekeeping();
    assert.ok(ended >= 1);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM push_subscriptions WHERE user_id = ?', [me.id])).c, 0);
  });

  await t.test('rows stored under a key the server no longer has are dropped, not sent and not fatal', async () => {
    const me = await person();
    await me.c.post('/api/push/subscription', browser());
    const key = process.env.PUSH_STORE_KEY;
    process.env.PUSH_STORE_KEY = b64(32);
    try {
      assert.deepEqual(await push.sendToUser(me.id, { kind: 'reminder' }), { sent: 0, gone: 1, failed: 0 });
      assert.equal(sent.length, 0);
    } finally {
      process.env.PUSH_STORE_KEY = key;
    }
    assert.equal((await me.c.get('/api/push/status')).data.devices, 0);
    // Without that key the server does not pretend to be ready.
    process.env.PUSH_STORE_KEY = 'short';
    try {
      assert.equal((await me.c.get('/api/push/status')).data.configured, false);
      assert.equal((await me.c.post('/api/push/subscription', browser())).status, 503);
    } finally {
      process.env.PUSH_STORE_KEY = key;
    }
  });

  await t.test('no more than a handful of devices for one account: the oldest go', async () => {
    const me = await person();
    for (let i = 0; i < push.MAX_DEVICES + 2; i++) {
      const device = makeClient(app.base);
      await device.post('/api/auth/login', me.login);
      assert.equal((await device.post('/api/push/subscription', browser())).status, 201);
    }
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM push_subscriptions WHERE user_id = ?', [me.id])).c, push.MAX_DEVICES);
  });

  await t.test('a request that says it comes from another site is refused, on every route that changes something', async () => {
    const user = uniqueUser();
    await fetch(`${app.base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    const signup = await fetch(`${app.base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: user.email, password: user.password }) });
    const cookie = signup.headers.get('set-cookie').split(';')[0];
    const call = (method, url, headers, body) => fetch(app.base + url, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    const task = { title: 'From elsewhere' };
    assert.equal((await call('POST', '/api/tasks', { Origin: 'https://evil.example' }, task)).status, 403);
    assert.equal((await call('POST', '/api/tasks', { 'Sec-Fetch-Site': 'cross-site' }, task)).status, 403);
    assert.equal((await call('POST', '/api/tasks', { 'Sec-Fetch-Site': 'same-site' }, task)).status, 403, 'a sibling address is not this site');
    assert.equal((await call('POST', '/api/auth/logout', { Origin: 'https://evil.example' }, {})).status, 403);
    assert.equal((await call('PATCH', '/api/settings/preferences', { Origin: 'https://evil.example' }, { theme: 'dark' })).status, 403);
    assert.equal((await call('DELETE', '/api/tasks/1', { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await db.get("SELECT COUNT(*) AS c FROM tasks WHERE title = 'From elsewhere'")).c, 0);
    // Reading is not a change; this site's own pages and a client that is not a browser are let through.
    assert.equal((await call('GET', '/api/tasks', { Origin: 'https://evil.example' })).status, 200);
    assert.equal((await call('POST', '/api/tasks', { Origin: app.base, 'Sec-Fetch-Site': 'same-origin' }, task)).status, 201);
    assert.equal((await call('POST', '/api/tasks', {}, task)).status, 201);
    // Where the site's address is configured, the request's own Host is not believed.
    process.env.APP_BASE_URL = 'https://lifeadmin.example';
    try {
      assert.equal((await call('POST', '/api/tasks', { Origin: app.base }, task)).status, 403);
      assert.equal((await call('POST', '/api/tasks', { Origin: 'https://lifeadmin.example' }, task)).status, 201);
      process.env.ALLOWED_ORIGINS = `https://www.lifeadmin.example, ${app.base}`;
      assert.equal((await call('POST', '/api/tasks', { Origin: app.base }, task)).status, 201);
    } finally {
      process.env.APP_BASE_URL = '';
      process.env.ALLOWED_ORIGINS = '';
    }
    const send = (origin) => fetch(`${app.base}/api/push/subscription`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(browser()) });
    assert.equal((await send('https://evil.example')).status, 403);
    assert.equal((await send('null')).status, 403);
    assert.equal((await send(app.base)).status, 201);
    const del = await fetch(`${app.base}/api/push/subscription`, { method: 'DELETE', headers: { Cookie: cookie, Origin: 'https://evil.example' } });
    assert.equal(del.status, 403);
    const testPush = await fetch(`${app.base}/api/push/test`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: 'https://evil.example' }, body: '{}' });
    assert.equal(testPush.status, 403);
  });

  await t.test("the browser's time zone is taken once; it never replaces one the person has; the person can change it", async () => {
    const { c: me } = await person();
    const first = (await me.patch('/api/settings/reminders', { timezone: 'Europe/Berlin', onlyIfUnset: true })).data.reminders;
    assert.equal(first.timezone, 'Europe/Berlin');
    assert.equal((await me.get('/api/auth/me')).data.user.timezone, 'Europe/Berlin');
    // Another device, in another country, opens the app.
    const again = (await me.patch('/api/settings/reminders', { timezone: 'America/New_York', onlyIfUnset: true })).data.reminders;
    assert.equal(again.timezone, 'Europe/Berlin');
    // The person chooses.
    assert.equal((await me.patch('/api/settings/reminders', { timezone: 'Asia/Tokyo' })).data.reminders.timezone, 'Asia/Tokyo');
    assert.equal((await me.patch('/api/settings/reminders', { timezone: 'Europe/Berlin', onlyIfUnset: true })).data.reminders.timezone, 'Asia/Tokyo');
    const { c: other } = await person();
    assert.equal((await other.patch('/api/settings/reminders', { timezone: 'Mars/Olympus', onlyIfUnset: true })).status, 400);
  });

  await t.test('the page offers itself for the Home Screen and the worker is served from the root', async () => {
    const manifest = await (await fetch(`${app.base}/manifest.webmanifest`)).json();
    assert.equal(manifest.display, 'standalone');
    for (const icon of manifest.icons) {
      const res = await fetch(app.base + icon.src);
      assert.equal(res.status, 200, icon.src);
      const bytes = Buffer.from(await res.arrayBuffer());
      assert.deepEqual([...bytes.subarray(0, 4)], [137, 80, 78, 71]);
      assert.equal(bytes.readUInt32BE(16), Number(icon.sizes.split('x')[0]), 'the size the manifest says');
    }
    const sw = await fetch(`${app.base}/sw.js`);
    assert.equal(sw.status, 200);
    assert.match(sw.headers.get('content-type'), /javascript/);
    const text = await sw.text();
    assert.ok(!/caches\.|fetch'\s*,/.test(text), 'it keeps no copy of pages and answers no requests');
    assert.match(await (await fetch(`${app.base}/`)).text(), /rel="manifest"/);
  });
});
