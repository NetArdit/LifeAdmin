// Read-time policy for rows that POINT AT a task (notifications, activity/feed rows).
//
// Notifications and activity entries are history: they store a text snapshot and a
// link like "#/tasks/12". They are never deleted or edited. Instead, when they are
// READ, a row that links to a task the reader can no longer access is left out, so
// yesterday's snapshot cannot be used to read something the reader is not allowed to
// see today. If access returns (they rejoin, or the task is shared again) the rows
// simply reappear.
//
// This is separate from taskAccess.js on purpose: that module answers "can X access
// task Y right now"; this one decides what to do with history rows that mention a task.
//
//   * link is not a task link            -> row shown (chat, bills, family, …)
//   * links to a task that no longer exists -> row shown (the reader was entitled to it)
//   * links to an existing task the reader cannot access -> row hidden
const { taskAccessSql } = require('./taskAccess');

// SQL fragment: true when the row should be SHOWN. `linkExpr` is the column holding
// the link (for example "n.link"); `userId` is the reader.
function showsLinkedTaskSql(linkExpr, userId) {
  if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(linkExpr)) throw new TypeError('bad link expression');
  return `NOT EXISTS (
    SELECT 1 FROM tasks lt
    WHERE ${linkExpr} LIKE '#/tasks/%'
      AND lt.id = CAST(substr(${linkExpr}, 9) AS INTEGER)
      AND NOT ${taskAccessSql('lt', userId)}
  )`;
}

module.exports = { showsLinkedTaskSql };
