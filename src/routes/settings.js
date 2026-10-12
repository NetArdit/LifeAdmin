const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { hashPassword, verifyPassword, publicUser, clearSessionCookie, deleteSessionsForUser } = require('../lib/auth');
const { taskAccessSql } = require('../lib/taskAccess');

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
    await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, req.user.id]);
    res.json({ user: publicUser(await db.get('SELECT * FROM users WHERE id = ?', [req.user.id])) });
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
    await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, req.user.id]);
    res.json({ user: publicUser(await db.get('SELECT * FROM users WHERE id = ?', [req.user.id])) });
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
    await db.run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [hash, req.user.id]);
    // Sign out every OTHER device/session; the one making this change stays
    // signed in (Phase 8.2 — previously all older sessions kept working).
    await deleteSessionsForUser(req.user.id, req.sessionId);
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
      // Family tasks the user shared and has since left are no longer theirs to read.
      tasks: await db.all(`SELECT * FROM tasks t WHERE t.owner_id = ? AND ${taskAccessSql('t', userId)}`, [userId]),
      taskComments: await db.all(
        `SELECT tc.* FROM task_comments tc JOIN tasks t ON t.id = tc.task_id WHERE t.owner_id = ? AND ${taskAccessSql('t', userId)}`,
        [userId]
      ),
      bills: await db.all('SELECT * FROM bills WHERE owner_id = ?', [userId]),
      billPayments: await db.all(
        `SELECT bp.* FROM bill_payments bp JOIN bills b ON b.id = bp.bill_id WHERE b.owner_id = ?`,
        [userId]
      ),
      decisions: await db.all('SELECT * FROM decisions WHERE owner_id = ?', [userId]),
      goals: await db.all('SELECT * FROM goals WHERE owner_id = ?', [userId]),
      ecoLogs: await db.all('SELECT * FROM eco_logs WHERE owner_id = ?', [userId]),
      // The invite code is an owner-controlled credential: only a family's owner gets it.
      families: (await db
        .all(
          `SELECT f.*, fm.role AS my_role FROM families f JOIN family_members fm ON fm.family_id = f.id WHERE fm.user_id = ?`,
          [userId]
        ))
        .map(({ my_role: role, ...f }) => {
          if (!(role === 'owner' && f.owner_id === userId)) delete f.invite_code;
          return f;
        }),
    };
    res.setHeader('Content-Disposition', 'attachment; filename="lifeadmin-export.json"');
    res.json(data);
  })
);

// Full local account deletion (spec §37). Cascades via FK constraints —
// except families.owner_id, which has no ON DELETE behavior, so deleting a
// user who still owns a family would otherwise crash with a raw FK
// constraint error (found via Phase 2.5 browser verification; previously
// unreachable in practice because the confirmDialog bug fixed in Phase 2
// always blocked this request from ever being sent). Cascading the delete
// onto the family isn't safe to do silently — it would wipe shared data
// (tasks, chat, shopping list) for every other member with no warning —
// so this is a clear, actionable error instead of an attempted delete.
// A real ownership-transfer flow is a product decision for a later phase.
router.delete(
  '/account',
  asyncRoute(async (req, res) => {
    const { password } = req.body || {};
    const ok = await verifyPassword(password || '', req.user.password_hash);
    if (!ok) throw new ValidationError('Password is incorrect.');

    const ownedFamilies = await db.all('SELECT id FROM families WHERE owner_id = ?', [req.user.id]);
    if (ownedFamilies.length) {
      // Still blocked (deleting shared data or silently choosing a new owner
      // are not options). The copy names only paths that actually exist:
      // ownership transfer (Family -> Members -> Make owner) needs another
      // registered member; delete-family does not exist and is not mentioned
      // as an option.
      let hasCandidate = false;
      for (const f of ownedFamilies) {
        if (await db.get('SELECT 1 AS x FROM family_members WHERE family_id = ? AND user_id IS NOT NULL AND user_id != ?', [f.id, req.user.id])) {
          hasCandidate = true;
          break;
        }
      }
      throw new ValidationError(
        hasCandidate
          ? "You own a circle, so this account can't be deleted yet. Transfer ownership to another member first (Circle → Members → Make owner), then try again."
          : "You own a circle and are its only registered member, so this account can't be deleted yet. Ask someone to join with the invite code, transfer ownership to them, then try again. Deleting a circle isn't available in LifeAdmin yet."
      );
    }

    await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
    clearSessionCookie(res);
    res.json({ ok: true });
  })
);

module.exports = router;
