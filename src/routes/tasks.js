const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { requireMembership, getMembership, logActivity, sharedFamilyIdForTask } = require('../lib/family');
const { VISIBILITIES, canAccessTask, taskAccessSql, canDeleteOrphanedTask } = require('../lib/taskAccess');
const { notifyFamily, notifyUser } = require('../lib/notify');
const { addDays, todayISO, nextRecurrenceDate, daysBetween } = require('../lib/dates');

const router = express.Router();

const STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

// Who may see a task is decided ONLY by the canonical rule in lib/taskAccess.js
// (current membership + visibility + owner/assignee). Every read and every
// mutation below goes through it; this file keeps no copy of the rule.
function taskWhereClause(userId) {
  return { clause: taskAccessSql('t', userId), params: [] };
}

function forbidden(message) {
  const err = new ValidationError(message);
  err.status = 403;
  return err;
}

// Assigning a task to someone only makes sense within a shared family, and
// the target must actually belong to that family — otherwise a task (and its
// title/description, potentially sensitive) becomes visible to an arbitrary
// user id with no relationship to the assigner.
function validateAssignment(assignedTo, familyId) {
  if (assignedTo == null) return;
  if (!familyId) {
    throw new ValidationError('Assigning a task requires selecting a circle.', { assignedTo: 'Select a circle to assign this task within.' });
  }
  if (!getMembership(assignedTo, familyId)) {
    throw new ValidationError('The assignee must be a member of the selected circle.', { assignedTo: 'Not a member of this circle.' });
  }
}

function mapTask(t) {
  return {
    id: t.id,
    ownerId: t.owner_id,
    familyId: t.family_id,
    assignedTo: t.assigned_to,
    visibility: t.visibility,
    title: t.title,
    description: t.description,
    category: t.category,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    startTime: t.start_time,
    durationMinutes: t.duration_minutes,
    recurrence: t.recurrence,
    recurrenceUntil: t.recurrence_until,
    reminderMinutesBefore: t.reminder_minutes_before,
    notes: t.notes,
    completedAt: t.completed_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    ownerName: t.owner_first_name ? `${t.owner_first_name} ${t.owner_last_name}` : null,
    assigneeName: t.assignee_first_name ? `${t.assignee_first_name} ${t.assignee_last_name}` : null,
  };
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { status, category, priority, familyId, view, q } = req.query;
    const { clause, params } = taskWhereClause(req.user.id);
    let sql = `SELECT t.*, ou.first_name owner_first_name, ou.last_name owner_last_name,
                      au.first_name assignee_first_name, au.last_name assignee_last_name
               FROM tasks t
               LEFT JOIN users ou ON ou.id = t.owner_id
               LEFT JOIN users au ON au.id = t.assigned_to
               WHERE ${clause}`;
    const extra = [];
    if (status) {
      sql += ' AND t.status = ?';
      extra.push(status);
    }
    if (category) {
      sql += ' AND t.category = ?';
      extra.push(category);
    }
    if (priority) {
      sql += ' AND t.priority = ?';
      extra.push(priority);
    }
    if (familyId) {
      sql += ' AND t.family_id = ?';
      extra.push(Number(familyId));
    }
    if (q) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      extra.push(`%${q}%`, `%${q}%`);
    }
    if (view === 'today') {
      sql += " AND t.due_date = ? AND t.status NOT IN ('completed','cancelled')";
      extra.push(todayISO());
    } else if (view === 'upcoming') {
      sql += " AND t.due_date > ? AND t.status NOT IN ('completed','cancelled')";
      extra.push(todayISO());
    } else if (view === 'overdue') {
      sql += " AND t.due_date < ? AND t.status NOT IN ('completed','cancelled')";
      extra.push(todayISO());
    }
    sql += ' ORDER BY (t.due_date IS NULL), t.due_date ASC, t.start_time ASC';

    const rows = db.all(sql, [...params, ...extra]);
    res.json({ tasks: rows.map(mapTask) });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { clause, params } = taskWhereClause(req.user.id);
    const t = db.get(
      `SELECT t.*, ou.first_name owner_first_name, ou.last_name owner_last_name,
              au.first_name assignee_first_name, au.last_name assignee_last_name
       FROM tasks t
       LEFT JOIN users ou ON ou.id = t.owner_id
       LEFT JOIN users au ON au.id = t.assigned_to
       WHERE t.id = ? AND ${clause}`,
      [req.params.id, ...params]
    );
    if (!t) return res.status(404).json({ error: 'Task not found.' });
    const comments = db.all(
      `SELECT c.*, u.first_name, u.last_name FROM task_comments c JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ? ORDER BY c.created_at ASC`,
      [t.id]
    );
    res.json({
      task: mapTask(t),
      comments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        authorName: `${c.first_name} ${c.last_name}`,
        authorId: c.user_id,
      })),
    });
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const b = req.body || {};
    if (!isNonEmpty(b.title)) throw new ValidationError('Title is required.', { title: 'Required' });
    if (b.status && !STATUSES.includes(b.status)) throw new ValidationError('Invalid status.');
    if (b.priority && !PRIORITIES.includes(b.priority)) throw new ValidationError('Invalid priority.');

    let familyId = null;
    let visibility = 'private';
    if (b.familyId) {
      requireMembership(req.user.id, b.familyId);
      familyId = b.familyId;
      visibility = b.visibility === 'family' ? 'family' : 'private';
    }
    validateAssignment(b.assignedTo, familyId);

    const result = db.run(
      `INSERT INTO tasks (owner_id, family_id, assigned_to, visibility, title, description, category, status,
        priority, due_date, start_time, duration_minutes, recurrence, recurrence_until, reminder_minutes_before, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        familyId,
        b.assignedTo || null,
        visibility,
        b.title.trim(),
        b.description || null,
        b.category || 'general',
        b.status || 'todo',
        b.priority || 'medium',
        b.dueDate || null,
        b.startTime || null,
        b.durationMinutes || null,
        b.recurrence || null,
        b.recurrenceUntil || null,
        b.reminderMinutesBefore || null,
        b.notes || null,
      ]
    );

    // Hardening 1 / F-04: only a family-visible task may appear on the family's
    // shared surfaces (feed, dashboard feed, Timeline). A private task's activity
    // stays with its author (family_id NULL) even when the task sits inside a family.
    logActivity({
      userId: req.user.id,
      familyId: sharedFamilyIdForTask({ visibility, family_id: familyId }),
      type: 'task_created',
      summary: `${req.user.first_name} created "${b.title.trim()}"`,
      link: `#/tasks/${result.lastInsertRowid}`,
    });

    if (familyId && visibility === 'family') {
      notifyFamily(familyId, req.user.id, {
        type: 'family',
        title: 'New circle task',
        body: b.title.trim(),
        link: `#/tasks/${result.lastInsertRowid}`,
      });
    }
    if (b.assignedTo && b.assignedTo !== req.user.id) {
      notifyUser(b.assignedTo, {
        type: 'task',
        title: 'A task was assigned to you',
        body: b.title.trim(),
        link: `#/tasks/${result.lastInsertRowid}`,
      });
    }

    const t = db.get('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ task: mapTask(t) });
  })
);

// Recurring tasks: on completion, create the next occurrence — mirrors the
// existing recurring-bill rollover pattern (src/routes/bills.js:nextDueDate).
// Stops once recurrenceUntil is passed, or if there's no due date to advance
// from (recurrence without a due date has nothing to compute the next
// occurrence relative to).
function spawnNextOccurrence(t) {
  if (!t.recurrence || !t.due_date) return null;
  const next = nextRecurrenceDate(t.due_date, t.recurrence);
  if (!next) return null;
  if (t.recurrence_until && next > t.recurrence_until) return null;

  // Completing a task, reopening it and completing it again must not create a
  // second copy of the next occurrence: if that occurrence already exists and
  // is still open, there is nothing to create.
  const already = db.get(
    `SELECT id FROM tasks WHERE owner_id = ? AND title = ? AND recurrence = ? AND due_date = ?
       AND family_id IS ? AND id != ? AND status NOT IN ('completed','cancelled')`,
    [t.owner_id, t.title, t.recurrence, next, t.family_id, t.id]
  );
  if (already) return null;

  let nextStartTime = null;
  if (t.start_time) {
    const deltaDays = daysBetween(t.due_date, next);
    const d = new Date(t.start_time);
    d.setDate(d.getDate() + deltaDays);
    nextStartTime = d.toISOString();
  }

  const result = db.run(
    `INSERT INTO tasks (owner_id, family_id, assigned_to, visibility, title, description, category, status,
      priority, due_date, start_time, duration_minutes, recurrence, recurrence_until, reminder_minutes_before, notes)
     VALUES (?,?,?,?,?,?,?,'todo',?,?,?,?,?,?,?,?)`,
    [
      t.owner_id,
      t.family_id,
      t.assigned_to,
      t.visibility,
      t.title,
      t.description,
      t.category,
      t.priority,
      next,
      nextStartTime,
      t.duration_minutes,
      t.recurrence,
      t.recurrence_until,
      t.reminder_minutes_before,
      t.notes,
    ]
  );
  return result.lastInsertRowid;
}

// Loads a task by URL id only if the requester can CURRENTLY access it; a task
// that does not exist and one the requester may not open are the same 404, so a
// former member cannot use a remembered id to probe or mutate family tasks.
function loadAccessibleTask(req) {
  const t = db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  return t && canAccessTask(req.user.id, t) ? t : null;
}

const normId = (v) => (v == null ? null : Number(v));

router.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const t = loadAccessibleTask(req);
    if (!t) return res.status(404).json({ error: 'Task not found.' });

    const b = req.body || {};
    // Same rules as creating a task: an edit must not store what a create would refuse.
    if (b.title !== undefined && !isNonEmpty(b.title)) throw new ValidationError('Title is required.', { title: 'Required' });
    if (b.status !== undefined && !STATUSES.includes(b.status)) throw new ValidationError('Invalid status.');
    if (b.priority !== undefined && !PRIORITIES.includes(b.priority)) throw new ValidationError('Invalid priority.');
    const isOwner = t.owner_id === req.user.id;
    const fields = [];
    const params = [];

    // A task's family is fixed once set: a request naming a DIFFERENT family is
    // refused (same rule as bills). Repeating the current one is harmless.
    if (b.familyId != null && t.family_id != null && Number(b.familyId) !== t.family_id) {
      throw new ValidationError("A task can't be moved to a different circle.", { familyId: 'Not editable' });
    }

    // VISIBILITY — a privacy property of the OWNER. The edit form submits it on every
    // save, so what is checked is a CHANGE (requested value differs from the stored
    // one), never mere presence.
    if (b.visibility !== undefined && b.visibility !== t.visibility) {
      if (!VISIBILITIES.includes(b.visibility)) throw new ValidationError('Invalid visibility.', { visibility: 'Invalid' });
      if (!isOwner) throw forbidden('Only the task owner can change who can see a task.');
      if (b.visibility === 'family') {
        // Sharing with a family needs a family the owner currently belongs to.
        const target = t.family_id != null ? t.family_id : b.familyId;
        if (!Number.isInteger(target)) throw new ValidationError('Choose a circle to share this task with.', { familyId: 'Required' });
        requireMembership(req.user.id, target);
        if (t.family_id == null) {
          fields.push('family_id = ?');
          params.push(target);
        }
      }
      fields.push('visibility = ?');
      params.push(b.visibility);
    }

    // ASSIGNEE — grants access to the task, so it is owner-only too (again: a change,
    // not presence). Family membership of the new assignee is validated as before.
    if (b.assignedTo !== undefined && normId(b.assignedTo) !== normId(t.assigned_to)) {
      if (!isOwner) throw forbidden('Only the task owner can change the assignee.');
      const effectiveFamily = t.family_id != null ? t.family_id : fields.includes('family_id = ?') ? params[fields.indexOf('family_id = ?')] : null;
      validateAssignment(b.assignedTo, effectiveFamily);
      fields.push('assigned_to = ?');
      params.push(b.assignedTo);
    }

    const map = {
      title: 'title',
      description: 'description',
      category: 'category',
      status: 'status',
      priority: 'priority',
      dueDate: 'due_date',
      startTime: 'start_time',
      durationMinutes: 'duration_minutes',
      recurrence: 'recurrence',
      recurrenceUntil: 'recurrence_until',
      reminderMinutesBefore: 'reminder_minutes_before',
      notes: 'notes',
    };
    for (const [key, col] of Object.entries(map)) {
      if (b[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(b[key]);
      }
    }
    if (b.status === 'completed' && t.status !== 'completed') {
      fields.push('completed_at = datetime(\'now\')');
    } else if (b.status !== undefined && b.status !== 'completed' && t.status === 'completed') {
      // Reopened: it is no longer completed, so it has no completion time.
      fields.push('completed_at = NULL');
    }
    if (!fields.length) return res.json({ task: mapTask(t) });

    fields.push("updated_at = datetime('now')");
    db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, [...params, t.id]);

    const updated = db.get('SELECT * FROM tasks WHERE id = ?', [t.id]);
    if (b.status === 'completed' && t.status !== 'completed') {
      const sharedFamilyId = sharedFamilyIdForTask(updated);
      logActivity({
        userId: req.user.id,
        familyId: sharedFamilyId,
        type: 'task_completed',
        summary: `${req.user.first_name} completed "${updated.title}"`,
        link: `#/tasks/${t.id}`,
      });
      if (sharedFamilyId) {
        notifyFamily(sharedFamilyId, req.user.id, {
          type: 'task',
          title: 'Task completed',
          body: updated.title,
          link: `#/tasks/${t.id}`,
        });
      }
      const nextId = spawnNextOccurrence(updated);
      if (nextId) {
        logActivity({
          userId: req.user.id,
          familyId: sharedFamilyId,
          type: 'task_created',
          summary: `${req.user.first_name} — next occurrence of "${updated.title}" created`,
          link: `#/tasks/${nextId}`,
        });
      }
    }
    res.json({ task: mapTask(updated) });
  })
);

router.post(
  '/:id/postpone',
  asyncRoute(async (req, res) => {
    const t = loadAccessibleTask(req);
    if (!t) return res.status(404).json({ error: 'Task not found.' });
    // Postponing moves a task later by a whole number of days (1 to 365).
    const requested = Math.trunc(Number(req.body && req.body.days)) || 1;
    const days = Math.min(365, Math.max(1, requested));
    const newDue = t.due_date ? addDays(t.due_date, days) : addDays(todayISO(), days);
    // A timed task keeps its time of day: the start moves with the due date.
    // It used to stay on the old day, so the task was due on one date and
    // scheduled on another.
    let newStart = t.start_time;
    if (t.start_time && t.due_date) {
      const d = new Date(t.start_time);
      if (!Number.isNaN(d.getTime())) {
        d.setDate(d.getDate() + days);
        newStart = d.toISOString();
      }
    }
    db.run("UPDATE tasks SET due_date = ?, start_time = ?, updated_at = datetime('now') WHERE id = ?", [newDue, newStart, t.id]);
    const updated = db.get('SELECT * FROM tasks WHERE id = ?', [t.id]);
    res.json({ task: mapTask(updated) });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    // Deleting stays owner-only, with one narrow exception: the FAMILY owner may delete
    // a family task whose owner has left the family (otherwise it could never be removed).
    const t = db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    const allowed = t && ((t.owner_id === req.user.id && canAccessTask(req.user.id, t)) || canDeleteOrphanedTask(req.user.id, t));
    if (!allowed) return res.status(404).json({ error: 'Task not found.' });
    db.run('DELETE FROM tasks WHERE id = ?', [t.id]);
    res.json({ ok: true });
  })
);

// --- Comments --------------------------------------------------------------
router.post(
  '/:id/comments',
  asyncRoute(async (req, res) => {
    const t = loadAccessibleTask(req);
    if (!t) return res.status(404).json({ error: 'Task not found.' });
    const body = req.body && req.body.body;
    if (!isNonEmpty(body)) throw new ValidationError('Comment cannot be empty.');

    const result = db.run('INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)', [
      t.id,
      req.user.id,
      body.trim(),
    ]);

    // Hardening 1 / F-04: comments follow the task's visibility. A family-visible
    // task notifies the family as before. A private task (even inside a family) tells
    // only the people who can actually open it — its owner and its assignee — and
    // writes nothing to the family's shared feed.
    const sharedFamilyId = sharedFamilyIdForTask(t);
    logActivity({
      userId: req.user.id,
      familyId: sharedFamilyId,
      type: 'comment',
      summary: `${req.user.first_name} commented on "${t.title}"`,
      link: `#/tasks/${t.id}`,
    });
    if (sharedFamilyId) {
      notifyFamily(sharedFamilyId, req.user.id, {
        type: 'comment',
        title: `${req.user.first_name} commented on "${t.title}"`,
        body: body.trim(),
        link: `#/tasks/${t.id}`,
      });
    } else {
      // Only people who can CURRENTLY open the task are told about it.
      const recipients = new Set(
        [t.owner_id, t.assigned_to].filter((id) => id && id !== req.user.id && canAccessTask(id, t))
      );
      for (const userId of recipients) {
        notifyUser(userId, {
          type: 'comment',
          title: `New comment on "${t.title}"`,
          body: body.trim(),
          link: `#/tasks/${t.id}`,
        });
      }
    }

    const c = db.get('SELECT * FROM task_comments WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({
      comment: {
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        authorName: `${req.user.first_name} ${req.user.last_name}`,
        authorId: req.user.id,
      },
    });
  })
);

module.exports = router;
