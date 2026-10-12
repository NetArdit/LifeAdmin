const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { getUserFamilyIds, HIDE_NON_FAMILY_TASK_ACTIVITY } = require('../lib/family');
const { taskAccessSql } = require('../lib/taskAccess');
const { showsLinkedTaskSql } = require('../lib/linkedTaskFilter');
const { groupByBucket } = require('../lib/priority');
const { todayISO, findConflicts } = require('../lib/dates');

const router = express.Router();

// Deterministic "what matters right now" aggregation (spec §8, §28).
router.get(
  '/',
  asyncRoute(async (req, res) => {
    const userId = req.user.id;
    const familyIds = await getUserFamilyIds(userId);
    const familyPlaceholders = familyIds.map(() => '?').join(',');

    // Task visibility comes from the canonical rule (lib/taskAccess.js).
    const tasks = await db.all(
      `SELECT * FROM tasks t WHERE ${taskAccessSql('t', userId)} AND t.status NOT IN ('completed','cancelled')`
    );
    const bills = await db.all(`SELECT * FROM bills WHERE owner_id = ? AND status = 'unpaid'`, [userId]);
    const decisions = await db.all(`SELECT * FROM decisions WHERE owner_id = ? AND status = 'open'`, [userId]);
    // Batch 7C fix: this previously had no ORDER BY, so "goals in progress"
    // came back in whatever physical/insertion order SQLite happened to
    // store them in — which could (and, with real data, did) differ from
    // the Goals page's own `ORDER BY created_at DESC`. Same rule here so
    // the two surfaces agree on which goals are "most current" without
    // redesigning either page's layout.
    const goals = await db.all(`SELECT * FROM goals WHERE owner_id = ? AND status = 'active' ORDER BY created_at DESC`, [userId]);

    // Normalize into a common shape for the priority engine.
    const taskItems = tasks.map((t) => ({ kind: 'task', id: t.id, title: t.title, due_date: t.due_date, priority: t.priority, status: t.status, link: `#/tasks/${t.id}` }));
    const billItems = bills.map((b) => ({ kind: 'bill', id: b.id, title: `Pay ${b.name}`, due_date: b.due_date, priority: 'high', status: 'todo', link: '#/billsense' }));
    const decisionItems = decisions.map((d) => ({ kind: 'decision', id: d.id, title: d.question, due_date: null, priority: 'medium', status: 'todo', link: `#/decisionflow/${d.id}` }));

    const allItems = [...taskItems, ...billItems, ...decisionItems];
    const buckets = groupByBucket(allItems);

    const today = todayISO();
    const todayItems = allItems.filter((i) => i.due_date === today);
    const overdueItems = buckets.overdue.map((r) => r.item);

    const conflicts = findConflicts(tasks);

    // Family activity feed (last 10 across all of the user's families).
    let familyActivity = [];
    if (familyIds.length) {
      familyActivity = await db.all(
        `SELECT a.*, u.first_name, u.last_name FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
         WHERE a.family_id IN (${familyPlaceholders}) AND ${HIDE_NON_FAMILY_TASK_ACTIVITY}
           AND ${showsLinkedTaskSql('a.link', userId)} ORDER BY a.created_at DESC LIMIT 10`,
        familyIds
      );
    }

    res.json({
      today: {
        date: today,
        count: todayItems.length + overdueItems.length,
        items: [...overdueItems, ...todayItems.filter((i) => !overdueItems.includes(i))].slice(0, 8),
      },
      needsAttention: buckets.needs_attention.slice(0, 8).map((r) => r.item),
      comingSoon: buckets.coming_soon.slice(0, 8).map((r) => r.item),
      canWait: buckets.can_wait.slice(0, 6).map((r) => r.item),
      overdue: overdueItems,
      conflicts: conflicts.length,
      goalsInProgress: goals.slice(0, 4).map((g) => ({ id: g.id, title: g.title, progress: g.progress })),
      familyActivity: familyActivity.map((a) => ({
        id: a.id,
        type: a.type,
        summary: a.summary,
        link: a.link,
        createdAt: a.created_at,
        actorName: a.first_name ? `${a.first_name} ${a.last_name}` : null,
      })),
      counts: {
        tasks: tasks.length,
        bills: bills.length,
        decisions: decisions.length,
        goals: goals.length,
      },
    });
  })
);

module.exports = router;
