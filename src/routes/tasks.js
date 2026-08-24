const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { getUserFamilyIds, requireMembership, logActivity } = require('../lib/family');
const { notifyFamily, notifyUser } = require('../lib/notify');
const { addDays, todayISO } = require('../lib/dates');

const router = express.Router();

const STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

function visibleTaskIds(userId) {
  const familyIds = getUserFamilyIds(userId);
  return familyIds;
}

function taskWhereClause(userId) {
  const familyIds = visibleTaskIds(userId);
  if (familyIds.length === 0) {
    return { clause: '(t.owner_id = ? OR t.assigned_to = ?)', params: [userId, userId] };
  }
  const placeholders = familyIds.map(() => '?').join(',');
  return {
    clause: `(t.owner_id = ? OR t.assigned_to = ? OR (t.visibility = 'family' AND t.family_id IN (${placeholders})))`,
    params: [userId, userId, ...familyIds],
  };
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

    logActivity({
      userId: req.user.id,
      familyId,
      type: 'task_created',
      summary: `${req.user.first_name} created "${b.title.trim()}"`,
      link: `#/tasks/${result.lastInsertRowid}`,
    });

    if (familyId && visibility === 'family') {
      notifyFamily(familyId, req.user.id, {
        type: 'family',
        title: 'New family task',
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

function loadOwnedOrAssigned(req) {
  const t = db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!t) return null;
  const familyIds = getUserFamilyIds(req.user.id);
  const canSee =
    t.owner_id === req.user.id ||
    t.assigned_to === req.user.id ||
    (t.visibility === 'family' && familyIds.includes(t.family_id));
  return canSee ? t : null;
}

router.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const t = loadOwnedOrAssigned(req);
    if (!t) return res.status(404).json({ error: 'Task not found.' });

    const b = req.body || {};
    const fields = [];
    const params = [];
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
      assignedTo: 'assigned_to',
      visibility: 'visibility',
    };
    for (const [key, col] of Object.entries(map)) {
      if (b[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(b[key]);
      }
    }
    if (b.status === 'completed' && t.status !== 'completed') {
      fields.push('completed_at = datetime(\'now\')');
    }
    if (!fields.length) return res.json({ task: mapTask(t) });

    fields.push("updated_at = datetime('now')");
    db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, [...params, t.id]);

    const updated = db.get('SELECT * FROM tasks WHERE id = ?', [t.id]);
    if (b.status === 'completed' && t.status !== 'completed') {
      logActivity({
        userId: req.user.id,
        familyId: t.family_id,
        type: 'task_completed',
        summary: `${req.user.first_name} completed "${updated.title}"`,
        link: `#/tasks/${t.id}`,
      });
      if (t.family_id && t.visibility === 'family') {
        notifyFamily(t.family_id, req.user.id, {
          type: 'task',
          title: 'Task completed',
          body: updated.title,
          link: `#/tasks/${t.id}`,
        });
      }
    }
    res.json({ task: mapTask(updated) });
  })
);

router.post(
  '/:id/postpone',
  asyncRoute(async (req, res) => {
    const t = loadOwnedOrAssigned(req);
    if (!t) return res.status(404).json({ error: 'Task not found.' });
    const days = Number(req.body && req.body.days) || 1;
    const newDue = t.due_date ? addDays(t.due_date, days) : addDays(todayISO(), days);
    db.run("UPDATE tasks SET due_date = ?, updated_at = datetime('now') WHERE id = ?", [newDue, t.id]);
    const updated = db.get('SELECT * FROM tasks WHERE id = ?', [t.id]);
    res.json({ task: mapTask(updated) });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const t = db.get('SELECT * FROM tasks WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!t) return res.status(404).json({ error: 'Task not found.' });
    db.run('DELETE FROM tasks WHERE id = ?', [t.id]);
    res.json({ ok: true });
  })
);

// --- Comments --------------------------------------------------------------
router.post(
  '/:id/comments',
  asyncRoute(async (req, res) => {
    const t = loadOwnedOrAssigned(req);
    if (!t) return res.status(404).json({ error: 'Task not found.' });
    const body = req.body && req.body.body;
    if (!isNonEmpty(body)) throw new ValidationError('Comment cannot be empty.');

    const result = db.run('INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)', [
      t.id,
      req.user.id,
      body.trim(),
    ]);

    logActivity({
      userId: req.user.id,
      familyId: t.family_id,
      type: 'comment',
      summary: `${req.user.first_name} commented on "${t.title}"`,
      link: `#/tasks/${t.id}`,
    });
    if (t.family_id) {
      notifyFamily(t.family_id, req.user.id, {
        type: 'comment',
        title: `${req.user.first_name} commented on "${t.title}"`,
        body: body.trim(),
        link: `#/tasks/${t.id}`,
      });
    } else if (t.owner_id !== req.user.id) {
      notifyUser(t.owner_id, {
        type: 'comment',
        title: `New comment on "${t.title}"`,
        body: body.trim(),
        link: `#/tasks/${t.id}`,
      });
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
