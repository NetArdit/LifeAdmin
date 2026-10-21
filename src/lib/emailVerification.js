// Email ownership: a link sent to the address, whose token is bound to that address. Whether an account's
// email is verified is decided here and nowhere else: users.email_verified is only ever set by confirm()
// (or by the Google sign-in, which carries Google's own proof; see googleAuth.js).
const crypto = require('crypto');
const db = require('../db');
const { hashToken } = require('./auth');
const { sendMail } = require('./mailer');
const { resetBaseUrl } = require('./passwordReset');

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildVerifyEmail({ link, hours }) {
  const subject = 'Confirm your email for LifeAdmin';
  const text =
    `LifeAdmin\n\nConfirm that this email address is yours (the link expires in ${hours} hours):\n${link}\n\n` +
    `If you did not create a LifeAdmin account, ignore this email: nothing will happen.`;
  const safe = escapeHtml(link);
  const html =
    `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1917;line-height:1.5">` +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px;color:#2f4d82">LifeAdmin</p>` +
    `<p style="margin:0 0 16px">Confirm that this email address is yours.</p>` +
    `<p style="margin:0 0 24px"><a href="${safe}" style="display:inline-block;background:#2f4d82;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Confirm my email</a></p>` +
    `<p style="margin:0 0 8px;font-size:14px">The link expires in ${hours} hours.</p>` +
    `<p style="margin:0 0 16px;font-size:14px;color:#57534e">If the button does not work, copy this address into your browser:<br><span style="word-break:break-all">${safe}</span></p>` +
    `<p style="margin:0;font-size:13px;color:#57534e">If you did not create a LifeAdmin account, ignore this email: nothing will happen.</p></div>`;
  return { subject, text, html };
}

function buildExistingAccountEmail({ base }) {
  const subject = 'Someone used your email to sign up for LifeAdmin';
  const text =
    `LifeAdmin\n\nSomeone tried to create an account with this email address, but it already has one.\n` +
    `If it was you, sign in at ${base || 'the LifeAdmin site'} or use "Forgot password" there.\nIf it was not you, ignore this email: nothing changed.`;
  return { subject, text };
}

/** Sends a fresh link; earlier unused links stop working. Never throws. Returns { delivered }. */
async function sendVerification(user) {
  try {
    const base = resetBaseUrl();
    if (!base) return { delivered: false };
    const now = Date.now();
    await db.run('UPDATE email_verification_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL', [now, user.id]);
    const raw = crypto.randomBytes(32).toString('base64url');
    await db.run('INSERT INTO email_verification_tokens (user_id, email, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)', [
      user.id,
      user.email,
      hashToken(raw),
      now + VERIFY_TOKEN_TTL_MS,
      now,
    ]);
    const mail = buildVerifyEmail({ link: `${base}/#/verify-email/${raw}`, hours: Math.round(VERIFY_TOKEN_TTL_MS / 3600000) });
    const result = await sendMail({ to: user.email, ...mail });
    if (!result.delivered) await db.run('UPDATE email_verification_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL', [Date.now(), user.id]);
    return { delivered: !!result.delivered };
  } catch {
    return { delivered: false };
  }
}

/** The mail to a person who "signed up" with an address that already has an account. Never throws. */
async function sendExistingAccountNotice(email) {
  try {
    await sendMail({ to: email, ...buildExistingAccountEmail({ base: resetBaseUrl() }) });
  } catch {}
}

/**
 * Confirms the address the token was sent to. Outcomes: 'verified', 'already' (the same link used again, or the
 * address was verified another way) or 'invalid' (unknown, expired, or the account's email has changed since).
 */
async function confirm(raw) {
  if (typeof raw !== 'string' || raw.length < 20 || raw.length > 200) return { status: 'invalid' };
  const row = await db.get('SELECT * FROM email_verification_tokens WHERE token_hash = ?', [hashToken(raw)]);
  if (!row) return { status: 'invalid' };
  const user = await db.get('SELECT id, email, email_verified FROM users WHERE id = ?', [row.user_id]);
  if (!user || user.email !== row.email) return { status: 'invalid' };
  if (row.used_at) return user.email_verified ? { status: 'already' } : { status: 'invalid' };
  if (Number(row.expires_at) <= Date.now()) return { status: 'invalid' };
  await db.tx(async () => {
    await db.run('UPDATE email_verification_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL', [Date.now(), user.id]);
    await db.run("UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?", [user.id]);
  });
  return { status: 'verified' };
}

module.exports = { sendVerification, sendExistingAccountNotice, confirm, buildVerifyEmail, VERIFY_TOKEN_TTL_MS };
