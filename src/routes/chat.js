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
    requireMembership(req.user.id, familyId);
    const since = req.query.since;
    let sql = `SELECT m.*, u.first_name, u.last_name,
      (SELECT json_group_array(json_object('emoji', emoji, 'userId', user_id)) FROM message_reactions r WHERE r.message_id = m.id) reactions_json
      FROM messages m JOIN users u ON u.id = m.user_id WHERE m.family_id = ?`;
    const params = [familyId];
    if (since) {
      sql += ' AND m.created_at > ?';
      params.push(since);
    }
    sql += ' ORDER BY m.created_at ASC LIMIT 200';
    const rows = db.all(sql, params);
    res.json({ messages: rows.map(mapMessage) });
  })
);

router.post(
  '/:familyId/messages',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.familyId);
    requireMembership(req.user.id, familyId);
    const body = req.body && req.body.body;
    if (!isNonEmpty(body)) throw new ValidationError('Message cannot be empty.');

    const result = db.run('INSERT INTO messages (family_id, user_id, body) VALUES (?, ?, ?)', [
      familyId,
      req.user.id,
      body.trim(),
    ]);

    notifyFamily(familyId, req.user.id, {
      type: 'chat',
      title: `${req.user.first_name} sent a message`,
      body: body.trim().slice(0, 140),
      link: '#/family/chat',
    });

    const m = db.get(
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
    requireMembership(req.user.id, familyId);
    const emoji = req.body && req.body.emoji;
    if (!isNonEmpty(emoji)) throw new ValidationError('Emoji is required.');
    db.run(
      `INSERT OR IGNORE INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)`,
      [req.params.messageId, req.user.id, emoji]
    );
    res.status(201).json({ ok: true });
  })
);

module.exports = router;
