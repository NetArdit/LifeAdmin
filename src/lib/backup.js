// A copy of everything people entered, as one JSON file, and the way back from it.
//
//   npm run db:backup -- backups/2026-10-13.json     write every record to a file (never over an existing one)
//   npm run db:restore -- backups/2026-10-13.json    put a file into an EMPTY database
//
// The file holds people's data in the clear (tasks, bills, messages, email addresses, password hashes):
// keep it where the database's own secrets are kept, and nowhere public.
//
// Left out on purpose, because they are of no use in another place or time: who is signed in right now
// (sessions), the devices bound to those sessions (push_subscriptions), one-time codes and reset links, and
// the counters of the limits. After a restore everybody signs in again and turns notifications on again.

const db = require('../db');

const NOT_BACKED_UP = ['sessions', 'push_subscriptions', 'otp_codes', 'password_reset_tokens', 'rate_limits'];
const FORMAT = 1;

async function tableNames() {
  const rows = await db.all("SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_type = 'BASE TABLE' ORDER BY table_name");
  return rows.map((r) => r.table_name).filter((t) => /^[a-z_][a-z0-9_]*$/.test(t));
}

/** Tables with the ones others point to first, so that a restore never inserts a row before what it refers to. */
async function inDependencyOrder(tables) {
  const links = await db.all(
    `SELECT child.relname AS child, parent.relname AS parent
       FROM pg_constraint c JOIN pg_class child ON child.oid = c.conrelid JOIN pg_class parent ON parent.oid = c.confrelid
       JOIN pg_namespace n ON n.oid = child.relnamespace
      WHERE c.contype = 'f' AND n.nspname = current_schema()`
  );
  const waiting = new Map(tables.map((t) => [t, new Set(links.filter((l) => l.child === t && l.parent !== t && tables.includes(l.parent)).map((l) => l.parent))]));
  const out = [];
  while (waiting.size) {
    const ready = [...waiting.keys()].filter((t) => [...waiting.get(t)].every((p) => out.includes(p))).sort();
    if (!ready.length) throw new Error('The tables refer to each other in a circle: no order to restore them in.');
    for (const t of ready) {
      out.push(t);
      waiting.delete(t);
    }
  }
  return out;
}

async function exportBackup(now = new Date()) {
  const tables = (await tableNames()).filter((t) => !NOT_BACKED_UP.includes(t));
  const backup = { format: FORMAT, app: 'lifeadmin', takenAt: now.toISOString(), tables: {} };
  // One transaction: the file is the database at one moment, not a mix of several.
  await db.tx(async () => {
    for (const table of tables) backup.tables[table] = await db.all(`SELECT * FROM ${table} ORDER BY 1`);
  });
  return backup;
}

function checkBackup(backup) {
  if (!backup || backup.app !== 'lifeadmin' || backup.format !== FORMAT || typeof backup.tables !== 'object' || backup.tables === null) {
    throw new Error('This file is not a LifeAdmin backup of a format this version reads.');
  }
  for (const [table, rows] of Object.entries(backup.tables)) {
    if (!/^[a-z_][a-z0-9_]*$/.test(table) || !Array.isArray(rows)) throw new Error(`The backup's part "${table}" is not a list of rows.`);
  }
  return backup;
}

/** Puts a backup into an empty database, whole or not at all. Answers how many rows went into each table. */
async function restoreBackup(input) {
  const backup = checkBackup(input);
  const known = await tableNames();
  const unknown = Object.keys(backup.tables).filter((t) => !known.includes(t));
  if (unknown.length) throw new Error(`The backup has tables this database does not have (${unknown.join(', ')}): it was made by another version.`);
  const order = (await inDependencyOrder(known)).filter((t) => backup.tables[t]);
  const counts = {};
  await db.tx(async () => {
    for (const table of known.filter((t) => !NOT_BACKED_UP.includes(t))) {
      if ((await db.get(`SELECT 1 AS x FROM ${table} LIMIT 1`))) throw new Error(`This database is not empty (table "${table}" has rows). A backup is restored into an empty database only.`);
    }
    for (const table of order) {
      const rows = backup.tables[table];
      for (let i = 0; i < rows.length; i += 500) {
        await db.run(`INSERT INTO ${table} SELECT * FROM json_populate_recordset(NULL::${table}, ?::json)`, [JSON.stringify(rows.slice(i, i + 500))]);
      }
      counts[table] = rows.length;
      // New rows must continue after the highest id that came back.
      const id = await db.get("SELECT pg_get_serial_sequence(?, 'id') AS seq", [table]).catch(() => null);
      if (id && id.seq && rows.length) await db.get(`SELECT setval('${id.seq}', (SELECT max(id) FROM ${table}))`);
    }
  });
  return counts;
}

module.exports = { exportBackup, restoreBackup, checkBackup, NOT_BACKED_UP };
