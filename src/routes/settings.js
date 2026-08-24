const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, isEmail, ValidationError } = require('../lib/validate');
const { hashPassword, verifyPassword, publicUser, clearSessionCookie } = require('../lib/auth');

const router = express.Router();

router.patch(
  '/profile',
  asyncRoute(async (req, res) => {
    const { firstName, lastName } = req.body || {};
    const fields = [];
    const params = [];
    if (firstName !== undefined) {
      if (!isNonEmpty(firstName)) throw new ValidationError('First name cannot be empty.');
      fields.push('first_name = ?');
      params.push(firstName.trim());
    }
    if (lastName !== undefined) {
      if (!isNonEmpty(lastName)) throw new ValidationError('Last name cannot be empty.');
      fields.push('last_name = ?');
      params.push(lastName.trim());
    }
    if (!fields.length) return res.json({ user: publicUser(req.user) });
    fields.push("updated_at = datetime('now')");
    db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, req.user.id]);
    res.json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', [req.user.id])) });
  })
);

router.patch(
  '/preferences',
  asyncRoute(async (req, res) => {
    const { theme, language, aiEnabled, notifPrefs } = req.body || {};
    const fields = [];
    const params = [];
    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) throw new ValidationError('Invalid theme.');
      fields.push('theme = ?');
      params.push(theme);
    }
    if (language !== undefined) {
      fields.push('language = ?');
      params.push(language);
    }
    if (aiEnabled !== undefined) {
      fields.push('ai_enabled = ?');
      params.push(aiEnabled ? 1 : 0);
    }
    if (notifPrefs !== undefined) {
      fields.push('notif_prefs = ?');
      params.push(JSON.stringify(notifPrefs));
    }
    if (!fields.length) return res.json({ user: publicUser(req.user) });
    db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, req.user.id]);
    res.json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', [req.user.id])) });
  })
);

router.post(
  '/password',
  asyncRoute(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!isNonEmpty(newPassword) || newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters.');
    }
    const ok = await verifyPassword(currentPassword || '', req.user.password_hash);
    if (!ok) throw new ValidationError('Current password is incorrect.');
    const hash = await hashPassword(newPassword);
    db.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [hash, req.user.id]);
    res.json({ ok: true });
  })
);

// Full JSON export of everything the user owns (spec §36).
router.get(
  '/export',
  asyncRoute(async (req, res) => {
    const userId = req.user.id;
    const data = {
      exportedAt: new Date().toISOString(),
      user: publicUser(req.user),
      tasks: db.all('SELECT * FROM tasks WHERE owner_id = ?', [userId]),
      taskComments: db.all(
        `SELECT tc.* FROM task_comments tc JOIN tasks t ON t.id = tc.task_id WHERE t.owner_id = ?`,
        [userId]
      ),
      bills: db.all('SELECT * FROM bills WHERE owner_id = ?', [userId]),
      billPayments: db.all(
        `SELECT bp.* FROM bill_payments bp JOIN bills b ON b.id = bp.bill_id WHERE b.owner_id = ?`,
        [userId]
      ),
      decisions: db.all('SELECT * FROM decisions WHERE owner_id = ?', [userId]),
      goals: db.all('SELECT * FROM goals WHERE owner_id = ?', [userId]),
      ecoLogs: db.all('SELECT * FROM eco_logs WHERE owner_id = ?', [userId]),
      families: db.all(
        `SELECT f.* FROM families f JOIN family_members fm ON fm.family_id = f.id WHERE fm.user_id = ?`,
        [userId]
      ),
    };
    res.setHeader('Content-Disposition', 'attachment; filename="lifeadmin-export.json"');
    res.json(data);
  })
);

// Full local account deletion (spec §37). Cascades via FK constraints.
router.delete(
  '/account',
  asyncRoute(async (req, res) => {
    const { password } = req.body || {};
    const ok = await verifyPassword(password || '', req.user.password_hash);
    if (!ok) throw new ValidationError('Password is incorrect.');
    db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
    clearSessionCookie(res);
    res.json({ ok: true });
  })
);

module.exports = router;
