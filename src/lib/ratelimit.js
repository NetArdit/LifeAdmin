// Limits on how often something may be tried (a sign-in, a reset, an invite code), counted in the DATABASE.
//
// They used to be counted in the memory of the one server process. On a host that runs the application as
// many short-lived copies (serverless functions) each copy counted for itself and forgot on every restart,
// so "8 failed sign-ins in 15 minutes" was in truth 8 per copy: password guessing went on almost unchecked.
// One row per limit and party now says how many tries are in the current window and when it ends, and every
// copy reads and writes the same row.
//
// Whom a row is about is stored as a keyed hash (HMAC), never as an address or an email: the table says
// "this unknown party tried 8 times", not who they are. Rows of ended windows are removed as counting goes.
// The windows are fixed, as before: the count starts at the first try and is forgotten when the window ends.
//
// How a caller uses it where guessing must be stopped: consume() FIRST, and refuse when it answers true; then
// look at what was tried; when it was right, reset() or refund(). Checking with isLimited() and counting only
// after a failure leaves a gap in which any number of tries made at the same instant all pass the check.

const crypto = require('crypto');
const db = require('../db');

// The key: RATE_LIMIT_SECRET, else another secret this server already holds and a copy of the database does
// not contain. The constant is for a developer's machine only, where there is nothing to protect.
const secret = () => process.env.RATE_LIMIT_SECRET || process.env.PUSH_STORE_KEY || process.env.DATABASE_URL || 'lifeadmin-rate-limits';
const hashOf = (name, key) => crypto.createHmac('sha256', secret()).update(`${name}|${key}`).digest('hex');

function createLimiter({ name, windowMs, max }) {
  if (!name) throw new Error('A limiter needs a name: it is what keeps its counts apart from the others.');
  return {
    /** True when `key` has already used up its allowance in the current window. */
    async isLimited(key) {
      const row = await db.get('SELECT hits FROM rate_limits WHERE bucket = ? AND key_hash = ? AND expires_at > ?', [name, hashOf(name, key), Date.now()]);
      return !!row && row.hits >= max;
    },
    /** Records one try. Returns true if this try is over the allowance. One statement: tries at the same moment are each counted. */
    async consume(key) {
      const now = Date.now();
      const row = await db.get(
        `INSERT INTO rate_limits (bucket, key_hash, hits, expires_at) VALUES (?, ?, 1, ?)
         ON CONFLICT (bucket, key_hash) DO UPDATE SET
           hits = CASE WHEN rate_limits.expires_at <= ? THEN 1 ELSE rate_limits.hits + 1 END,
           expires_at = CASE WHEN rate_limits.expires_at <= ? THEN excluded.expires_at ELSE rate_limits.expires_at END
         RETURNING hits`,
        [name, hashOf(name, key), now + windowMs, now, now]
      );
      // Now and then, what can no longer matter is swept away.
      if (Math.random() < 0.02) await db.run('DELETE FROM rate_limits WHERE expires_at <= ?', [now]);
      return row.hits > max;
    },
    /** Takes one try back: it turned out not to be a failure. */
    async refund(key) {
      await db.run('UPDATE rate_limits SET hits = hits - 1 WHERE bucket = ? AND key_hash = ? AND hits > 0', [name, hashOf(name, key)]);
    },
    async reset(key) {
      await db.run('DELETE FROM rate_limits WHERE bucket = ? AND key_hash = ?', [name, hashOf(name, key)]);
    },
    async resetAll() {
      await db.run('DELETE FROM rate_limits WHERE bucket = ?', [name]);
    },
    async retryAfterSeconds(key) {
      const row = await db.get('SELECT expires_at FROM rate_limits WHERE bucket = ? AND key_hash = ? AND expires_at > ?', [name, hashOf(name, key), Date.now()]);
      return row ? Math.max(1, Math.ceil((Number(row.expires_at) - Date.now()) / 1000)) : 1;
    },
  };
}

module.exports = { createLimiter };
