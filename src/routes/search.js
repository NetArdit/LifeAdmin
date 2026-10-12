const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { getUserFamilyIds } = require('../lib/family');
const { taskAccessSql } = require('../lib/taskAccess');

const router = express.Router();

// Local, deterministic search — no AI call needed for ordinary search (spec §21).
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });
    const like = `%${q}%`;
    const userId = req.user.id;
    const familyIds = await getUserFamilyIds(userId);
    const famPlaceholders = familyIds.map(() => '?').join(',');
    const results = [];

    // Task visibility comes from the canonical rule (lib/taskAccess.js).
    const tasks = await db.all(
      `SELECT t.id, t.title FROM tasks t WHERE ${taskAccessSql('t', userId)} AND (t.title LIKE ? OR t.description LIKE ?) LIMIT 8`,
      [like, like]
    );
    results.push(...tasks.map((t) => ({ type: 'task', id: t.id, title: t.title, link: `#/tasks/${t.id}` })));

    const bills = await db.all(`SELECT id, name FROM bills WHERE owner_id = ? AND name LIKE ? LIMIT 8`, [userId, like]);
    results.push(...bills.map((b) => ({ type: 'bill', id: b.id, title: b.name, link: '#/billsense' })));

    const decisions = await db.all(`SELECT id, question FROM decisions WHERE owner_id = ? AND question LIKE ? LIMIT 8`, [userId, like]);
    results.push(...decisions.map((d) => ({ type: 'decision', id: d.id, title: d.question, link: `#/decisionflow/${d.id}` })));

    const goals = await db.all(`SELECT id, title FROM goals WHERE owner_id = ? AND title LIKE ? LIMIT 8`, [userId, like]);
    results.push(...goals.map((g) => ({ type: 'goal', id: g.id, title: g.title, link: `#/goals/${g.id}` })));

    if (familyIds.length) {
      const messages = await db.all(
        `SELECT id, body, family_id FROM messages WHERE family_id IN (${famPlaceholders}) AND body LIKE ? LIMIT 5`,
        [...familyIds, like]
      );
      results.push(...messages.map((m) => ({ type: 'message', id: m.id, title: m.body.slice(0, 80), link: '#/family/chat' })));

      // Same visibility rule as the task search above: a comment is searchable only
      // on a task the user can open (own, assigned, or family-visible in their family).
      const comments = await db.all(
        `SELECT c.id, c.body, c.task_id FROM task_comments c JOIN tasks t ON t.id = c.task_id
         WHERE ${taskAccessSql('t', userId)} AND c.body LIKE ? LIMIT 5`,
        [like]
      );
      results.push(...comments.map((c) => ({ type: 'comment', id: c.id, title: c.body.slice(0, 80), link: `#/tasks/${c.task_id}` })));
    }

    res.json({ results });
  })
);

module.exports = router;
