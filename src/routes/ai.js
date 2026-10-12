const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { todayISO, addDays } = require('../lib/dates');
const { buildBusyBlocks, placeActivities, hmToMinutes, minutesToHm, DAY_MINUTES } = require('../lib/scheduler');
const { getUserFamilyIds } = require('../lib/family');
const { taskAccessSql } = require('../lib/taskAccess');
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
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);

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

      const existingTasks = await db.all(
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
//
// Timezone contract: this app has no persisted user-timezone preference (no
// column on `users`), so the server alone cannot correctly turn a plan's
// "date" + "HH:MM" into the right UTC instant — that requires knowing the
// user's real offset. The existing, already-shipped contract for every OTHER
// task-creation path (see web/src/components/tasks/TaskFormModal.jsx) is
// that the BROWSER does that conversion, because the browser's own local
// timezone is the one place in this app that reliably represents the user's
// timezone. This route now follows that same, already-established contract
// instead of reconstructing the instant itself from date+"HH:MM" — that
// reconstruction used the SERVER's own local timezone, silently wrong on any
// deployment where the server and the user aren't in the same timezone. See
// PHASE_PLAN_SCHEDULER_RELIABILITY_REPORT.md for the full contract writeup
// and why a persisted timezone field was not introduced to solve this.
router.post(
  '/plan/apply',
  asyncRoute(async (req, res) => {
    const preview = req.body && req.body.preview;
    if (!preview || typeof preview !== 'object') throw new ValidationError('No plan preview to apply.');

    // Validate everything before writing anything, so a single malformed
    // block can never leave a partial set of tasks behind.
    const blocks = [];
    for (const [date, day] of Object.entries(preview)) {
      for (const block of day.placed || []) {
        const startMs = Date.parse(block && block.startISO);
        const endMs = Date.parse(block && block.endISO);
        if (!isNonEmpty(block && block.label) || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
          throw new ValidationError('Plan contains an invalid scheduled time.');
        }
        const duration = Math.round((endMs - startMs) / 60000);
        if (duration > DAY_MINUTES) throw new ValidationError('Plan contains an implausibly long block.');
        blocks.push({ date, label: block.label, startISO: block.startISO, duration });
      }
    }

    let created = 0;
    await db.tx(async () => {
      for (const b of blocks) {
        await db.run(
          `INSERT INTO tasks (owner_id, title, category, status, priority, due_date, start_time, duration_minutes, notes)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [req.user.id, b.label, 'plan', 'todo', 'medium', b.date, b.startISO, b.duration, 'Created from AI weekly plan']
        );
        created++;
      }
    });
    res.status(201).json({ ok: true, created });
  })
);

// --- Weekly life review (spec §41 idea) -------------------------------------
router.post(
  '/weekly-review',
  asyncRoute(async (req, res) => {
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);
    const userId = req.user.id;
    const today = todayISO();
    const weekAgo = addDays(today, -7);
    const context = {
      completedTasksLast7Days: (await db.get(
        `SELECT COUNT(*) c FROM tasks WHERE owner_id = ? AND status = 'completed' AND completed_at >= ?`,
        [userId, weekAgo]
      )).c,
      overdueTasks: (await db.get(`SELECT COUNT(*) c FROM tasks WHERE owner_id = ? AND due_date < ? AND status NOT IN ('completed','cancelled')`, [userId, today])).c,
      billsUnpaid: (await db.get(`SELECT COUNT(*) c FROM bills WHERE owner_id = ? AND status = 'unpaid'`, [userId])).c,
      openDecisions: (await db.get(`SELECT COUNT(*) c FROM decisions WHERE owner_id = ? AND status = 'open'`, [userId])).c,
      goalsWithNoRecentProgress: (await db.all(
        `SELECT title FROM goals WHERE owner_id = ? AND status = 'active' AND updated_at < ?`,
        [userId, weekAgo]
      )).map((g) => g.title),
      ecoLogsLast7Days: (await db.get(`SELECT COUNT(*) c FROM eco_logs WHERE owner_id = ? AND logged_at >= ?`, [userId, weekAgo])).c,
      familyCount: (await getUserFamilyIds(userId)).length,
    };
    const result = await ai.weeklyReview(context);
    res.json(result);
  })
);

// --- Assistant chat with context selection (spec §22-23) --------------------
async function buildContext(userId, message) {
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
    tasks: (await db.get(`SELECT COUNT(*) c FROM tasks WHERE owner_id = ? AND status NOT IN ('completed','cancelled')`, [userId])).c,
    bills: (await db.get(`SELECT COUNT(*) c FROM bills WHERE owner_id = ? AND status = 'unpaid'`, [userId])).c,
  };

  if (wantsSchedule || Object.keys(context).length <= 2) {
    context.upcomingTasks = await db
      .all(
        `SELECT t.title, t.due_date, t.priority, t.status FROM tasks t WHERE t.owner_id = ? AND ${taskAccessSql('t', userId)} AND t.status NOT IN ('completed','cancelled') AND (t.due_date IS NULL OR t.due_date >= ?) ORDER BY t.due_date ASC LIMIT 12`,
        [userId, today]
      );
  }
  if (wantsBills) {
    context.bills = await db.all(`SELECT name, amount, currency, due_date, status FROM bills WHERE owner_id = ? AND status = 'unpaid' ORDER BY due_date ASC LIMIT 12`, [userId]);
  }
  if (wantsFamily) {
    const familyIds = await getUserFamilyIds(userId);
    if (familyIds.length) {
      const placeholders = familyIds.map(() => '?').join(',');
      context.familyTasks = await db.all(
        `SELECT title, due_date, status FROM tasks WHERE visibility='family' AND family_id IN (${placeholders}) AND status NOT IN ('completed','cancelled') LIMIT 10`,
        familyIds
      );
    }
  }
  if (wantsGoals) {
    context.goals = await db.all(`SELECT title, progress, target_date FROM goals WHERE owner_id = ? AND status = 'active' LIMIT 8`, [userId]);
  }
  return context;
}

router.get(
  '/chat/history',
  asyncRoute(async (req, res) => {
    let conv = await db.get('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.id]);
    if (!conv) return res.json({ conversationId: null, messages: [] });
    // Message-window fix (Daily Product Quality phase): same bug as
    // src/routes/chat.js's family messages endpoint, found by the same
    // investigation — `ORDER BY created_at ASC LIMIT 40` always returned the
    // OLDEST 40 messages of the conversation, so once a conversation passed
    // 40 messages, ChatTab.jsx's one-time history fetch on mount (every time
    // the Assistant page is opened) would show only the stale start of the
    // conversation and never the recent turns. Fixed the same way: take the
    // most recent 40 by ordering newest-first, then reverse for chronological
    // display. This file already establishes that exact DESC-then-reverse
    // idiom a few lines below for the AI context window (`.../chat` POST
    // handler's `history` query) — matched here for consistency rather than
    // introducing a second technique (e.g. a SQL subquery) for the same
    // problem.
    const messages = (await db.all('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC, id DESC LIMIT 40', [conv.id])).reverse();
    res.json({ conversationId: conv.id, messages: messages.map((m) => ({ role: m.role, content: m.content, createdAt: m.created_at })) });
  })
);

router.post(
  '/chat',
  asyncRoute(async (req, res) => {
    const message = req.body && req.body.message;
    if (!isNonEmpty(message)) throw new ValidationError('Message cannot be empty.');
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);

    let conv = await db.get('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.id]);
    if (!conv) {
      const result = await db.run('INSERT INTO ai_conversations (user_id, title) VALUES (?, ?)', [req.user.id, message.slice(0, 60)]);
      conv = await db.get('SELECT * FROM ai_conversations WHERE id = ?', [result.lastInsertRowid]);
    }

    // Keep only a short recent history to control token usage (spec §23).
    const history = (await db
      .all('SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 6', [conv.id]))
      .reverse();

    const context = await buildContext(req.user.id, message);
    const result = await ai.assistantChat({ message, context, history });

    await db.run("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'user', ?)", [conv.id, message]);
    if (result.ok) {
      await db.run("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conv.id, result.data.reply]);
    }
    await db.run("UPDATE ai_conversations SET updated_at = datetime('now') WHERE id = ?", [conv.id]);

    res.json(result);
  })
);

module.exports = router;
