const express = require('express');
const { asyncRoute } = require('../middleware/errorHandler');
const push = require('../lib/push');
const { createLimiter } = require('../lib/ratelimit');

const router = express.Router();

// A person presses "send a test" a few times, not a hundred.
const testLimit = createLimiter({ windowMs: 60 * 1000, max: 5 });
const subscribeLimit = createLimiter({ windowMs: 10 * 60 * 1000, max: 30 });

// These requests change what a device receives. The session cookie is SameSite=Lax and the body is JSON,
// which already keeps another site's form out; on top of that, a browser that says where the request comes
// from must say "from this site".
function sameSite(req, res, next) {
  const origin = req.get('origin');
  if (!origin) return next();
  let host = null;
  try {
    host = new URL(origin).host;
  } catch {}
  const allowed = [req.get('host')];
  try {
    if (process.env.APP_BASE_URL) allowed.push(new URL(process.env.APP_BASE_URL).host);
  } catch {}
  if (!host || !allowed.includes(host)) return res.status(403).json({ error: 'This request did not come from LifeAdmin.' });
  next();
}

router.get(
  '/status',
  asyncRoute(async (req, res) => {
    const cfg = push.config();
    res.json({ configured: cfg.configured, publicKey: cfg.configured ? cfg.publicKey : null, ...(await push.statusFor(req.user.id, req.sessionId)) });
  })
);

router.post(
  '/subscription',
  sameSite,
  asyncRoute(async (req, res) => {
    if (!push.config().configured) return res.status(503).json({ error: 'Notifications are not set up on this server yet.' });
    if (subscribeLimit.consume(`sub|${req.user.id}`)) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    await push.saveSubscription(req.user.id, req.sessionId, req.body);
    res.status(201).json({ ok: true, ...(await push.statusFor(req.user.id, req.sessionId)) });
  })
);

router.delete(
  '/subscription',
  sameSite,
  asyncRoute(async (req, res) => {
    await push.removeForSession(req.user.id, req.sessionId);
    res.json({ ok: true, ...(await push.statusFor(req.user.id, req.sessionId)) });
  })
);

// One generic notification to the device that asks, so that its owner sees that it arrives.
router.post(
  '/test',
  sameSite,
  asyncRoute(async (req, res) => {
    if (!push.config().configured) return res.status(503).json({ error: 'Notifications are not set up on this server yet.' });
    if (testLimit.consume(`test|${req.user.id}`)) return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
    const counts = await push.sendToUser(req.user.id, { kind: 'test', path: '/#/settings', tag: 'test' }, { sessionId: req.sessionId, ttl: 60, urgency: 'high' });
    if (!counts.sent && !counts.gone && !counts.failed) return res.status(409).json({ error: 'Notifications are not turned on in this browser.' });
    res.json({ ok: counts.sent > 0, ...counts });
  })
);

module.exports = router;
