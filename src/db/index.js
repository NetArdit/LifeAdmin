// SQLite connection using Node's built-in node:sqlite module (Node 22.5+).
// No native compilation required — works out of the box on Windows.
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Overridable so the test suite can point at a disposable database instead
// of the real one — unset (the normal `npm start` path) behaves exactly as
// before.
const DB_PATH = process.env.LIFEADMIN_DB_PATH || path.join(DATA_DIR, 'lifeadmin.db');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Lightweight forward-migration guard: `CREATE TABLE IF NOT EXISTS` only
// applies to brand-new tables, so a column added to schema.sql later would
// silently be missing on an existing database file. Add any such columns
// here so upgrading the app never requires deleting local data.
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
ensureColumn('decision_options', 'risks', 'TEXT');

// --- Family integrity hardening (Hardening 1: F-03, F-13) ----------------------
// Idempotent, non-destructive, and never fatal to start-up.
//  1. Legacy invite codes are exactly 8 characters (8 hex digits, or the old
//     "DEMO"+4 digits). Every such code is replaced once with a strong 12-character
//     code, in one transaction; the old code stops working. Codes of any other length
//     (the current format) are never touched, so a restart cannot rotate a family
//     again. Members, ownership and content are untouched. Only the count is logged.
//  2. A family whose owner demoted themself through the old role endpoint has no
//     member with role 'owner' although families.owner_id still names one. The
//     RECORDED owner (never anyone else) gets the role back if they are still a member.
//  3. A partial unique index keeps "at most one owner per family" true at the
//     database level ("at least one" cannot be expressed as a constraint; the routes
//     enforce it). If existing data already violated it, the index is skipped.
(function hardenFamilies() {
  try {
    const { generateInviteCode } = require('../lib/inviteCode');
    const legacy = db.prepare('SELECT id FROM families WHERE length(invite_code) = 8').all();
    if (legacy.length) {
      db.exec('BEGIN');
      try {
        for (const f of legacy) {
          let code;
          do {
            code = generateInviteCode();
          } while (db.prepare('SELECT 1 FROM families WHERE invite_code = ?').get(code));
          db.prepare('UPDATE families SET invite_code = ? WHERE id = ?').run(code, f.id);
        }
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      console.log(`[LifeAdmin] Replaced ${legacy.length} legacy 8-character invite code(s) with 12-character codes.`);
    }

    const repaired = db
      .prepare(
        `UPDATE family_members SET role = 'owner'
         WHERE role <> 'owner'
           AND user_id = (SELECT f.owner_id FROM families f WHERE f.id = family_members.family_id)
           AND NOT EXISTS (SELECT 1 FROM family_members o WHERE o.family_id = family_members.family_id AND o.role = 'owner')`
      )
      .run();
    if (repaired.changes) console.log(`[LifeAdmin] Restored the recorded owner role in ${repaired.changes} family(ies).`);

    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_family_one_owner ON family_members(family_id) WHERE role = 'owner'");
  } catch (err) {
    console.error('[LifeAdmin] Family integrity hardening skipped:', err.message);
  }
})();

// --- Small query helpers -------------------------------------------------
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { db, run, get, all, tx, DB_PATH };
