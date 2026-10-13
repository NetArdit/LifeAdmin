const express = require('express');
const { asyncRoute } = require('../middleware/errorHandler');
const push = require('../lib/push');
const { createLimiter } = require('../lib/ratelimit');

const router = express.Router();

// A person presses "send a test" a few times, not a hundred.
const testLimit = createLimiter({ name: 'pushTest', windowMs: 60 * 1000, max: 5 });
const subscribeLimit = createLimiter({ name: 'pushSubscribe', windowMs: 10 * 60 * 1000, max: 30 });

// That these requests come from this site's own pages is checked for the whole API (middleware/sameOrigin).

router.get(
  '/status',
  asyncRoute(async (req, res) => {
    const cfg = push.config();
    res.json({ configured: cfg.configured, publicKey: cfg.configured ? cfg.publicKey : null, ...(await push.statusFor(req.user.id, req.sessionId)) });
  })
);

router.post(
  '/subscription',
  asyncRoute(async (req, res) => {
    if (!push.config().configured) return res.status(503).json({ error: 'Notifications are not set up on this server yet.' });
    if (await subscribeLimit.consume(`sub|${req.user.id}`)) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    await push.saveSubscription(req.user.id, req.sessionId, req.body);
    res.status(201).json({ ok: true, ...(await push.statusFor(req.user.id, req.sessionId)) });
  })
);

router.delete(
  '/subscription',
  asyncRoute(async (req, res) => {
    await push.removeForSession(req.user.id, req.sessionId);
    res.json({ ok: true, ...(await push.statusFor(req.user.id, req.sessionId)) });
  })
);

// One generic notification to the device that asks, so that its owner sees that it arrives.
router.post(
  '/test',
  asyncRoute(async (req, res) => {
    if (!push.config().configured) return res.status(503).json({ error: 'Notifications are not set up on this server yet.' });
    if (await testLimit.consume(`test|${req.user.id}`)) return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
    const counts = await push.sendToUser(req.user.id, { kind: 'test', path: '/#/settings', tag: 'test' }, { sessionId: req.sessionId, ttl: 60, urgency: 'high' });
    if (!counts.sent && !counts.gone && !counts.failed) return res.status(409).json({ error: 'Notifications are not turned on in this browser.' });
    res.json({ ok: counts.sent > 0, ...counts });
  })
);

module.exports = router;
