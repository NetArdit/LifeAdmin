const db = require('../db');
const { ValidationError } = require('./validate');

function getUserFamilyIds(userId) {
  return db.all('SELECT family_id FROM family_members WHERE user_id = ?', [userId]).map((r) => r.family_id);
}

function getMembership(userId, familyId) {
  return db.get('SELECT * FROM family_members WHERE user_id = ? AND family_id = ?', [userId, familyId]);
}

function requireMembership(userId, familyId) {
  const m = getMembership(userId, familyId);
  if (!m) {
    const err = new ValidationError('You are not a member of this family.');
    err.status = 403;
    throw err;
  }
  return m;
}

function requireRole(userId, familyId, roles) {
  const m = requireMembership(userId, familyId);
  if (!roles.includes(m.role)) {
    const err = new ValidationError('You do not have permission to do this.');
    err.status = 403;
    throw err;
  }
  return m;
}

function logActivity({ userId = null, familyId = null, type, summary, link = null }) {
  db.run(
    `INSERT INTO activity_log (user_id, family_id, type, summary, link) VALUES (?, ?, ?, ?, ?)`,
    [userId, familyId, type, summary, link]
  );
}

module.exports = { getUserFamilyIds, getMembership, requireMembership, requireRole, logActivity };
