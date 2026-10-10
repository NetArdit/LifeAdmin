const db = require('../db');
const { ValidationError } = require('./validate');
const { generateInviteCode } = require('./inviteCode');

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

// A fresh invite code that no family currently uses.
function newUniqueInviteCode() {
  let code;
  do {
    code = generateInviteCode();
  } while (db.get('SELECT id FROM families WHERE invite_code = ?', [code]));
  return code;
}

// Replaces a family's invite code; the previous code stops working at once.
function rotateInviteCode(familyId) {
  const code = newUniqueInviteCode();
  db.run('UPDATE families SET invite_code = ? WHERE id = ?', [code, familyId]);
  return code;
}

// Privacy filter for activity rows shown on SHARED surfaces (family feed,
// dashboard family feed, Timeline's family branch; Hardening 1 / F-04).
// Task activity rows carry the link '#/tasks/<id>'; such a row may only be shown
// to the family while the task is family-visible. Anything else — private, or an
// unexpected visibility value — is hidden (fail closed). Evaluating this when the
// row is read also covers rows written before the write-time fix and tasks that
// were switched to private later. The caller's activity table alias must be "a".
const HIDE_NON_FAMILY_TASK_ACTIVITY = `NOT EXISTS (
  SELECT 1 FROM tasks pt
  WHERE a.link LIKE '#/tasks/%' AND pt.id = CAST(substr(a.link, 9) AS INTEGER) AND pt.visibility <> 'family'
)`;

// The family an activity/notification about a task may be attached to: only a
// family-visible task belongs to the family's shared surfaces.
function sharedFamilyIdForTask(task) {
  return task && task.visibility === 'family' && task.family_id ? task.family_id : null;
}

module.exports = {
  getUserFamilyIds,
  getMembership,
  requireMembership,
  requireRole,
  logActivity,
  newUniqueInviteCode,
  rotateInviteCode,
  HIDE_NON_FAMILY_TASK_ACTIVITY,
  sharedFamilyIdForTask,
};
