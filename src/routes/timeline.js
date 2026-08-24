const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { getUserFamilyIds } = require('../lib/family');

const router = express.Router();

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const familyIds = getUserFamilyIds(req.user.id);
    let rows;
    if (familyIds.length) {
      const placeholders = familyIds.map(() => '?').join(',');
      rows = db.all(
        `SELECT a.*, u.first_name, u.last_name FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
         WHERE a.user_id = ? OR a.family_id IN (${placeholders})
         ORDER BY a.created_at DESC LIMIT 150`,
        [req.user.id, ...familyIds]
      );
    } else {
      rows = db.all(
        `SELECT a.*, u.first_name, u.last_name FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
         WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 150`,
        [req.user.id]
      );
    }
    res.json({
      activity: rows.map((r) => ({
        id: r.id,
        type: r.type,
        summary: r.summary,
        link: r.link,
        createdAt: r.created_at,
        actorName: r.first_name ? `${r.first_name} ${r.last_name}` : null,
      })),
    });
  })
);

module.exports = router;
