// Password-reset request service: token -> reset URL -> email. Routes call
// this; it calls sendMail(); provider specifics live only in lib/mailer.js.
const db = require('../db');
const { createResetToken, invalidateResetTokens, RESET_TOKEN_TTL_MS } = require('./auth');
const { sendMail } = require('./mailer');

// Origin used to build reset links. Never derived from the request's Host
// header (attacker-controllable). In production it MUST be configured and
// MUST be https; otherwise no link is built and no reset email is sent.
function resetBaseUrl() {
  const configured = (process.env.APP_BASE_URL || '').trim().replace(/\/+$/, '');
  const isProd = process.env.NODE_ENV === 'production';
  if (configured) {
    if (!/^https?:\/\/[^\s/?#]+$/.test(configured)) return null;
    if (isProd && !configured.startsWith('https://')) return null;
    return configured;
  }
  return isProd ? null : `http://localhost:${process.env.PORT || 3001}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Plain, dependency-free template: no images, no tracking pixels, no
// third-party fonts. The link is a base64url token appended to the configured
// origin, but it is escaped for the HTML attribute/text anyway.
function buildResetEmail({ link, minutes }) {
  const subject = 'Reset your LifeAdmin password';
  const text =
    `LifeAdmin\n\n` +
    `We received a request to reset the password for your LifeAdmin account.\n\n` +
    `Choose a new password here (the link works once and expires in ${minutes} minutes):\n${link}\n\n` +
    `If you didn't request this, you can safely ignore this email — your password won't change.\n` +
    `Never share this link with anyone.`;
  const safe = escapeHtml(link);
  const html =
    `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1917;line-height:1.5">` +
    `<p style="font-size:18px;font-weight:600;margin:0 0 16px;color:#2f4d82">LifeAdmin</p>` +
    `<p style="margin:0 0 16px">We received a request to reset the password for your LifeAdmin account.</p>` +
    `<p style="margin:0 0 24px"><a href="${safe}" style="display:inline-block;background:#2f4d82;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Choose a new password</a></p>` +
    `<p style="margin:0 0 8px;font-size:14px">This link works once and expires in ${minutes} minutes.</p>` +
    `<p style="margin:0 0 16px;font-size:14px;color:#57534e">If the button doesn't work, copy this address into your browser:<br><span style="word-break:break-all">${safe}</span></p>` +
    `<p style="margin:0;font-size:13px;color:#57534e">If you didn't request this, you can safely ignore this email — your password won't change. Never share this link with anyone.</p>` +
    `</div>`;
  return { subject, text, html };
}

// Always resolves; never throws and never reveals anything to the caller
// about whether the account exists or whether delivery worked (the route
// answers identically either way). A token that could not be delivered is
// invalidated so a failed send never leaves a usable, undelivered link.
async function requestPasswordReset(normalizedEmail) {
  const user = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (!user) return;
  const base = resetBaseUrl();
  if (!base) {
    console.error('[LifeAdmin] Password reset requested but APP_BASE_URL is not configured (https required in production); no email sent.');
    return;
  }
  try {
    const token = await createResetToken(user.id);
    const minutes = Math.round(RESET_TOKEN_TTL_MS / 60000);
    const mail = buildResetEmail({ link: `${base}/#/reset-password/${token}`, minutes });
    const result = await sendMail({ to: normalizedEmail, ...mail });
    if (!result.delivered) await invalidateResetTokens(user.id);
  } catch {
    await invalidateResetTokens(user.id);
    console.error('[LifeAdmin] Password reset email could not be sent.');
  }
}

module.exports = { requestPasswordReset, resetBaseUrl, buildResetEmail };
