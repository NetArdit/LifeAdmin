const express = require('express');
const { asyncRoute } = require('../middleware/errorHandler');
const { seedDemoForUser, clearDemoForUser } = require('../db/seed-demo');

const router = express.Router();

router.post(
  '/seed',
  asyncRoute(async (req, res) => {
    const result = await seedDemoForUser(req.user.id);
    res.json({ ok: true, ...result });
  })
);

router.post(
  '/clear',
  asyncRoute(async (req, res) => {
    await clearDemoForUser(req.user.id);
    res.json({ ok: true });
  })
);

module.exports = router;
