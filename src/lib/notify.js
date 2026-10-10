const db = require('../db');
const { safeJson } = require('./auth');

// Visual Redesign Batch 11: Settings' six per-type notification checkboxes
// (notif_prefs on `users`) were persisted and shown to the user but never
// read by this module — every notification was created regardless of what
// the recipient had toggled off, a verified real gap (the same class of
// finding as ai_enabled, see src/lib/ai.js). A type absent from
// notif_prefs (e.g. 'family', which every real call site below uses but
// which was never a toggle in Settings) is treated as enabled — the same
// "off only when explicitly false" default the frontend itself already
// uses (NotificationsSection.jsx: `checked={prefs[key] !== false}`) — so
// this can only ever suppress a notification the user explicitly turned
// off, never one they never had a chance to configure.
function isNotifTypeEnabled(userId, type) {
  const row = db.get('SELECT notif_prefs FROM users WHERE id = ?', [userId]);
  if (!row) return true;
  const prefs = safeJson(row.notif_prefs, {});
  return prefs[type] !== false;
}

function notifyUser(userId, { type, title, body = null, link = null }) {
  if (!isNotifTypeEnabled(userId, type)) return;
  db.run(
    `INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, body, link]
  );
}

function notifyFamily(familyId, excludeUserId, payload) {
  const members = db.all('SELECT user_id FROM family_members WHERE family_id = ? AND user_id IS NOT NULL', [familyId]);
  for (const m of members) {
    if (m.user_id === excludeUserId) continue;
    notifyUser(m.user_id, payload);
  }
}

module.exports = { notifyUser, notifyFamily };
