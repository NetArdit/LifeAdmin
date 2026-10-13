const db = require('../db');
const { safeJson } = require('./auth');
const { afterCommit } = require('./afterCommit');
const push = require('./push');

// One place decides how a person is told about something.
//
//   The bell: a row in `notifications`, the durable history inside the app. Written with the event.
//   The device: a push to every browser or phone of that person that has notifications on. Attempted at once,
//     after the event is stored, one push per event: a message in a circle is a notification of its own,
//     never held back to be bundled with the next one. What a push says is one of a few fixed sentences and
//     where to look; the words of the event stay inside the app (push.js).
//
// What decides whether somebody is told:
//   - their own switches (users.notif_prefs): a kind that is switched off makes no bell row and no push;
//   - "mute this circle" (family_members.muted_until): the bell row is still written, the push is not sent.
// The outcome of the push is kept on the bell row (push_status), so that it can be seen afterwards whether a
// device was reached: 'sent', 'none' (no device has notifications on), 'failed', 'muted'.

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

async function isMuted(userId, familyId) {
  if (!familyId) return false;
  const row = await db.get("SELECT 1 AS x FROM family_members WHERE user_id = ? AND family_id = ? AND muted_until IS NOT NULL AND muted_until > datetime('now')", [userId, familyId]);
  return !!row;
}

/**
 * Tells one person. `familyId` says the event belongs to a circle (so that a muted circle stays quiet);
 * `pushKind` overrides the sentence a device shows (the reminder worker says 'reminder').
 */
async function notifyUser(userId, { type, title, body = null, link = null, familyId = null, pushKind = null }) {
  if (!await isNotifTypeEnabled(userId, type)) return;
  const row = await db.run('INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)', [userId, type, title, body, link]);
  const id = row.lastInsertRowid;
  // The device is told after the event is stored for good, and outside its transaction.
  await afterCommit(async () => {
    let status;
    if (!push.config().configured) status = null;
    else if (await isMuted(userId, familyId)) status = 'muted';
    else {
      const counts = await push.sendToUser(userId, { kind: pushKind || PUSH_KIND[type] || 'update', path: link ? `/${link}` : '/', tag: `n-${id}` }, { urgency: type === 'chat' || type === 'comment' ? 'high' : 'normal' });
      status = counts.sent ? 'sent' : counts.failed ? 'failed' : 'none';
    }
    if (status) await db.run('UPDATE notifications SET push_status = ? WHERE id = ?', [status, id]);
  });
}

/** Tells every other member of a circle, each for themselves: one bell row and one push per person. */
async function notifyFamily(familyId, excludeUserId, payload) {
  const members = await db.all('SELECT user_id FROM family_members WHERE family_id = ? AND user_id IS NOT NULL', [familyId]);
  for (const m of members) {
    if (m.user_id === excludeUserId) continue;
    await notifyUser(m.user_id, { ...payload, familyId });
  }
}

module.exports = { notifyUser, notifyFamily };
