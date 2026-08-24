const db = require('../db');

function notifyUser(userId, { type, title, body = null, link = null }) {
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
