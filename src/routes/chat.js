const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { requireMembership } = require('../lib/family');
const { notifyFamily } = require('../lib/notify');

const router = express.Router();

function mapMessage(m) {
  return {
    id: m.id,
    body: m.body,
    createdAt: m.created_at,
    authorId: m.user_id,
    authorName: `${m.first_name} ${m.last_name}`,
    reactions: JSON.parse(m.reactions_json || '[]'),
  };
}

router.get(
  '/:familyId/messages',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.familyId);
    await requireMembership(req.user.id, familyId);
    const since = req.query.since;
    // Message-window fix (Daily Product Quality phase): this used to be
    // `ORDER BY created_at ASC LIMIT 200`, which always returns the OLDEST
    // 200 messages in the family's history, not the most recent ones. For
    // any family whose total message count grows past 200 that isn't a
    // smaller window, it's a permanently stuck one — every message after
    // the 200th is inserted successfully by the POST route below but can
    // never be returned by this query again, no matter how much later it's
    // called, because the same oldest 200 rows always win the LIMIT.
    // Increasing the number would only postpone the same bug, not fix it
    // (the brief this phase is scoped to is explicit about that). The
    // actual fix is the query direction: order by newest first so LIMIT
    // keeps the most recent messages, then re-sort that page back to
    // chronological order for the reply, since every caller (ChatTab.jsx)
    // renders top-to-bottom. `id` is a secondary sort key purely for
    // determinism — created_at has only whole-second resolution, so two
    // messages sent within the same second would otherwise have no
    // guaranteed relative order.
    let sql = `SELECT m.*, u.first_name, u.last_name,
      (SELECT json_group_array(json_object('emoji', emoji, 'userId', user_id)) FROM message_reactions r WHERE r.message_id = m.id) reactions_json
      FROM messages m JOIN users u ON u.id = m.user_id WHERE m.family_id = ?`;
    const params = [familyId];
    if (since) {
      sql += ' AND m.created_at > ?';
      params.push(since);
    }
    sql += ' ORDER BY m.created_at DESC, m.id DESC LIMIT 200';
    const rows = (await db.all(sql, params)).reverse();
    res.json({ messages: rows.map(mapMessage) });
  })
);

router.post(
  '/:familyId/messages',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.familyId);
    await requireMembership(req.user.id, familyId);
    const body = req.body && req.body.body;
    if (!isNonEmpty(body)) throw new ValidationError('Message cannot be empty.');

    const result = await db.run('INSERT INTO messages (family_id, user_id, body) VALUES (?, ?, ?)', [
      familyId,
      req.user.id,
      body.trim(),
    ]);

    await notifyFamily(familyId, req.user.id, {
      type: 'chat',
      title: `${req.user.first_name} sent a message`,
      body: body.trim().slice(0, 140),
      link: '#/family/chat',
    });

    const m = await db.get(
      `SELECT m.*, u.first_name, u.last_name FROM messages m JOIN users u ON u.id = m.user_id WHERE m.id = ?`,
      [result.lastInsertRowid]
    );
    res.status(201).json({ message: { ...mapMessage(m), reactions: [] } });
  })
);

router.post(
  '/:familyId/messages/:messageId/react',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.familyId);
    await requireMembership(req.user.id, familyId);
    // Hardening 1 / F-02: authorisation follows message -> family -> membership.
    // The message must exist AND belong to the family the requester was just proven a
    // member of; anything else (unknown id, or a message of another family) is the
    // same 404, so ids of other families' messages cannot be probed.
    const messageId = Number(req.params.messageId);
    const message = Number.isInteger(messageId)
      ? await db.get('SELECT id FROM messages WHERE id = ? AND family_id = ?', [messageId, familyId])
      : null;
    if (!message) return res.status(404).json({ error: 'Message not found.' });
    const emoji = req.body && req.body.emoji;
    if (!isNonEmpty(emoji)) throw new ValidationError('Emoji is required.');
    if (emoji.trim().length > 32) throw new ValidationError('That reaction is too long.');
    await db.run(
      `INSERT OR IGNORE INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)`,
      [message.id, req.user.id, emoji.trim()]
    );
    res.status(201).json({ ok: true });
  })
);

module.exports = router;
