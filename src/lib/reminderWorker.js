// The worker that turns planned reminders that are due into notifications.
//
// It is run by a clock outside the application (a scheduled function, every 15 minutes), and two runs may
// overlap or one may die half-way. So:
//   - a run CLAIMS a bounded batch in one short transaction (FOR UPDATE SKIP LOCKED: an overlapping run takes
//     other rows, never the same ones) and marks each row with a token of its own and a lease;
//   - each claimed row is then handled in a transaction of its own that first locks the item it is about,
//     reads it again and asks the planner whether this very reminder is still wanted (the item exists, is
//     still open, is still due at that moment, and the person may still see it). What is no longer wanted is
//     cancelled, not sent;
//   - the row is finished only "if it is still mine" (same token, still claimed): a run whose lease ran out
//     and whose row was taken over by another run changes nothing and delivers nothing;
//   - a row whose run died is claimed again when its lease has passed, up to MAX_ATTEMPTS times.
//
// What "deliver" means is given by the caller. Today it writes the notification of the bell, in the same
// transaction as the row's completion, so a reminder appears there exactly once. Push comes on top later.
// Nothing here logs a title, a name or any other content: counts and error codes only.

const crypto = require('crypto');
const db = require('../db');
const reminders = require('./reminders');
const { notifyUser } = require('./notify');

const BATCH = 50;
const LEASE_SECONDS = 120;
const MAX_ATTEMPTS = 5;
// A reminder found this long after its moment (the clock was off for days) is no longer news.
const STALE_HOURS = 48;

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** Takes up to `limit` due rows for this run. */
async function claimDue({ now = Date.now(), limit = BATCH, leaseSeconds = LEASE_SECONDS } = {}) {
  const token = crypto.randomUUID();
  const nowIso = iso(now);
  return await db.tx(async () => {
    // Given up on: tried too often and its last lease is over.
    await db.run("UPDATE planned_reminders SET status = 'failed', claim_token = NULL, claimed_until = NULL WHERE status = 'claimed' AND claimed_until < ? AND attempts >= ?", [nowIso, MAX_ATTEMPTS]);
    const due = await db.all(
      `SELECT id FROM planned_reminders
       WHERE (status = 'pending' AND scheduled_at <= ?) OR (status = 'claimed' AND claimed_until < ?)
       ORDER BY scheduled_at ASC, id ASC LIMIT ? FOR UPDATE SKIP LOCKED`,
      [nowIso, nowIso, limit]
    );
    const rows = [];
    for (const { id } of due) {
      await db.run("UPDATE planned_reminders SET status = 'claimed', claim_token = ?, claimed_until = ?, attempts = attempts + 1 WHERE id = ?", [token, iso(now + leaseSeconds * 1000), id]);
      rows.push(await db.get('SELECT * FROM planned_reminders WHERE id = ?', [id]));
    }
    return { token, rows };
  });
}

// Finishes a row only while this run still holds it. Answers whether it did.
async function finish(row, token, status, error = null) {
  const stamp = status === 'sent' ? ", sent_at = datetime('now')" : status === 'cancelled' ? ", cancelled_at = datetime('now')" : '';
  const done = await db.run(
    `UPDATE planned_reminders SET status = ?, claim_token = NULL, claimed_until = NULL, last_error = ?${stamp} WHERE id = ? AND status = 'claimed' AND claim_token = ?`,
    [status, error, row.id, token]
  );
  return done.changes === 1;
}

/** What the bell says. Read from the item at the moment of sending, never stored with the plan. */
async function bellFor(row) {
  if (row.source_type === 'task') {
    const t = await db.get('SELECT title, due_date, start_time FROM tasks WHERE id = ?', [row.source_id]);
    return t && { type: 'task', title: 'Reminder: task due', body: t.title, link: `#/tasks/${row.source_id}` };
  }
  if (row.source_type === 'bill') {
    const b = await db.get('SELECT name, due_date FROM bills WHERE id = ?', [row.source_id]);
    return b && { type: 'bill', title: 'Reminder: bill due', body: `${b.name} · due ${b.due_date}`, link: '#/billsense' };
  }
  if (row.source_type === 'goal') {
    const g = await db.get('SELECT title, target_date FROM goals WHERE id = ?', [row.source_id]);
    return g && { type: 'goal', title: 'Reminder: goal date is near', body: `${g.title} · ${g.target_date}`, link: `#/goals/${row.source_id}` };
  }
  const m = await db.get('SELECT m.title, m.due_date, m.goal_id, g.title AS goal_title FROM goal_milestones m JOIN goals g ON g.id = m.goal_id WHERE m.id = ?', [row.source_id]);
  return m && { type: 'goal', title: 'Reminder: next step of a goal', body: `${m.title} · ${m.goal_title}`, link: `#/goals/${m.goal_id}` };
}

async function deliverToBell(row) {
  const bell = await bellFor(row);
  if (bell) await notifyUser(row.user_id, bell);
}

/**
 * One claimed row, from "is it still wanted" to its end. Answers 'sent', 'cancelled', 'retry', 'failed' or
 * 'lost' (another run holds the row now).
 */
async function handle(row, token, { now = Date.now(), deliver = deliverToBell } = {}) {
  try {
    return await db.tx(async () => {
      // The item first, then the row: the order every other writer takes them in.
      const wanted = await reminders.wantedFor(row.source_type, row.source_id, { lock: true });
      const mine = await db.get("SELECT id FROM planned_reminders WHERE id = ? AND status = 'claimed' AND claim_token = ? FOR UPDATE", [row.id, token]);
      if (!mine) return 'lost';
      const still = wanted.find((w) => w.userId === row.user_id && w.sourceType === row.source_type && w.occurrenceKey === row.occurrence_key && w.ruleKey === row.rule_key);
      if (!still) return (await finish(row, token, 'cancelled', 'not_wanted')) ? 'cancelled' : 'lost';
      if (Date.parse(row.scheduled_at) < now - STALE_HOURS * 3600000) return (await finish(row, token, 'cancelled', 'stale')) ? 'cancelled' : 'lost';
      if (!await finish(row, token, 'sent')) return 'lost';
      await deliver(row);
      return 'sent';
    });
  } catch (err) {
    // Everything of this row was rolled back, the delivery included. Give it back for the next run, or up.
    const code = String((err && (err.code || err.name)) || 'error').slice(0, 40);
    const last = row.attempts >= MAX_ATTEMPTS;
    const released = await db.run(
      `UPDATE planned_reminders SET status = ?, claim_token = NULL, claimed_until = NULL, last_error = ? WHERE id = ? AND status = 'claimed' AND claim_token = ?`,
      [last ? 'failed' : 'pending', code, row.id, token]
    );
    if (released.changes !== 1) return 'lost';
    return last ? 'failed' : 'retry';
  }
}

/** What the clock also tidies: sessions that ran out, and with them the devices that were bound to them. */
async function housekeeping() {
  return (await db.run("DELETE FROM sessions WHERE expires_at <= datetime('now')")).changes;
}

/** One run of the clock. Answers counts only. */
async function runDue(options = {}) {
  const started = Date.now();
  const { token, rows } = await claimDue(options);
  const counts = { claimed: rows.length, sent: 0, cancelled: 0, retry: 0, failed: 0, lost: 0, released: 0 };
  for (const row of rows) {
    // Leave before the host's own limit (30 seconds) rather than be cut. With the database on another
    // continent a reminder costs about a second, so a run may not get through its batch.
    if (Date.now() - started > (options.budgetMs ?? 20000)) break;
    counts[await handle(row, token, options)] += 1;
  }
  // What this run took and did not reach is given back untouched: it was not an attempt, and the next run
  // must not have to wait for a lease to run out.
  counts.released = (await db.run(
    "UPDATE planned_reminders SET status = 'pending', claim_token = NULL, claimed_until = NULL, attempts = GREATEST(attempts - 1, 0) WHERE status = 'claimed' AND claim_token = ?",
    [token]
  )).changes;
  counts.ms = Date.now() - started;
  return counts;
}

module.exports = { runDue, claimDue, handle, deliverToBell, housekeeping, BATCH, LEASE_SECONDS, MAX_ATTEMPTS, STALE_HOURS };
