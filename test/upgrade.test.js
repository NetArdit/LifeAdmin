// A database that ALREADY EXISTS must come through a new version: the schema as it is published today
// (test/fixtures/schema-published-f657317.sql, the version the hosted site runs), with people and their
// data in it, and then this version's code started on top of it.
//
// Every other test starts from an empty database, where the newest schema is simply created. That hid a
// fault for a whole series of changes: schema.sql named a column that existing tables only get afterwards,
// so the application could not open any database that was not brand new, and every request, sign-in first,
// answered "something went wrong". This file is the check that was missing.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('an existing database comes through the upgrade with its people and their data', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-upgrade-'));
  const dbPath = path.join(dir, 'db');
  const { translateSchema } = require('../src/db');

  // 1. The database as the published version made it, with an account, a circle, a task and a notification.
  const { PGlite } = await import('@electric-sql/pglite');
  const bcrypt = require('bcryptjs');
  const old = new PGlite(dbPath);
  await old.waitReady;
  await old.exec(translateSchema(fs.readFileSync(path.join(__dirname, 'fixtures', 'schema-published-f657317.sql'), 'utf8')));
  const hash = await bcrypt.hash('fjalekalimi-im', 10);
  await old.query("INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES ('Arta', 'Krasniqi', 'arta@example.test', '+38344111222', $1)", [hash]);
  await old.exec(`
    INSERT INTO families (name, owner_id, invite_code) VALUES ('Shtëpia', 1, 'ABCDEFGHJKLM');
    INSERT INTO family_members (family_id, user_id, role) VALUES (1, 1, 'owner');
    INSERT INTO tasks (owner_id, title, due_date) VALUES (1, 'Paguaj qiranë', '2031-01-15');
    INSERT INTO bills (owner_id, name, amount, due_date) VALUES (1, 'Interneti', 19.9, '2031-01-20');
    INSERT INTO notifications (user_id, type, title) VALUES (1, 'task', 'E vjetër');
  `);
  const before = (await old.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'")).rows.map((r) => r.column_name);
  assert.ok(!before.includes('push_status'), 'the fixture really is the older shape');
  await old.close();

  // 2. This version is started on that database.
  process.env.LIFEADMIN_DB_PATH = dbPath;
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = '';
  if (process.env.GROQ_API_KEY === undefined) process.env.GROQ_API_KEY = '';
  if (process.env.ANTHROPIC_API_KEY === undefined) process.env.ANTHROPIC_API_KEY = '';
  for (const key of Object.keys(require.cache)) if (key.includes(`${path.sep}src${path.sep}`) || key.endsWith(`${path.sep}server.js`)) delete require.cache[key];
  const app = require('../server');
  const db = require('../src/db');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await db.close().catch(() => {});
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const { makeClient } = require('./helpers');
  const c = makeClient(base);

  await t.test('the person who had an account signs in with the password they had', async () => {
    const wrong = await c.post('/api/auth/login', { identifier: 'arta@example.test', password: 'tjetër' });
    assert.equal(wrong.status, 400, 'a wrong password is a wrong password, not a server error');
    const res = await c.post('/api/auth/login', { identifier: 'arta@example.test', password: 'fjalekalimi-im' });
    assert.equal(res.status, 200);
    assert.equal(res.data.user.email, 'arta@example.test');
  });

  await t.test('what they had is still there, and every screen answers', async () => {
    assert.deepEqual((await c.get('/api/tasks')).data.tasks.map((x) => x.title), ['Paguaj qiranë']);
    assert.deepEqual((await c.get('/api/bills')).data.bills.map((x) => x.name), ['Interneti']);
    for (const url of ['/api/auth/me', '/api/dashboard', '/api/family', '/api/notifications', '/api/goals', '/api/documents', '/api/settings/reminders', '/api/push/status', '/api/timeline']) {
      const res = await c.get(url);
      assert.ok(res.status < 400, `${url} answered ${res.status}`);
    }
  });

  await t.test('what this version added works on the old data: a reminder is planned, a document is kept', async () => {
    assert.equal((await db.get("SELECT COUNT(*) AS c FROM notifications WHERE title = 'E vjetër'")).c, 1);
    assert.equal((await c.post('/api/tasks', { title: 'E re', dueDate: '2031-02-01' })).status, 201);
    assert.ok((await db.get("SELECT COUNT(*) AS c FROM planned_reminders WHERE status = 'pending'")).c >= 1);
    assert.equal((await c.post('/api/documents', { title: 'Pasaporta', kind: 'passport', expiresOn: '2031-06-01' })).status, 201);
    assert.equal((await c.post('/api/chat/1/messages', { body: 'Ende këtu' })).status, 201);
  });

  await t.test('starting again on the upgraded database changes nothing and fails nothing', async () => {
    await db.close();
    for (const key of Object.keys(require.cache)) if (key.includes(`${path.sep}src${path.sep}db${path.sep}`)) delete require.cache[key];
    const again = require('../src/db');
    await again.ready();
    assert.equal((await again.get('SELECT COUNT(*) AS c FROM users')).c, 1);
    assert.equal((await again.get('SELECT COUNT(*) AS c FROM tasks')).c, 2);
    await again.close();
  });
});
