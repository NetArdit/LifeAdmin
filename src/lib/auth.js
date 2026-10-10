const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');

const SESSION_COOKIE = 'la_session';
const SESSION_TTL_DAYS = 30;

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createSession(userId) {
  const id = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  db.run('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [
    id,
    userId,
    expires.toISOString(),
  ]);
  return { id, expires };
}

function destroySession(id) {
  db.run('DELETE FROM sessions WHERE id = ?', [id]);
}

function getSessionUser(sessionId) {
  if (!sessionId) return null;
  const row = db.get(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
    [sessionId]
  );
  return row || null;
}

// `secure` is read at call time so it follows NODE_ENV (documented in
// .env.example): in production the cookie is only ever sent over HTTPS.
function cookieSecure() {
  return process.env.NODE_ENV === 'production';
}

function setSessionCookie(res, session) {
  res.cookie(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    expires: session.expires,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/', httpOnly: true, secure: cookieSecure(), sameSite: 'lax' });
}

// Removes every session of a user, optionally keeping one (the caller's
// current session). Used after a password change/reset so a stolen or
// forgotten session on another device stops working.
function deleteSessionsForUser(userId, exceptSessionId = null) {
  if (exceptSessionId) {
    db.run('DELETE FROM sessions WHERE user_id = ? AND id != ?', [userId, exceptSessionId]);
  } else {
    db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  }
}

// --- Password-reset tokens --------------------------------------------------
// The raw token (256 bits from crypto.randomBytes) exists only in the email
// link; the database stores its SHA-256 hash. SHA-256 (not bcrypt) is
// appropriate here because the input is a high-entropy random value, not a
// human-chosen password, so it can't be brute-forced from the hash.
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Creates a fresh token and supersedes (marks used) any earlier unused ones,
// so only the most recent emailed link ever works.
function createResetToken(userId) {
  const now = Date.now();
  db.run('UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL', [now, userId]);
  const raw = crypto.randomBytes(32).toString('base64url');
  db.run('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)', [
    userId,
    hashToken(raw),
    now + RESET_TOKEN_TTL_MS,
    now,
  ]);
  return raw;
}

// Marks every unused token of a user as used (e.g. after a failed delivery).
function invalidateResetTokens(userId) {
  db.run('UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL', [Date.now(), userId]);
}

// Returns the token row only if it exists, is unused, and is unexpired
// (expiry enforced server-side here, not by the client).
function findValidResetToken(raw) {
  if (typeof raw !== 'string' || raw.length < 20 || raw.length > 200) return null;
  const row = db.get('SELECT * FROM password_reset_tokens WHERE token_hash = ?', [hashToken(raw)]);
  if (!row || row.used_at || row.expires_at <= Date.now()) return null;
  return row;
}

// A real bcrypt hash of a random value, compared against when a login
// identifier doesn't match any account, so "unknown user" and "wrong
// password" take comparable time.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    phone: u.phone,
    emailVerified: !!u.email_verified,
    phoneVerified: !!u.phone_verified,
    theme: u.theme,
    language: u.language,
    aiEnabled: !!u.ai_enabled,
    notifPrefs: safeJson(u.notif_prefs, {}),
    createdAt: u.created_at,
  };
}

function safeJson(str, fallback) {
  if (str == null) return fallback; // JSON.parse(null) would otherwise silently return null, not the fallback
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

module.exports = {
  SESSION_COOKIE,
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getSessionUser,
  setSessionCookie,
  clearSessionCookie,
  deleteSessionsForUser,
  createResetToken,
  invalidateResetTokens,
  findValidResetToken,
  hashToken,
  DUMMY_PASSWORD_HASH,
  RESET_TOKEN_TTL_MS,
  publicUser,
  safeJson,
};
