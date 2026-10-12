const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { addDays, todayISO } = require('../lib/dates');
const { logActivity } = require('../lib/family');
const { computeProgress } = require('../lib/goalProgress');
const ai = require('../lib/ai');

const router = express.Router();

const CATEGORIES = ['learning', 'fitness', 'financial', 'career', 'habit', 'personal'];
const STATUSES = ['active', 'completed', 'abandoned'];

function mapGoal(g, milestones = []) {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    category: g.category,
    targetDate: g.target_date,
    status: g.status,
    progress: g.progress,
    createdAt: g.created_at,
    milestones: milestones.map((m) => ({ id: m.id, title: m.title, done: !!m.done, dueDate: m.due_date })),
  };
}

async function milestonesFor(goalId) {
  return await db.all('SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY sort_order ASC, id ASC', [goalId]);
}

// Visual Redesign Batch 7C: fixes a real, verified status/progress
// desync — a goal that reached 100% (auto-flipped to `completed` below)
// stayed `completed` forever after, even if a milestone was later
// unchecked and its stored progress dropped back under 100. The goal
// would then render as "completed" while its own progress bar showed
// less than full. Milestones are the authoritative source of truth for
// completion, so both directions of the transition are now derived from
// them, symmetrically. `abandoned` is a separate, manually-set status
// (see PATCH /:id) and is deliberately left untouched here — this batch
// does not add or change abandoned-goal lifecycle behavior, only keeps
// the existing active/completed pair internally consistent.
async function recomputeProgress(goalId) {
  const ms = await milestonesFor(goalId);
  const goal = await db.get('SELECT status FROM goals WHERE id = ?', [goalId]);
  // No milestones left (the last one was deleted): progress is 0 again and a
  // goal that was completed through its milestones is active again. This used
  // to return early, leaving the goal "completed, 100%" with no steps at all.
  // A goal that never had milestones never reaches this function.
  const { progress, allDone } = computeProgress(ms);
  await db.run("UPDATE goals SET progress = ?, updated_at = datetime('now') WHERE id = ?", [progress, goalId]);
  if (allDone && goal.status !== 'completed') {
    await db.run("UPDATE goals SET status = 'completed' WHERE id = ?", [goalId]);
  } else if (!allDone && goal.status === 'completed') {
    await db.run("UPDATE goals SET status = 'active' WHERE id = ?", [goalId]);
  }
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const rows = await db.all('SELECT * FROM goals WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);
    const goals = [];
    for (const g of rows) goals.push(mapGoal(g, await milestonesFor(g.id)));
    res.json({ goals });
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const b = req.body || {};
    if (!isNonEmpty(b.title)) throw new ValidationError('Title is required.', { title: 'Required' });
    if (b.category && !CATEGORIES.includes(b.category)) throw new ValidationError('Invalid category.');
    const result = await db.run('INSERT INTO goals (owner_id, title, description, category, target_date) VALUES (?,?,?,?,?)', [
      req.user.id,
      b.title.trim(),
      b.description || null,
      b.category || 'personal',
      b.targetDate || null,
    ]);
    res.status(201).json({ goal: mapGoal(await db.get('SELECT * FROM goals WHERE id = ?', [result.lastInsertRowid])) });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const g = await db.get('SELECT * FROM goals WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!g) return res.status(404).json({ error: 'Goal not found.' });
    res.json({ goal: mapGoal(g, await milestonesFor(g.id)) });
  })
);

router.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const g = await db.get('SELECT * FROM goals WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!g) return res.status(404).json({ error: 'Goal not found.' });
    const b = req.body || {};
    if (b.title !== undefined && !isNonEmpty(b.title)) throw new ValidationError('Title is required.', { title: 'Required' });
    if (b.category !== undefined && !CATEGORIES.includes(b.category)) throw new ValidationError('Invalid category.');
    if (b.status !== undefined && !STATUSES.includes(b.status)) throw new ValidationError('Invalid status.');
    const map = { title: 'title', description: 'description', category: 'category', targetDate: 'target_date', status: 'status' };
    const fields = [];
    const params = [];
    for (const [key, col] of Object.entries(map)) {
      if (b[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(b[key]);
      }
    }
    if (!fields.length) return res.json({ goal: mapGoal(g, await milestonesFor(g.id)) });
    fields.push("updated_at = datetime('now')");
    await db.run(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`, [...params, g.id]);
    const updated = await db.get('SELECT * FROM goals WHERE id = ?', [g.id]);
    res.json({ goal: mapGoal(updated, await milestonesFor(g.id)) });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const g = await db.get('SELECT * FROM goals WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!g) return res.status(404).json({ error: 'Goal not found.' });
    await db.run('DELETE FROM goals WHERE id = ?', [g.id]);
    res.json({ ok: true });
  })
);

router.post(
  '/:id/milestones',
  asyncRoute(async (req, res) => {
    const g = await db.get('SELECT * FROM goals WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!g) return res.status(404).json({ error: 'Goal not found.' });
    const { title, dueDate } = req.body || {};
    if (!isNonEmpty(title)) throw new ValidationError('Milestone title is required.');
    const count = (await db.get('SELECT COUNT(*) c FROM goal_milestones WHERE goal_id = ?', [g.id])).c;
    const result = await db.run('INSERT INTO goal_milestones (goal_id, title, due_date, sort_order) VALUES (?,?,?,?)', [
      g.id,
      title.trim(),
      dueDate || null,
      count,
    ]);
    await recomputeProgress(g.id);
    res.status(201).json({ milestone: await db.get('SELECT * FROM goal_milestones WHERE id = ?', [result.lastInsertRowid]) });
  })
);

router.patch(
  '/:id/milestones/:milestoneId',
  asyncRoute(async (req, res) => {
    const g = await db.get('SELECT * FROM goals WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!g) return res.status(404).json({ error: 'Goal not found.' });
    const done = req.body && req.body.done ? 1 : 0;
    await db.run('UPDATE goal_milestones SET done = ? WHERE id = ? AND goal_id = ?', [done, req.params.milestoneId, g.id]);
    await recomputeProgress(g.id);
    if (done) {
      await logActivity({
        userId: req.user.id,
        type: 'goal_progress',
        summary: `${req.user.first_name} completed a milestone for "${g.title}"`,
        link: `#/goals/${g.id}`,
      });
    }
    res.json({ goal: mapGoal(await db.get('SELECT * FROM goals WHERE id = ?', [g.id]), await milestonesFor(g.id)) });
  })
);

router.delete(
  '/:id/milestones/:milestoneId',
  asyncRoute(async (req, res) => {
    const g = await db.get('SELECT * FROM goals WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!g) return res.status(404).json({ error: 'Goal not found.' });
    await db.run('DELETE FROM goal_milestones WHERE id = ? AND goal_id = ?', [req.params.milestoneId, g.id]);
    await recomputeProgress(g.id);
    res.json({ ok: true });
  })
);

router.post(
  '/:id/suggest-milestones',
  asyncRoute(async (req, res) => {
    const g = await db.get('SELECT * FROM goals WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!g) return res.status(404).json({ error: 'Goal not found.' });
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);
    const result = await ai.suggestMilestones({
      title: g.title,
      description: g.description,
      targetDate: g.target_date,
      today: todayISO(),
    });
    if (!result.ok) return res.json(result);

    const existingCount = (await db.get('SELECT COUNT(*) c FROM goal_milestones WHERE goal_id = ?', [g.id])).c;
    for (const [i, m] of result.data.milestones.entries()) {
      await db.run('INSERT INTO goal_milestones (goal_id, title, due_date, sort_order) VALUES (?,?,?,?)', [
        g.id,
        m.title,
        addDays(todayISO(), m.dueOffsetDays),
        existingCount + i,
      ]);
    }
    await recomputeProgress(g.id);
    res.json({ ok: true, goal: mapGoal(await db.get('SELECT * FROM goals WHERE id = ?', [g.id]), await milestonesFor(g.id)) });
  })
);

module.exports = router;
