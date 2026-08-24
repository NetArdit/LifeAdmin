const { SESSION_COOKIE, getSessionUser } = require('../lib/auth');

// Attaches req.user (raw DB row) if a valid session cookie is present.
function attachUser(req, res, next) {
  const sid = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  req.sessionId = sid || null;
  req.user = sid ? getSessionUser(sid) : null;
  next();
}

// Blocks the request unless authenticated. Use on all /api/* routes except auth.
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  next();
}

module.exports = { attachUser, requireAuth };
