// Brings the data of the old SQLite file (data/lifeadmin.db, from before LifeAdmin moved to PostgreSQL) into
// the database the application uses now.
//
//   npm run db:import-sqlite                       data/lifeadmin.db into the database of .env
//   npm run db:import-sqlite -- path/to/file.db
//
// When the application moved to PostgreSQL the accounts and everything in them stayed behind in that file:
// the new database started empty, and people who had an account could no longer sign in. This is the step
// that was missing.
//
// It only reads the old file. It writes only into an EMPTY database (no account in it), everything or
// nothing. Passwords come along as they were (their hashes), so people sign in with what they had. Nobody is
// signed in afterwards: sessions are not brought over. Reminders are planned afresh from the items.
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');

const file = process.argv[2] || path.join(__dirname, '..', 'data', 'lifeadmin.db');
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
if (!fs.existsSync(file)) fail(`There is no file ${file}.`);

(async () => {
  const { DatabaseSync } = require('node:sqlite');
  const old = new DatabaseSync(file, { readOnly: true });
  const db = require('../src/db');
  const { tableNames, inDependencyOrder } = require('../src/lib/backup');
  const { replanUser } = require('../src/lib/reminders');
  const where = process.env.DATABASE_URL ? 'the PostgreSQL server in DATABASE_URL' : 'the built-in database';
  try {
    const known = await tableNames();
    const oldTables = old.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name);
    const skipped = oldTables.filter((t) => !known.includes(t));
    // Who was signed in then is of no use now.
    const tables = (await inDependencyOrder(known)).filter((t) => oldTables.includes(t) && t !== 'sessions');
    const columnsNow = await db.all('SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema()');
    const counts = {};
    await db.tx(async () => {
      await db.run(`LOCK TABLE ${known.join(', ')} IN ACCESS EXCLUSIVE MODE`);
      if ((await db.get('SELECT COUNT(*) AS c FROM users')).c > 0) throw new Error('This database already has accounts. The old data is imported into an empty database only, so that nothing is mixed or overwritten.');
      for (const table of tables) {
        const rows = old.prepare(`SELECT * FROM "${table}"`).all();
        counts[table] = rows.length;
        if (!rows.length) continue;
        // Only the columns both have: what this version added keeps its default, what it dropped is left behind.
        const now = columnsNow.filter((c) => c.table_name === table).map((c) => c.column_name);
        const columns = Object.keys(rows[0]).filter((c) => now.includes(c) && /^[a-z_][a-z0-9_]*$/.test(c));
        const list = columns.join(', ');
        for (let i = 0; i < rows.length; i += 500) {
          await db.run(`INSERT INTO ${table} (${list}) SELECT ${list} FROM json_populate_recordset(NULL::${table}, ?::json)`, [JSON.stringify(rows.slice(i, i + 500))]);
        }
        // New rows must continue after the highest id that came over.
        const id = await db.get("SELECT pg_get_serial_sequence(?, 'id') AS seq", [table]).catch(() => null);
        if (id && id.seq) await db.get(`SELECT setval(?::regclass, (SELECT max(id) FROM ${table}))`, [id.seq]);
      }
      // A choice of reminder stored before the choice had a name (see src/db/index.js).
      await db.run("UPDATE tasks SET reminder_mode = 'custom' WHERE reminder_mode = 'default' AND reminder_minutes_before IS NOT NULL");
    });
    // Outside the import's transaction: each person's reminders, derived from their items as they are now.
    const users = await db.all('SELECT id FROM users ORDER BY id');
    for (const u of users) await replanUser(u.id);
    const planned = (await db.get("SELECT COUNT(*) AS c FROM planned_reminders WHERE status = 'pending'")).c;

    console.log(`Imported ${file} into ${where}:`);
    for (const [table, n] of Object.entries(counts)) if (n) console.log(`  ${table.padEnd(24)} ${n}`);
    console.log(`Reminders planned from the items: ${planned}.`);
    if (skipped.length) console.log(`Not brought over (this version has no such table): ${skipped.join(', ')}.`);
    console.log('People sign in with the email and password they had. Nobody is signed in yet.');
  } finally {
    old.close();
    await db.close();
  }
})().catch((err) => fail(`Nothing was imported: ${err.message}`));
