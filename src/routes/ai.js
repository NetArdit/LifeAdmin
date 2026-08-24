const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { todayISO, addDays } = require('../lib/dates');
const { buildBusyBlocks, placeActivities, hmToMinutes, minutesToHm } = require('../lib/scheduler');
const { getUserFamilyIds } = require('../lib/family');
const ai = require('../lib/ai');

const router = express.Router();

const WEEKDAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

router.get('/status', (req, res) => {
  res.json({ configured: ai.isConfigured() });
});

// --- Natural-language life planning (spec §9-10) ----------------------------
router.post(
  '/plan',
  asyncRoute(async (req, res) => {
    const text = req.body && req.body.text;
    if (!isNonEmpty(text)) throw new ValidationError('Describe your week to get a plan.');

    const today = todayISO();
    const weekday = WEEKDAY_CODES[new Date().getDay()];
    const parsed = await ai.parseLifePlan({ text, today, weekday });
    if (!parsed.ok) return res.json(parsed);

    const plan = parsed.data;
    const preview = {};
    const horizonDays = 7;

    for (let i = 0; i < horizonDays; i++) {
      const date = addDays(today, i);
      const dow = WEEKDAY_CODES[new Date(date + 'T00:00:00').getDay()];
      const dayActivities = plan.activities.filter((a) => !a.days.length || a.days.includes(dow));
      if (!dayActivities.length) continue;

      const existingTasks = db.all(
        `SELECT start_time, duration_minutes FROM tasks WHERE owner_id = ? AND due_date = ? AND start_time IS NOT NULL AND duration_minutes IS NOT NULL`,
        [req.user.id, date]
      );
      const extra = existingTasks.map((t) => {
        const start = new Date(t.start_time);
        const hm = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        return { label: 'Existing commitment', start: hm, end: minutesToHm(hmToMinutes(hm) + t.duration_minutes) };
      });

      const busy = buildBusyBlocks({ workStart: plan.workStart, workEnd: plan.workEnd, extra });
      const requests = dayActivities.map((a) => ({
        label: a.label,
        totalMinutes: a.totalMinutesPerDay,
        minBlockMinutes: a.minBlockMinutes,
        earliest: a.earliest,
        latest: a.latest,
        priority: a.priority,
      }));
      const { placed, warnings } = placeActivities(busy, requests);
      if (placed.length || warnings.length) preview[date] = { placed, warnings };
    }

    res.json({ ok: true, plan, preview });
  })
);

// Turn a confirmed preview into real tasks.
router.post(
  '/plan/apply',
  asyncRoute(async (req, res) => {
    const preview = req.body && req.body.preview;
    if (!preview || typeof preview !== 'object') throw new ValidationError('No plan preview to apply.');

    let created = 0;
    for (const [date, day] of Object.entries(preview)) {
      for (const block of day.placed || []) {
        const start = new Date(`${date}T${block.start}:00`);
        const end = new Date(`${date}T${block.end}:00`);
        const duration = Math.round((end - start) / 60000);
        db.run(
          `INSERT INTO tasks (owner_id, title, category, status, priority, due_date, start_time, duration_minutes, notes)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [req.user.id, block.label, 'plan', 'todo', 'medium', date, start.toISOString(), duration, 'Created from AI weekly plan']
        );
        created++;
      }
    }
    res.status(201).json({ ok: true, created });
  })
);

// --- Weekly life review (spec §41 idea) -------------------------------------
router.post(
  '/weekly-review',
  asyncRoute(async (req, res) => {
    const userId = req.user.id;
    const today = todayISO();
    const weekAgo = addDays(today, -7);
    const context = {
      completedTasksLast7Days: db.get(
        `SELECT COUNT(*) c FROM tasks WHERE owner_id = ? AND status = 'completed' AND completed_at >= ?`,
        [userId, weekAgo]
      ).c,
      overdueTasks: db.get(`SELECT COUNT(*) c FROM tasks WHERE owner_id = ? AND due_date < ? AND status NOT IN ('completed','cancelled')`, [userId, today]).c,
      billsUnpaid: db.get(`SELECT COUNT(*) c FROM bills WHERE owner_id = ? AND status = 'unpaid'`, [userId]).c,
      openDecisions: db.get(`SELECT COUNT(*) c FROM decisions WHERE owner_id = ? AND status = 'open'`, [userId]).c,
      goalsWithNoRecentProgress: db.all(
        `SELECT title FROM goals WHERE owner_id = ? AND status = 'active' AND updated_at < ?`,
        [userId, weekAgo]
      ).map((g) => g.title),
      ecoLogsLast7Days: db.get(`SELECT COUNT(*) c FROM eco_logs WHERE owner_id = ? AND logged_at >= ?`, [userId, weekAgo]).c,
      familyCount: getUserFamilyIds(userId).length,
    };
    const result = await ai.weeklyReview(context);
    res.json(result);
  })
);

// --- Assistant chat with context selection (spec §22-23) --------------------
function buildContext(userId, message) {
  const lower = message.toLowerCase();
  const today = todayISO();
  const context = {};

  const wantsBills = /(bill|fatur|pay|money|kursy|euro|\$|€)/.test(lower);
  const wantsSchedule = /(schedule|plan|task|javë|javen|sot|today|week|orar)/.test(lower);
  const wantsFamily = /(family|familj)/.test(lower);
  const wantsGoals = /(goal|qëllim|habit)/.test(lower);

  // Always include a compact snapshot so the assistant has baseline grounding.
  context.today = today;
  context.openCounts = {
    tasks: db.get(`SELECT COUNT(*) c FROM tasks WHERE owner_id = ? AND status NOT IN ('completed','cancelled')`, [userId]).c,
    bills: db.get(`SELECT COUNT(*) c FROM bills WHERE owner_id = ? AND status = 'unpaid'`, [userId]).c,
  };

  if (wantsSchedule || Object.keys(context).length <= 2) {
    context.upcomingTasks = db
      .all(
        `SELECT title, due_date, priority, status FROM tasks WHERE owner_id = ? AND status NOT IN ('completed','cancelled') AND (due_date IS NULL OR due_date >= ?) ORDER BY due_date ASC LIMIT 12`,
        [userId, today]
      );
  }
  if (wantsBills) {
    context.bills = db.all(`SELECT name, amount, currency, due_date, status FROM bills WHERE owner_id = ? AND status = 'unpaid' ORDER BY due_date ASC LIMIT 12`, [userId]);
  }
  if (wantsFamily) {
    const familyIds = getUserFamilyIds(userId);
    if (familyIds.length) {
      const placeholders = familyIds.map(() => '?').join(',');
      context.familyTasks = db.all(
        `SELECT title, due_date, status FROM tasks WHERE visibility='family' AND family_id IN (${placeholders}) AND status NOT IN ('completed','cancelled') LIMIT 10`,
        familyIds
      );
    }
  }
  if (wantsGoals) {
    context.goals = db.all(`SELECT title, progress, target_date FROM goals WHERE owner_id = ? AND status = 'active' LIMIT 8`, [userId]);
  }
  return context;
}

router.get(
  '/chat/history',
  asyncRoute(async (req, res) => {
    let conv = db.get('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.id]);
    if (!conv) return res.json({ conversationId: null, messages: [] });
    const messages = db.all('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 40', [conv.id]);
    res.json({ conversationId: conv.id, messages: messages.map((m) => ({ role: m.role, content: m.content, createdAt: m.created_at })) });
  })
);

router.post(
  '/chat',
  asyncRoute(async (req, res) => {
    const message = req.body && req.body.message;
    if (!isNonEmpty(message)) throw new ValidationError('Message cannot be empty.');

    let conv = db.get('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.id]);
    if (!conv) {
      const result = db.run('INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)', [req.user.id, message.slice(0, 60)]);
      conv = db.get('SELECT * FROM ai_conversations WHERE id = ?', [result.lastInsertRowid]);
    }

    // Keep only a short recent history to control token usage (spec §23).
    const history = db
      .all('SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 6', [conv.id])
      .reverse();

    const context = buildContext(req.user.id, message);
    const result = await ai.assistantChat({ message, context, history });

    db.run("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'user', ?)", [conv.id, message]);
    if (result.ok) {
      db.run("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conv.id, result.data.reply]);
    }
    db.run("UPDATE ai_conversations SET updated_at = datetime('now') WHERE id = ?", [conv.id]);

    res.json(result);
  })
);

module.exports = router;
