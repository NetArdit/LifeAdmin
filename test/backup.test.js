// A backup holds what people entered and gives it back the same; it leaves out what is of no use elsewhere
// (who is signed in, devices, one-time codes); and it goes only into an empty database.

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startApp, makeClient, signUp } = require('./helpers');

const ahead = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

test('backup and restore', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const { exportBackup, restoreBackup, checkBackup, NOT_BACKED_UP } = require('../src/lib/backup');

  const c = makeClient(app.base);
  const { res, payload } = await signUp(c);
  const other = makeClient(app.base);
  await signUp(other);
  const family = (await c.post('/api/family', { name: 'Shtëpia' })).data.family;
  await other.post('/api/family/join', { code: family.inviteCode });
  const task = (await c.post('/api/tasks', { title: 'Paguaj qiranë', dueDate: ahead(9), familyId: family.id, visibility: 'family' })).data.task;
  await other.post(`/api/tasks/${task.id}/comments`, { body: 'E pagova unë.' });
  await c.post('/api/bills', { name: 'Interneti', amount: 19.9, dueDate: ahead(20) });
  await c.post(`/api/chat/${family.id}/messages`, { body: 'Faleminderit!' });

  let backup;
  await t.test('holds every table of what people entered, and none of what is left out', async () => {
    backup = JSON.parse(JSON.stringify(await exportBackup()));
    assert.equal(backup.app, 'lifeadmin');
    for (const table of ['users', 'families', 'family_members', 'tasks', 'task_comments', 'bills', 'messages', 'notifications', 'planned_reminders']) {
      assert.ok(Array.isArray(backup.tables[table]) && backup.tables[table].length > 0, table);
    }
    for (const table of NOT_BACKED_UP) assert.equal(backup.tables[table], undefined, table);
    assert.equal(backup.tables.users.length, 2);
    assert.equal(backup.tables.users[0].email, payload.email.toLowerCase());
    // The session that made all this is not in it.
    assert.ok(!JSON.stringify(backup).includes('"expires_at"') || !backup.tables.sessions);
  });

  await t.test('is refused by a database that already has data, and by anything that is not a backup', async () => {
    await assert.rejects(restoreBackup(backup), /not empty/);
    for (const bad of [null, {}, { ...backup, app: 'other' }, { ...backup, format: 99 }, { ...backup, shape: undefined }, { ...backup, tables: { 'users; DROP TABLE users': [] } }]) {
      assert.throws(() => checkBackup(bad));
    }
    assert.equal(checkBackup(backup), backup);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM users')).c, 2);
  });

  await t.test('goes back into an empty database the same, and the application works on it', async () => {
    // A second, empty database in a process of its own, as a real restore would be.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-restore-'));
    const file = path.join(dir, 'backup.json');
    fs.writeFileSync(file, JSON.stringify(backup));
    const env = { ...process.env, LIFEADMIN_DB_PATH: path.join(dir, 'db'), NODE_ENV: 'test', DATABASE_URL: '' };
    const root = path.join(__dirname, '..');
    const out = execFileSync(process.execPath, ['scripts/backup.cjs', 'restore', file], { cwd: root, env, encoding: 'utf8' });
    assert.match(out, /Restored/);
    assert.match(out, /users\s+2/);

    const check = `
      const db = require('./src/db');
      (async () => {
        const one = async (sql) => (await db.get(sql));
        const out = {
          users: (await one('SELECT COUNT(*) AS c FROM users')).c,
          task: (await one("SELECT title, family_id FROM tasks WHERE title = 'Paguaj qiranë'")),
          comment: (await one('SELECT body FROM task_comments')).body,
          bill: (await one("SELECT amount FROM bills WHERE name = 'Interneti'")).amount,
          message: (await one('SELECT body FROM messages')).body,
          sessions: (await one('SELECT COUNT(*) AS c FROM sessions')).c,
          planned: (await one("SELECT COUNT(*) AS c FROM planned_reminders WHERE status = 'pending'")).c,
        };
        // New rows continue after the ones that came back.
        const made = await db.run("INSERT INTO tasks (owner_id, title) VALUES ((SELECT min(id) FROM users), 'Pas kthimit')");
        out.nextId = made.lastInsertRowid;
        out.maxBefore = (await one("SELECT max(id) AS m FROM tasks WHERE title <> 'Pas kthimit'")).m;
        console.log(JSON.stringify(out));
        await db.close();
      })().catch((e) => { console.log(JSON.stringify({ error: e.message })); });`;
    const after = JSON.parse(execFileSync(process.execPath, ['-e', check], { cwd: root, env, encoding: 'utf8' }).trim().split('\n').pop());
    assert.equal(after.error, undefined);
    assert.equal(after.users, 2);
    assert.equal(after.task.title, 'Paguaj qiranë');
    assert.equal(after.comment, 'E pagova unë.');
    assert.equal(after.bill, 19.9);
    assert.equal(after.message, 'Faleminderit!');
    assert.equal(after.sessions, 0, 'nobody is signed in after a restore');
    assert.ok(after.planned >= 1, 'the planned reminders came back');
    assert.ok(after.nextId > after.maxBefore);

    // A backup of another shape (a table missing, a column missing: an older version's) is refused whole,
    // by name, before anything is written.
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-restore-old-'));
    const emptyEnv = { ...env, LIFEADMIN_DB_PATH: path.join(emptyDir, 'db') };
    const older = JSON.parse(JSON.stringify(backup));
    delete older.tables.bills;
    delete older.shape.bills;
    older.shape.tasks = older.shape.tasks.filter((c) => c !== 'title');
    const olderFile = path.join(emptyDir, 'older.json');
    fs.writeFileSync(olderFile, JSON.stringify(older));
    assert.throws(() => execFileSync(process.execPath, ['scripts/backup.cjs', 'restore', olderFile], { cwd: root, env: emptyEnv, encoding: 'utf8', stdio: 'pipe' }), /another version[\s\S]*bills, tasks/);
    fs.rmSync(emptyDir, { recursive: true, force: true });

    // A second restore into the same, now filled, database is refused.
    assert.throws(() => execFileSync(process.execPath, ['scripts/backup.cjs', 'restore', file], { cwd: root, env, encoding: 'utf8', stdio: 'pipe' }), /not empty/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await t.test('the command never writes over an existing file', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-backup-'));
    const file = path.join(dir, 'kopja.json');
    fs.writeFileSync(file, 'e vjetër');
    const env = { ...process.env, LIFEADMIN_DB_PATH: path.join(dir, 'db'), NODE_ENV: 'test', DATABASE_URL: '' };
    assert.throws(() => execFileSync(process.execPath, ['scripts/backup.cjs', 'backup', file], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8', stdio: 'pipe' }), /already exists/);
    assert.equal(fs.readFileSync(file, 'utf8'), 'e vjetër');

    // The schema command does nothing when it was not told which database is meant.
    const root = path.join(__dirname, '..');
    assert.throws(() => execFileSync(process.execPath, ['scripts/migrate.cjs'], { cwd: root, env, encoding: 'utf8', stdio: 'pipe' }), /DATABASE_URL is not set/);
    assert.match(execFileSync(process.execPath, ['scripts/migrate.cjs', '--local'], { cwd: root, env, encoding: 'utf8' }), /Schema applied to the built-in database: \d+ tables/);
    fs.rmSync(dir, { recursive: true, force: true });
    assert.ok(res.data.user.id);
  });
});
