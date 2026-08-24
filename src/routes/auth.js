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
  publicUser,
  SESSION_COOKIE,
} = require('../lib/auth');

const router = express.Router();

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

    const existing = db.get('SELECT id FROM users WHERE email = ? OR phone = ?', [normalizedEmail, normalizedPhone]);
    if (existing) {
      throw new ValidationError('An account with this email or phone already exists.', {
        email: 'Already in use',
      });
    }

    const hash = await hashPassword(password);
    const result = db.run(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [firstName.trim(), lastName.trim(), normalizedEmail, normalizedPhone, hash]
    );

    const session = createSession(result.lastInsertRowid);
    setSessionCookie(res, session);

    const user = db.get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
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
    const user = db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [idNorm, idNorm]);
    if (!user) throw new ValidationError('Invalid credentials.');

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new ValidationError('Invalid credentials.');

    const session = createSession(user.id);
    setSessionCookie(res, session);
    res.json({ user: publicUser(user) });
  })
);

router.post('/logout', (req, res) => {
  const sid = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  if (sid) destroySession(sid);
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
function issueOtp(userId, channel) {
  const code = String(crypto.randomInt(100000, 999999));
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.run(
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

    const code = issueOtp(req.user.id, channel);
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

    const otp = db.get(
      `SELECT * FROM otp_codes WHERE user_id = ? AND channel = ? AND code = ? AND consumed_at IS NULL AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, channel, code.trim()]
    );
    if (!otp) throw new ValidationError('That code is invalid or has expired.');

    db.run('UPDATE otp_codes SET consumed_at = datetime(\'now\') WHERE id = ?', [otp.id]);
    const column = channel === 'phone' ? 'phone_verified' : 'email_verified';
    db.run(`UPDATE users SET ${column} = 1, updated_at = datetime('now') WHERE id = ?`, [req.user.id]);

    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ ok: true, user: publicUser(user) });
  })
);

module.exports = router;
