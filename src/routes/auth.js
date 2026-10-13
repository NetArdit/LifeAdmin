const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isEmail, isPhone, normalizePhone, isNonEmpty, ValidationError } = require('../lib/validate');
const {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  deleteSessionsForUser,
  findValidResetToken,
  DUMMY_PASSWORD_HASH,
  publicUser,
  SESSION_COOKIE,
} = require('../lib/auth');
const { requestPasswordReset } = require('../lib/passwordReset');
const { limits, tooMany } = require('../lib/authLimits');

const router = express.Router();

const RESET_INVALID_MESSAGE = 'This reset link is invalid, has expired, or was already used. Please request a new one.';
const FORGOT_GENERIC_MESSAGE = "If an account exists for that email, we've sent password reset instructions.";

router.post(
  '/signup',
  asyncRoute(async (req, res) => {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body || {};
    const fields = {};
    if (!isNonEmpty(firstName)) fields.firstName = 'First name is required.';
    if (!isNonEmpty(lastName)) fields.lastName = 'Last name is required.';
    if (!isEmail(email)) fields.email = 'A valid email is required.';
    if (!isPhone(phone)) fields.phone = 'A valid phone number is required.';
    if (!isNonEmpty(password) || password.length < 8) fields.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) fields.confirmPassword = 'Passwords do not match.';
    if (Object.keys(fields).length) throw new ValidationError('Please fix the highlighted fields.', fields);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    const existing = await db.get('SELECT id FROM users WHERE email = ? OR phone = ?', [normalizedEmail, normalizedPhone]);
    if (existing) {
      throw new ValidationError('An account with this email or phone already exists.', {
        email: 'Already in use',
      });
    }

    const hash = await hashPassword(password);
    const result = await db.run(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [firstName.trim(), lastName.trim(), normalizedEmail, normalizedPhone, hash]
    );

    const session = await createSession(result.lastInsertRowid);
    setSessionCookie(res, session);

    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncRoute(async (req, res) => {
    const { identifier, password } = req.body || {};
    if (!isNonEmpty(identifier) || !isNonEmpty(password)) {
      throw new ValidationError('Email/phone and password are required.');
    }
    const idNorm = isEmail(identifier) ? identifier.trim().toLowerCase() : normalizePhone(identifier);
    const limitKey = `${req.ip}|${idNorm}`;
    if (await limits.loginFail.isLimited(limitKey)) return await tooMany(res, limits.loginFail, limitKey);

    const user = await db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [idNorm, idNorm]);
    // Always run one bcrypt comparison (against a dummy hash when the account
    // doesn't exist) so an unknown identifier isn't distinguishable by timing.
    const valid = await verifyPassword(password, user ? user.password_hash : DUMMY_PASSWORD_HASH);
    if (!user || !valid) {
      await limits.loginFail.consume(limitKey);
      throw new ValidationError('Invalid credentials.');
    }
    await limits.loginFail.reset(limitKey);

    const session = await createSession(user.id);
    setSessionCookie(res, session);
    res.json({ user: publicUser(user) });
  })
);

// --- Forgot / reset password (Phase 8.2) --------------------------------------
// Always the same generic answer, whether or not the account exists. The
// reset token is emailed (see lib/mailer.js — there is no production
// provider yet); it is NEVER returned in this response.
router.post(
  '/forgot-password',
  asyncRoute(async (req, res) => {
    const email = req.body && req.body.email;
    if (!isEmail(email)) throw new ValidationError('Enter a valid email address.', { email: 'Enter a valid email address.' });
    const norm = email.trim().toLowerCase();

    const emailKey = `${req.ip}|${norm}`;
    const overEmail = await limits.forgotEmail.consume(emailKey);
    const overIp = await limits.forgotIp.consume(req.ip);
    if (overEmail) return await tooMany(res, limits.forgotEmail, emailKey);
    if (overIp) return await tooMany(res, limits.forgotIp, req.ip);

    // Token creation, URL, template and delivery live in lib/passwordReset.js;
    // it never throws and reveals nothing about existence or delivery.
    await requestPasswordReset(norm);
    res.json({ ok: true, message: FORGOT_GENERIC_MESSAGE });
  })
);

// Lets the reset page show an invalid/expired state immediately, before the
// user types a new password.
router.post(
  '/reset-password/check',
  asyncRoute(async (req, res) => {
    if (await limits.reset.consume(req.ip)) return await tooMany(res, limits.reset, req.ip);
    const row = await findValidResetToken(req.body && req.body.token);
    if (!row) throw new ValidationError(RESET_INVALID_MESSAGE);
    res.json({ ok: true });
  })
);

router.post(
  '/reset-password',
  asyncRoute(async (req, res) => {
    if (await limits.reset.consume(req.ip)) return await tooMany(res, limits.reset, req.ip);
    const { token, password, confirmPassword } = req.body || {};

    const fields = {};
    if (!isNonEmpty(password) || password.length < 8) fields.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) fields.confirmPassword = 'Passwords do not match.';
    if (Object.keys(fields).length) throw new ValidationError('Please fix the highlighted fields.', fields);

    const row = await findValidResetToken(token);
    if (!row) throw new ValidationError(RESET_INVALID_MESSAGE);

    const hash = await hashPassword(password);
    await db.tx(async () => {
      // Re-check inside the transaction: the token may have been used by a
      // concurrent request while the password was being hashed.
      const fresh = await db.get('SELECT used_at FROM password_reset_tokens WHERE id = ?', [row.id]);
      if (!fresh || fresh.used_at) throw new ValidationError(RESET_INVALID_MESSAGE);
      const now = Date.now();
      await db.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [hash, row.user_id]);
      await db.run('UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL', [now, row.user_id]);
      await deleteSessionsForUser(row.user_id);
    });
    clearSessionCookie(res);
    res.json({ ok: true });
  })
);

router.post('/logout', async (req, res) => {
  const sid = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  if (sid) await destroySession(sid);
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// --- Phone/Email verification (DEMO MODE) ---------------------------------
// A real deployment needs an external SMS provider (e.g. Twilio) and a
// transactional email provider. Neither is wired up here (spec §4/§7/§43):
// this generates and stores a real OTP server-side, but instead of sending
// it, returns it directly in the API response with demoMode:true so the
// verification FLOW can be tested end-to-end locally, for free, without
// ever claiming a message was actually delivered.
async function issueOtp(userId, channel) {
  const code = String(crypto.randomInt(100000, 999999));
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.run(
    `INSERT INTO otp_codes (user_id, channel, code, purpose, expires_at) VALUES (?, ?, ?, 'verify', ?)`,
    [userId, channel, code, expires]
  );
  return code;
}

router.post(
  '/verify/:channel/request',
  asyncRoute(async (req, res) => {
    const { channel } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
    if (!['phone', 'email'].includes(channel)) throw new ValidationError('Invalid channel.');

    const code = await issueOtp(req.user.id, channel);
    res.json({
      ok: true,
      demoMode: true,
      message:
        channel === 'phone'
          ? 'Real SMS verification requires an external SMS provider. Demo mode: use the code shown below.'
          : 'Real email delivery requires an external email provider. Demo mode: use the code shown below.',
      demoCode: code,
      expiresInMinutes: 10,
    });
  })
);

router.post(
  '/verify/:channel/confirm',
  asyncRoute(async (req, res) => {
    const { channel } = req.params;
    const { code } = req.body || {};
    if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
    if (!['phone', 'email'].includes(channel)) throw new ValidationError('Invalid channel.');
    if (!isNonEmpty(code)) throw new ValidationError('Enter the code.');

    const otpKey = `otp|${req.user.id}`;
    if (await limits.otpConfirm.isLimited(otpKey)) return await tooMany(res, limits.otpConfirm, otpKey);

    const otp = await db.get(
      // expires_at is stored as an ISO-8601 string (toISOString), so compare
      // against an ISO string too — comparing to SQLite's datetime('now')
      // ("YYYY-MM-DD HH:MM:SS") mis-orders same-day values ('T' > ' ') and
      // let codes stay valid until the next calendar day.
      `SELECT * FROM otp_codes WHERE user_id = ? AND channel = ? AND code = ? AND consumed_at IS NULL AND expires_at > ?
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, channel, code.trim(), new Date().toISOString()]
    );
    if (!otp) {
      await limits.otpConfirm.consume(otpKey);
      throw new ValidationError('That code is invalid or has expired.');
    }

    await db.run('UPDATE otp_codes SET consumed_at = datetime(\'now\') WHERE id = ?', [otp.id]);
    const column = channel === 'phone' ? 'phone_verified' : 'email_verified';
    await db.run(`UPDATE users SET ${column} = 1, updated_at = datetime('now') WHERE id = ?`, [req.user.id]);

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ ok: true, user: publicUser(user) });
  })
);

module.exports = router;
