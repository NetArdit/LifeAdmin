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

function setSessionCookie(res, session) {
  res.cookie(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    expires: session.expires,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

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
  publicUser,
  safeJson,
};
