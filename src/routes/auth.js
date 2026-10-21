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
const { sendVerification, sendExistingAccountNotice, confirm: confirmEmail } = require('../lib/emailVerification');
const { limits, tooMany } = require('../lib/authLimits');

const router = express.Router();

const RESET_INVALID_MESSAGE = 'This reset link is invalid, has expired, or was already used. Please request a new one.';
const FORGOT_GENERIC_MESSAGE = "If an account exists for that email, we've sent password reset instructions.";

// Signup answers the same way whether or not the email already has an account (the same words, the same
// status, no session), and does the same work in both cases (one password hash, one email), so that nothing
// about an address can be learned from it. A new person gets a confirmation link; the owner of an address
// that already has an account gets a notice. The phone number is optional.
const SIGNUP_MESSAGE = "Thanks. If this email is new, we've sent a link to confirm it. If it already has an account, sign in or use \"Forgot password\".";

router.post(
  '/signup',
  asyncRoute(async (req, res) => {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body || {};
    const hasPhone = isNonEmpty(phone);
    const fields = {};
    if (!isNonEmpty(firstName)) fields.firstName = 'First name is required.';
    if (!isNonEmpty(lastName)) fields.lastName = 'Last name is required.';
    if (!isEmail(email)) fields.email = 'A valid email is required.';
    if (hasPhone && !isPhone(phone)) fields.phone = 'Enter a valid phone number or leave it empty.';
    if (!isNonEmpty(password) || password.length < 8) fields.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) fields.confirmPassword = 'Passwords do not match.';
    if (Object.keys(fields).length) throw new ValidationError('Please fix the highlighted fields.', fields);

    const normalizedEmail = email.trim().toLowerCase();
    // Every attempt counts, new address or not, so the limiter cannot tell the two apart either.
    const overEmail = await limits.signupEmail.consume(normalizedEmail);
    const overIp = await limits.signupIp.consume(req.ip);
    if (overEmail) return await tooMany(res, limits.signupEmail, normalizedEmail);
    if (overIp) return await tooMany(res, limits.signupIp, req.ip);

    let normalizedPhone = hasPhone ? normalizePhone(phone) : null;
    const hash = await hashPassword(password);
    const emailTaken = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (normalizedPhone && (await db.get('SELECT id FROM users WHERE phone = ?', [normalizedPhone]))) normalizedPhone = null; // taken by someone else: kept off this account, silently

    let created = null;
    if (!emailTaken) {
      try {
        const result = await db.run(
          `INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)`,
          [firstName.trim(), lastName.trim(), normalizedEmail, normalizedPhone, hash]
        );
        created = { id: result.lastInsertRowid, email: normalizedEmail };
      } catch {
        created = null; // the same address arrived at the same moment: the other one won
      }
    }
    if (created) await sendVerification(created);
    else await sendExistingAccountNotice(normalizedEmail);
    res.status(202).json({ ok: true, message: SIGNUP_MESSAGE });
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
    // The try is counted before the password is looked at, in one statement: tries at the same instant
    // cannot all pass a check in which none of them has been counted yet. A right password clears the
    // count: somebody who mistyped a few times and then got in starts afresh, and is not locked out by one
    // more slip a minute later. (A right password arriving among wrong ones therefore clears those too;
    // whoever can send the right password has no need to guess.) Over the limit, not even a right password
    // is looked at.
    if (await limits.loginFail.consume(limitKey)) return await tooMany(res, limits.loginFail, limitKey);

    const user = await db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [idNorm, idNorm]);
    // Always run one bcrypt comparison (against a dummy hash when the account
    // doesn't exist) so an unknown identifier isn't distinguishable by timing.
    const valid = await verifyPassword(password, user ? user.password_hash : DUMMY_PASSWORD_HASH);
    if (!user || !valid) throw new ValidationError('Invalid credentials.');
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


// --- Email ownership (a link sent to the address) ---------------------------------
// The status the page shows comes from the database through the session, never from the client.
router.post(
  '/verify-email/resend',
  asyncRoute(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
    if (req.user.email_verified) return res.json({ ok: true, alreadyVerified: true });
    const key = `verify|${req.user.id}`;
    if (await limits.verifyResend.consume(key)) return await tooMany(res, limits.verifyResend, key);
    const sent = await sendVerification(req.user);
    res.json({
      ok: true,
      delivered: sent.delivered,
      message: sent.delivered ? 'We sent a new link. It works once; older links stop working.' : 'We could not send the email right now. Please try again later.',
    });
  })
);

// The link opens a page that posts the token here. Open from any browser: the token is the proof, so the
// person need not be signed in on the device where they read the email.
router.post(
  '/verify-email',
  asyncRoute(async (req, res) => {
    if (await limits.verifyConfirm.consume(req.ip)) return await tooMany(res, limits.verifyConfirm, req.ip);
    const result = await confirmEmail(req.body && req.body.token);
    if (result.status === 'invalid') {
      throw new ValidationError('This link is not valid any more: it may have expired or been replaced. Sign in and ask for a new one.');
    }
    res.json({ ok: true, alreadyVerified: result.status === 'already' });
  })
);

// --- Phone verification (DEMO MODE; email has its own link flow above) ---------------------------------
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
    if (channel === 'email') throw new ValidationError('Email is confirmed with the link we send. Use "Send confirmation link".');

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
    if (channel === 'email') throw new ValidationError('Email is confirmed with the link we send.');
    if (!isNonEmpty(code)) throw new ValidationError('Enter the code.');

    const otpKey = `otp|${req.user.id}`;
    if (await limits.otpConfirm.consume(otpKey)) return await tooMany(res, limits.otpConfirm, otpKey);

    const otp = await db.get(
      // expires_at is stored as an ISO-8601 string (toISOString), so compare
      // against an ISO string too — comparing to SQLite's datetime('now')
      // ("YYYY-MM-DD HH:MM:SS") mis-orders same-day values ('T' > ' ') and
      // let codes stay valid until the next calendar day.
      `SELECT * FROM otp_codes WHERE user_id = ? AND channel = ? AND code = ? AND consumed_at IS NULL AND expires_at > ?
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, channel, code.trim(), new Date().toISOString()]
    );
    if (!otp) throw new ValidationError('That code is invalid or has expired.');
    await limits.otpConfirm.refund(otpKey);

    await db.run('UPDATE otp_codes SET consumed_at = datetime(\'now\') WHERE id = ?', [otp.id]);
    const column = channel === 'phone' ? 'phone_verified' : 'email_verified';
    await db.run(`UPDATE users SET ${column} = 1, updated_at = datetime('now') WHERE id = ?`, [req.user.id]);

    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ ok: true, user: publicUser(user) });
  })
);

module.exports = router;
