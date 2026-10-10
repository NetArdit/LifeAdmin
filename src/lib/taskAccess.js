// Canonical task-access rule (Hardening 1.5).
//
// One question, answered in one place:
//
//     "Can user X CURRENTLY access task Y?"
//
// This is CURRENT authorization — who may open, search, edit, complete, comment
// on or list a task right now — never "who ever could". It deliberately knows
// nothing about notifications, activity feeds or the UI; those apply their own
// policy on top of this answer (see linkedTaskFilter.js).
//
// The rule
// --------
//   A task is FAMILY-SCOPED when visibility = 'family' AND family_id IS NOT NULL.
//
//   * Family-scoped task  -> accessible to every CURRENT member of its family,
//     and to nobody else. Owning it, or being assigned to it, is NOT enough: what
//     a person shared with a family stays with the family when they leave or are
//     removed, and they lose access until (unless) they rejoin.
//   * Any other task (visibility 'private', any unexpected value, or 'family'
//     without a family — all treated as private, i.e. fail closed):
//       - its OWNER always has access (it is their own private content);
//       - its ASSIGNEE has access only while they are still a member of the
//         task's family (an assignment always lives inside a family).
//   * Nobody else. Other families' members and anonymous users never qualify.
//
// The SQL form is NULL-safe: the whole condition is wrapped in COALESCE(…, 0), so
// NULL columns (no assignee, no family) can never turn "NOT accessible" into NULL.
// A NULL-unsafe version of this rule kept 34–44 rows per run that should have
// been hidden during Gate A prototyping — hence the wrapper and its tests.
const db = require('../db');

const VISIBILITIES = ['private', 'family'];

function isFamilyScoped(task) {
  return !!task && task.visibility === 'family' && task.family_id != null;
}

function isCurrentMember(userId, familyId) {
  if (userId == null || familyId == null) return false;
  return !!db.get('SELECT 1 AS x FROM family_members WHERE user_id = ? AND family_id = ?', [userId, familyId]);
}

// JS form (single task row, columns as in the `tasks` table).
function canAccessTask(userId, task) {
  if (!task || userId == null) return false;
  if (isFamilyScoped(task)) return isCurrentMember(userId, task.family_id);
  if (task.owner_id === userId) return true;
  if (task.assigned_to != null && task.assigned_to === userId) {
    return task.family_id == null || isCurrentMember(userId, task.family_id);
  }
  return false;
}

// SQL form: a fragment that evaluates to 1 or 0 (never NULL) for the task row
// aliased `alias`. `userId` must be an integer; it is inlined (after validation)
// so the fragment can be dropped into any query without parameter bookkeeping.
function taskAccessSql(alias, userId) {
  const u = Number(userId);
  if (!Number.isInteger(u)) throw new TypeError('taskAccessSql needs an integer user id');
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(alias)) throw new TypeError('bad alias');
  const member = `EXISTS (SELECT 1 FROM family_members fm WHERE fm.user_id = ${u} AND fm.family_id = ${alias}.family_id)`;
  return `COALESCE((
    CASE WHEN ${alias}.visibility = 'family' AND ${alias}.family_id IS NOT NULL
      THEN ${member}
      ELSE (${alias}.owner_id = ${u} OR (${alias}.assigned_to = ${u} AND (${alias}.family_id IS NULL OR ${member})))
    END
  ), 0)`;
}

// A family task whose owner is no longer a member of that family. Nobody could
// otherwise delete it (deletion is owner-only), so it would be stuck forever.
function isOrphanedFamilyTask(task) {
  return isFamilyScoped(task) && !isCurrentMember(task.owner_id, task.family_id);
}

// The one narrow family-level capability: the family's OWNER may delete an
// orphaned family task. Nothing else about task ownership is granted (not
// visibility, not assignment); ordinary members can already edit family tasks.
function canDeleteOrphanedTask(userId, task) {
  if (!isOrphanedFamilyTask(task)) return false;
  const m = db.get('SELECT role FROM family_members WHERE user_id = ? AND family_id = ?', [userId, task.family_id]);
  return !!m && m.role === 'owner';
}

module.exports = {
  VISIBILITIES,
  isFamilyScoped,
  isCurrentMember,
  canAccessTask,
  taskAccessSql,
  isOrphanedFamilyTask,
  canDeleteOrphanedTask,
};
