// Reflection: a private conversation with the AI that can SUGGEST a task, a goal or a routine. See
// lib/reflection.js for the rules. Everything here belongs to the signed-in person alone (owner-only reads and
// writes; another person's id gets a 404), and no message text is written to any log.
const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { asyncRoute, txRoute } = require('../middleware/errorHandler');
const { ValidationError } = require('../lib/validate');
const { limits, tooMany } = require('../lib/authLimits');
const ai = require('../lib/ai');
const R = require('../lib/reflection');
const reminders = require('../lib/reminders');

const router = express.Router();

const MAX_MESSAGES_PER_CONVERSATION = 200;
const MAX_CONVERSATIONS = 50;
const RETRY_NOTE = 'I could not turn that into something you can save. You can ask me again, or add it yourself.';

function notFound(message) {
  const err = new ValidationError(message);
  err.status = 404;
  return err;
}

function mapProposal(p) {
  const fields = JSON.parse(p.payload);
  return { id: p.id, kind: p.kind, fields, needsInput: R.needsInput(p.kind, fields), status: p.status, createdType: p.created_type, createdId: p.created_id };
}

async function ownConversation(userId, id) {
  const conv = Number.isInteger(id) ? await db.get('SELECT * FROM reflection_conversations WHERE id = ? AND user_id = ?', [id, userId]) : null;
  if (!conv) throw notFound('Conversation not found.');
  return conv;
}

router.get(
  '/status',
  asyncRoute(async (req, res) => {
    res.json({
      configured: ai.isConfigured(),
      aiEnabled: !!req.user.ai_enabled,
      insightsEnabled: !!req.user.ai_insights_enabled,
      insightsEnabledAt: req.user.ai_insights_at || null,
      notice: R.NOTICE,
      disclosure: R.INSIGHTS_DISCLOSURE,
      maxMessageLength: R.MAX_MESSAGE,
    });
  })
);

// ---- the opt-in to a summary of the person's own data (off until they say so) -----------------------------
router.patch(
  '/insights',
  asyncRoute(async (req, res) => {
    const { enabled, acknowledged } = req.body || {};
    if (typeof enabled !== 'boolean') throw new ValidationError('Say whether to turn it on or off.');
    if (enabled && acknowledged !== true) throw new ValidationError('Please confirm that you have read what data is used and who processes it.');
    await db.run(
      enabled ? "UPDATE users SET ai_insights_enabled = 1, ai_insights_at = datetime('now') WHERE id = ?" : 'UPDATE users SET ai_insights_enabled = 0, ai_insights_at = NULL WHERE id = ?',
      [req.user.id]
    );
    res.json({ insightsEnabled: enabled });
  })
);

router.post(
  '/insights/run',
  asyncRoute(async (req, res) => {
    // The setting is read again from the database for every request: turning it off stops this at once.
    const fresh = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!fresh.ai_insights_enabled) {
      const err = new ValidationError('Insights are off. Turn them on in Reflection to use a summary of your data.');
      err.status = 403;
      throw err;
    }
    if (ai.userAiDisabled(fresh)) return res.json(ai.AI_DISABLED_BY_USER);
    const key = `insights|${fresh.id}`;
    if (await limits.reflectionInsights.consume(key)) return await tooMany(res, limits.reflectionInsights, key);
    const { facts, calculations, forModel } = await R.buildFacts(fresh);
    const answer = await ai.callStructured({
      system: R.INSIGHTS_SYSTEM,
      prompt: `<app_facts>${JSON.stringify(forModel)}</app_facts>\nApp language: ${fresh.language || 'en'}`,
      schema: R.ModelInsights,
      maxTokens: 600,
    });
    res.json({
      ok: true,
      facts,
      calculations,
      suggestions: answer.ok ? answer.data.suggestions.map((s) => String(s).slice(0, 300)) : [],
      suggestionsNote: answer.ok ? 'Suggestions are ideas from the AI, not facts about you.' : answer.error,
    });
  })
);

// ---- conversations -----------------------------------------------------------------------------------------
router.get(
  '/conversations',
  asyncRoute(async (req, res) => {
    const rows = await db.all('SELECT id, title, updated_at FROM reflection_conversations WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 50', [req.user.id]);
    res.json({ conversations: rows.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updated_at })) });
  })
);

router.get(
  '/conversations/:id',
  asyncRoute(async (req, res) => {
    const conv = await ownConversation(req.user.id, Number(req.params.id));
    const messages = await db.all('SELECT id, role, content, created_at FROM reflection_messages WHERE conversation_id = ? ORDER BY id', [conv.id]);
    const proposals = await db.all('SELECT * FROM reflection_proposals WHERE conversation_id = ? ORDER BY id', [conv.id]);
    res.json({
      conversation: { id: conv.id, title: conv.title },
      messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at })),
      proposals: proposals.map(mapProposal),
    });
  })
);

// Deleting a conversation deletes its messages and proposals with it (what was saved from a proposal stays:
// it is the person's own task, goal or routine now).
router.delete(
  '/conversations/:id',
  asyncRoute(async (req, res) => {
    const conv = await ownConversation(req.user.id, Number(req.params.id));
    await db.run('DELETE FROM reflection_conversations WHERE id = ?', [conv.id]);
    res.json({ ok: true });
  })
);

router.post(
  '/message',
  asyncRoute(async (req, res) => {
    const { conversationId, message, reviseProposalId } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) throw new ValidationError('Write a message first.');
    if (message.length > R.MAX_MESSAGE) throw new ValidationError(`Please keep a message under ${R.MAX_MESSAGE} characters.`);
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (ai.userAiDisabled(user)) return res.json(ai.AI_DISABLED_BY_USER);

    // Limits first: this costs the provider's free quota. Per person, never shared.
    const key = `reflection|${user.id}`;
    const over10 = await limits.reflectionMsg.consume(key);
    const overDay = await limits.reflectionDay.consume(key);
    if (over10) return await tooMany(res, limits.reflectionMsg, key);
    if (overDay) return await tooMany(res, limits.reflectionDay, key);

    let conv;
    if (conversationId !== undefined && conversationId !== null) {
      conv = await ownConversation(user.id, Number(conversationId));
    } else {
      const count = Number((await db.get('SELECT COUNT(*) AS c FROM reflection_conversations WHERE user_id = ?', [user.id])).c);
      if (count >= MAX_CONVERSATIONS) throw new ValidationError('You have many conversations: delete one you no longer need first.');
      const made = await db.run('INSERT INTO reflection_conversations (user_id, title) VALUES (?, ?)', [user.id, message.trim().slice(0, 50)]);
      conv = await db.get('SELECT * FROM reflection_conversations WHERE id = ?', [made.lastInsertRowid]);
    }
    const size = Number((await db.get('SELECT COUNT(*) AS c FROM reflection_messages WHERE conversation_id = ?', [conv.id])).c);
    if (size >= MAX_MESSAGES_PER_CONVERSATION) throw new ValidationError('This conversation is full: start a new one.');

    let revising = null;
    if (reviseProposalId !== undefined && reviseProposalId !== null) {
      revising = await db.get("SELECT * FROM reflection_proposals WHERE id = ? AND user_id = ? AND conversation_id = ? AND status = 'pending'", [Number(reviseProposalId), user.id, conv.id]);
      if (!revising) throw notFound('That suggestion is not open any more.');
    }

    const text = message.trim();
    await db.run("INSERT INTO reflection_messages (conversation_id, role, content) VALUES (?, 'user', ?)", [conv.id, text]);

    // Crisis: answered here, kindly and the same every time. No model is called, nothing is proposed.
    if (R.isCrisis(text)) {
      await db.run("INSERT INTO reflection_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conv.id, R.CRISIS_REPLY]);
      await db.run("UPDATE reflection_conversations SET updated_at = datetime('now') WHERE id = ?", [conv.id]);
      return res.json({ ok: true, conversationId: conv.id, reply: R.CRISIS_REPLY, crisis: true, proposal: null });
    }

    const history = (await db.all('SELECT role, content FROM reflection_messages WHERE conversation_id = ? AND id < (SELECT MAX(id) FROM reflection_messages WHERE conversation_id = ?) ORDER BY id DESC LIMIT 8', [conv.id, conv.id])).reverse();
    let factsBlock = '';
    if (user.ai_insights_enabled) factsBlock = `\n<app_facts>${JSON.stringify((await R.buildFacts(user)).forModel)}</app_facts>`;
    const revisionBlock = revising ? `\nThe person is revising this earlier suggestion; return an improved one: ${JSON.stringify({ kind: revising.kind, ...JSON.parse(revising.payload) })}` : '';
    const answer = await ai.callStructured({
      system: R.SYSTEM,
      prompt: `<history>${JSON.stringify(history.map((h) => ({ role: h.role, content: R.sanitize(h.content) })))}</history>${factsBlock}${revisionBlock}\n<user_message>${R.sanitize(text)}</user_message>`,
      schema: R.ModelAnswer,
      maxTokens: 700,
    });
    if (!answer.ok) return res.json({ ok: false, conversationId: conv.id, error: answer.error });

    const reply = String(answer.data.reply).slice(0, 2500);
    let proposal = R.normalizeProposal(answer.data.proposal);
    let note = null;
    if (answer.data.proposal && !proposal) note = RETRY_NOTE;
    let saved = null;
    await db.tx(async () => {
      await db.run("INSERT INTO reflection_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)", [conv.id, reply]);
      if (proposal) {
        // The old suggestion that was being revised is replaced; the new one starts pending, with its own key.
        if (revising) await db.run("UPDATE reflection_proposals SET status = 'superseded', decided_at = datetime('now') WHERE id = ? AND status = 'pending'", [revising.id]);
        const r = await db.run('INSERT INTO reflection_proposals (user_id, conversation_id, kind, payload, idempotency_key) VALUES (?, ?, ?, ?, ?)', [
          user.id,
          conv.id,
          proposal.kind,
          JSON.stringify(proposal.fields),
          crypto.randomUUID(),
        ]);
        saved = await db.get('SELECT * FROM reflection_proposals WHERE id = ?', [r.lastInsertRowid]);
      }
      await db.run("UPDATE reflection_conversations SET updated_at = datetime('now') WHERE id = ?", [conv.id]);
    });
    res.json({ ok: true, conversationId: conv.id, reply, proposal: saved ? mapProposal(saved) : null, note });
  })
);

// ---- accepting, rejecting ---------------------------------------------------------------------------------
async function ownProposal(userId, id) {
  const p = Number.isInteger(id) ? await db.get('SELECT * FROM reflection_proposals WHERE id = ? AND user_id = ?', [id, userId]) : null;
  if (!p) throw notFound('Suggestion not found.');
  return p;
}

// The record is made from the PERSON'S (possibly edited) fields, checked again here; whatever the model said or
// the page sent beyond the allowed fields is refused. The same tables and planners as the rest of the app.
async function createRecord(userId, kind, f) {
  if (kind === 'task') {
    const r = await db.run(
      `INSERT INTO tasks (owner_id, visibility, title, description, category, status, priority, due_date, notes) VALUES (?, 'private', ?, ?, 'general', 'todo', ?, ?, ?)`,
      [userId, f.title, f.description, f.priority, f.dueDate, 'Added from Reflection after you accepted it']
    );
    await reminders.replanTask(r.lastInsertRowid);
    return { type: 'task', id: r.lastInsertRowid };
  }
  if (kind === 'goal') {
    const r = await db.run('INSERT INTO goals (owner_id, title, description, category, target_date) VALUES (?, ?, ?, ?, ?)', [userId, f.title, f.description, f.category, f.targetDate]);
    await reminders.replanGoal(r.lastInsertRowid);
    return { type: 'goal', id: r.lastInsertRowid };
  }
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  const count = Number((await db.get('SELECT COUNT(*) AS c FROM routines WHERE owner_id = ?', [userId])).c);
  if (count >= 30) throw new ValidationError('You can keep up to 30 routines.');
  const r = await db.run(
    'INSERT INTO routines (owner_id, title, details, kind, time_of_day, days_of_week, timezone, follow_profile_zone) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [userId, f.title, f.details, f.kind, f.time, JSON.stringify(f.days), reminders.zoneOf(user)]
  );
  await reminders.replanRoutine(r.lastInsertRowid);
  return { type: 'routine', id: r.lastInsertRowid };
}

router.post(
  '/proposals/:id/accept',
  txRoute(async (req, res) => {
    const p = await ownProposal(req.user.id, Number(req.params.id));
    // Pressed twice, or retried: the record already made is answered, never a second one.
    if (p.status === 'accepted') return res.json({ ok: true, alreadyAccepted: true, created: { type: p.created_type, id: p.created_id } });
    if (p.status !== 'pending') throw new ValidationError('This suggestion was already answered.');
    const edited = req.body && req.body.fields !== undefined ? req.body.fields : JSON.parse(p.payload);
    const checked = R.validateFields(p.kind, edited, { allowDate: true });
    if (!checked.ok) throw new ValidationError('Please fix the highlighted fields.', checked.errors);
    // One statement decides who is first: the other press finds it no longer pending.
    const claimed = await db.get("UPDATE reflection_proposals SET status = 'accepted', decided_at = datetime('now') WHERE id = ? AND user_id = ? AND status = 'pending' RETURNING id", [p.id, req.user.id]);
    if (!claimed) {
      const now = await ownProposal(req.user.id, p.id);
      if (now.status === 'accepted') return res.json({ ok: true, alreadyAccepted: true, created: { type: now.created_type, id: now.created_id } });
      throw new ValidationError('This suggestion was already answered.');
    }
    const created = await createRecord(req.user.id, p.kind, checked.fields);
    await db.run('UPDATE reflection_proposals SET created_type = ?, created_id = ?, payload = ? WHERE id = ?', [created.type, created.id, JSON.stringify(checked.fields), p.id]);
    res.status(201).json({ ok: true, created });
  })
);

router.post(
  '/proposals/:id/reject',
  asyncRoute(async (req, res) => {
    const p = await ownProposal(req.user.id, Number(req.params.id));
    if (p.status === 'accepted') throw new ValidationError('This was already saved. Delete it where it was saved if you do not want it.');
    await db.run("UPDATE reflection_proposals SET status = 'rejected', decided_at = datetime('now') WHERE id = ? AND status = 'pending'", [p.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
