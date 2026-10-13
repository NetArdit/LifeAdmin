const crypto = require('crypto');
const db = require('../db');
const { safeJson } = require('./auth');
const { afterCommit } = require('./afterCommit');
const push = require('./push');
const reminders = require('./reminders');
const { canAccessTask } = require('./taskAccess');

// One place decides how a person is told about something.
//
//   The bell: a row in `notifications`, the durable history inside the app. Written with the event.
//   The device: a push to every browser or phone of that person that has notifications on. Attempted at once,
//     after the event is stored, one push per event: a message in a circle is a notification of its own,
//     never held back to be bundled with the next one. What a push says is one of a few fixed sentences and
//     where to look; the words of the event stay inside the app (push.js).
//
// The bell row is also the record of the push that is owed. It is written as 'pending' in the same statement
// as the bell, so a push that was never attempted (the process stopped after the commit) or that failed for
// a passing reason is still known, and the clock (reminderWorker.retryPushes) tries it again. Whoever tries
// first takes the row for two minutes, so the attempt after the commit and the clock never both send it.
//
// What decides whether somebody is told:
//   - their own switches (users.notif_prefs): a kind that is switched off makes no bell row and no push;
//   - whether they are still in the circle at the moment of sending: somebody who left is not told;
//   - whether they can still open the task it is about, at the moment of sending ('no_access' if not);
//   - "mute this circle" (family_members.muted_until): the bell row stays, the push is not sent;
//   - quiet hours (users.reminder_prefs), only for a person who chose it (quietCircles: true; by default a
//     circle is told at once, at night too): what happens in a circle at night then fills the bell and does
//     not make a phone sound. It is not sent later either: a burst of old messages in the morning is noise. Dated reminders are different: they are planned for
//     the end of the quiet hours (reminders.js) and are never dropped.
//
// push_status on the bell row: NULL (this server sends no pushes), 'pending' (owed), 'sent', 'none' (no
// device has notifications on), 'failed' (given up after MAX_PUSH_ATTEMPTS), 'muted', 'quiet', 'left',
// 'no_access', 'expired' (still owed when it was no longer news). 'sent' means at least one of the person's
// devices took it.
//
// An attempt holds the row under a name of its own (push_claim) and only the holder writes the outcome: an
// attempt that outlived its two minutes and lost the row to the next one cannot overwrite what that one
// found. Every call to a push service is cut off after a few seconds (push.js), so an attempt does not
// outlive its hold in the first place. Every attempt counts, whether the push service refused or something
// here broke: after MAX_PUSH_ATTEMPTS the row is closed either way.
//
// What this does not promise: exactly once. If a push service accepts a push and the database then cannot
// be told, the next attempt sends it again; the tag (n-<id>) makes a device replace the first, not show two.
// And when one of a person's devices was reached and another failed, the row is 'sent': trying again would
// ring the device that already has it.

const MAX_PUSH_ATTEMPTS = 3;
// How long a push is still worth sending: what was said in a circle half an hour ago is no longer "now".
const CIRCLE_NEWS_MINUTES = 30;
const OTHER_NEWS_MINUTES = 360;

let clock = () => Date.now();
/** Tests say what time it is (quiet hours depend on it). Answers the previous clock. */
function setClock(fn) {
  const before = clock;
  clock = fn || (() => Date.now());
  return before;
}

// A type absent from notif_prefs (e.g. 'family', which was never a switch in Settings) is treated as
// enabled, the same "off only when explicitly false" default the Settings screen uses, so this can only
// suppress what a person explicitly turned off.
async function isNotifTypeEnabled(userId, type) {
  const row = await db.get('SELECT notif_prefs FROM users WHERE id = ?', [userId]);
  if (!row) return true;
  const prefs = safeJson(row.notif_prefs, {});
  return prefs[type] !== false;
}

// Which fixed sentence a device shows for each kind of notification.
const PUSH_KIND = { chat: 'chat', comment: 'comment', family: 'task', reminder: 'reminder' };

/** Why a push that is owed is not sent after all, or null when it is to be sent. */
async function reasonNotToSend(row) {
  // About a task: only to somebody who can open that task now. It may have been made private, given to
  // somebody else or deleted since the bell row was written.
  const about = /^#\/tasks\/(\d+)$/.exec(row.link || '');
  if (about) {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [Number(about[1])]);
    if (!await canAccessTask(row.user_id, task)) return 'no_access';
  }
  if (!row.family_id) return null;
  const member = await db.get(
    "SELECT (muted_until IS NOT NULL AND muted_until > datetime('now')) AS muted FROM family_members WHERE user_id = ? AND family_id = ?",
    [row.user_id, row.family_id]
  );
  if (!member) return 'left';
  if (member.muted) return 'muted';
  const user = await db.get('SELECT timezone, reminder_prefs FROM users WHERE id = ?', [row.user_id]);
  const prefs = reminders.prefsOf(user);
  if (prefs.quietCircles && reminders.inQuietHours(clock(), prefs, reminders.zoneOf(user))) return 'quiet';
  return null;
}

/**
 * Sends the push a bell row owes, if nobody else is doing so. Answers what became of it: one of the
 * push_status values, 'retry' (failed, will be tried again) or null (not owed, or somebody else has it).
 */
async function deliverPush(id) {
  const claim = crypto.randomUUID();
  const row = await db.get(
    `UPDATE notifications SET push_attempts = push_attempts + 1, push_retry_at = datetime('now', '+2 minutes'), push_claim = ?
     WHERE id = ? AND push_status = 'pending' AND (push_retry_at IS NULL OR push_retry_at <= datetime('now'))
     RETURNING id, user_id, type, link, family_id, push_kind, push_attempts`,
    [claim, id]
  );
  if (!row) return null;
  const close = (status) => db.run("UPDATE notifications SET push_status = ?, push_retry_at = NULL, push_claim = NULL WHERE id = ? AND push_status = 'pending' AND push_claim = ?", [status, row.id, claim]);
  try {
    return await attempt(row, close);
  } catch (err) {
    // Something here broke (the database, most likely), not the push service. It is an attempt like any
    // other: counted, and after the last one the row is closed, so nothing is tried for ever.
    console.error('[LifeAdmin] a push that was owed could not be tried:', (err && (err.code || err.name)) || 'error');
    if (row.push_attempts < MAX_PUSH_ATTEMPTS) return 'retry';
    await close('failed').catch(() => {});
    return 'failed';
  }
}

async function attempt(row, close) {
  let status = await reasonNotToSend(row);
  if (!status) {
    const counts = await push.sendToUser(
      row.user_id,
      { kind: row.push_kind || PUSH_KIND[row.type] || 'update', path: row.link ? `/${row.link}` : '/', tag: `n-${row.id}` },
      { urgency: row.type === 'chat' || row.type === 'comment' ? 'high' : 'normal' }
    );
    if (counts.sent) status = 'sent';
    else if (!counts.failed) status = 'none';
    else if (row.push_attempts >= MAX_PUSH_ATTEMPTS) status = 'failed';
    // Otherwise it stays owed, and free to be taken again when the two minutes are over.
    else return 'retry';
  }
  // Null when another attempt holds the row by now: what became of it is that attempt's to say.
  return (await close(status)).changes === 1 ? status : null;
}

/**
 * Tells one person. `familyId` says the event belongs to a circle (so that a muted circle and the night stay
 * quiet); `pushKind` overrides the sentence a device shows (the reminder worker says 'reminder').
 */
async function notifyUser(userId, { type, title, body = null, link = null, familyId = null, pushKind = null }) {
  if (!await isNotifTypeEnabled(userId, type)) return;
  const owed = push.config().configured ? 'pending' : null;
  const row = await db.run('INSERT INTO notifications (user_id, type, title, body, link, family_id, push_kind, push_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
    userId,
    type,
    title,
    body,
    link,
    familyId,
    pushKind,
    owed,
  ]);
  // The device is told after the event is stored for good, and outside its transaction. If this never
  // runs or fails, the row still says 'pending' and the clock takes it up.
  if (owed) await afterCommit(() => deliverPush(row.lastInsertRowid));
}

/** Tells every other member of a circle, each for themselves: one bell row and one push per person. */
async function notifyFamily(familyId, excludeUserId, payload) {
  const members = await db.all('SELECT user_id FROM family_members WHERE family_id = ? AND user_id IS NOT NULL', [familyId]);
  for (const m of members) {
    if (m.user_id === excludeUserId) continue;
    await notifyUser(m.user_id, { ...payload, familyId });
  }
}

/**
 * The clock's part: pushes that are still owed. What is no longer news is closed unsent; the rest is tried.
 * Answers counts only.
 */
async function retryPushes({ limit = 25 } = {}) {
  const counts = { tried: 0, sent: 0, retry: 0, closed: 0, expired: 0 };
  if (!push.config().configured) return counts;
  counts.expired = (await db.run(
    `UPDATE notifications SET push_status = 'expired', push_retry_at = NULL, push_claim = NULL
     WHERE push_status = 'pending' AND (push_retry_at IS NULL OR push_retry_at <= datetime('now')) AND created_at < (CASE WHEN family_id IS NULL THEN datetime('now', '-${OTHER_NEWS_MINUTES} minutes') ELSE datetime('now', '-${CIRCLE_NEWS_MINUTES} minutes') END)`
  )).changes;
  const owed = await db.all("SELECT id FROM notifications WHERE push_status = 'pending' AND (push_retry_at IS NULL OR push_retry_at <= datetime('now')) ORDER BY id LIMIT ?", [limit]);
  for (const { id } of owed) {
    let outcome;
    try {
      outcome = await deliverPush(id);
    } catch {
      // Not even the taking of the row worked: the database is not answering. The next run goes on.
      break;
    }
    if (!outcome) continue;
    counts.tried += 1;
    if (outcome === 'sent') counts.sent += 1;
    else if (outcome === 'retry') counts.retry += 1;
    else counts.closed += 1;
  }
  return counts;
}

module.exports = { notifyUser, notifyFamily, deliverPush, retryPushes, setClock, MAX_PUSH_ATTEMPTS };
