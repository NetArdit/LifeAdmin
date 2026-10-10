const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { showsLinkedTaskSql } = require('../lib/linkedTaskFilter');

const router = express.Router();

function mapNotif(n) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: !!n.read_at,
    createdAt: n.created_at,
  };
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    // History is never deleted; rows that link to a task the reader can no longer
    // access are simply not returned (and not counted). See lib/linkedTaskFilter.js.
    const shows = showsLinkedTaskSql('n.link', req.user.id);
    const rows = db.all(
      `SELECT n.* FROM notifications n WHERE n.user_id = ? AND ${shows} ORDER BY n.created_at DESC LIMIT 100`,
      [req.user.id]
    );
    const unread = db.get(
      `SELECT COUNT(*) c FROM notifications n WHERE n.user_id = ? AND n.read_at IS NULL AND ${shows}`,
      [req.user.id]
    );
    res.json({ notifications: rows.map(mapNotif), unreadCount: unread.c });
  })
);

router.post(
  '/:id/read',
  asyncRoute(async (req, res) => {
    db.run("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user.id,
    ]);
    res.json({ ok: true });
  })
);

router.post(
  '/read-all',
  asyncRoute(async (req, res) => {
    db.run("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL", [req.user.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
