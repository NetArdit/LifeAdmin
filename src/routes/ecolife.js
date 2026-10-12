const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const ai = require('../lib/ai');

const router = express.Router();

const CATEGORIES = ['transport', 'energy', 'food', 'shopping', 'waste', 'water'];

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const rows = await db.all('SELECT * FROM eco_logs WHERE owner_id = ? ORDER BY logged_at DESC LIMIT 100', [req.user.id]);
    res.json({ logs: rows });
  })
);

// Deterministic rollups per category over the last 30 days — no AI (spec §18).
router.get(
  '/summary',
  asyncRoute(async (req, res) => {
    const rows = await db.all(
      `SELECT * FROM eco_logs WHERE owner_id = ? AND logged_at >= datetime('now', '-30 days')`,
      [req.user.id]
    );
    const byCategory = {};
    for (const cat of CATEGORIES) byCategory[cat] = { count: 0, totalQuantity: 0, unit: null };
    for (const r of rows) {
      const c = byCategory[r.category];
      if (!c) continue;
      c.count += 1;
      c.totalQuantity += r.quantity || 0;
      c.unit = r.unit || c.unit;
    }
    res.json({ summary: byCategory, totalLogs: rows.length });
  })
);

router.post(
  '/tips',
  asyncRoute(async (req, res) => {
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);
    const rows = await db.all(
      `SELECT category, action, quantity, unit FROM eco_logs WHERE owner_id = ? AND logged_at >= datetime('now', '-30 days') LIMIT 60`,
      [req.user.id]
    );
    const result = await ai.ecoTips({ recentLogs: rows });
    res.json(result);
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const b = req.body || {};
    if (!CATEGORIES.includes(b.category)) throw new ValidationError('Invalid category.');
    if (!isNonEmpty(b.action)) throw new ValidationError('Describe the action.');
    const result = await db.run(
      'INSERT INTO eco_logs (owner_id, category, action, quantity, unit, notes) VALUES (?,?,?,?,?,?)',
      [req.user.id, b.category, b.action.trim(), b.quantity ?? null, b.unit || null, b.notes || null]
    );
    res.status(201).json({ log: await db.get('SELECT * FROM eco_logs WHERE id = ?', [result.lastInsertRowid]) });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const row = await db.get('SELECT * FROM eco_logs WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ error: 'Log not found.' });
    await db.run('DELETE FROM eco_logs WHERE id = ?', [row.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
