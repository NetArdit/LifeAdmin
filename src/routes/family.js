const express = require('express');
const db = require('../db');
const { asyncRoute, txRoute } = require('../middleware/errorHandler');
const { isNonEmpty, isPhone, normalizePhone, ValidationError } = require('../lib/validate');
const {
  requireMembership,
  requireRole,
  logActivity,
  getUserFamilyIds,
  newUniqueInviteCode,
  rotateInviteCode,
  HIDE_NON_FAMILY_TASK_ACTIVITY,
} = require('../lib/family');
const { showsLinkedTaskSql } = require('../lib/linkedTaskFilter');
const { notifyUser } = require('../lib/notify');
const { limits, tooMany } = require('../lib/authLimits');

const { replanUser } = require('../lib/reminders');

const router = express.Router();

// The invite code is an owner-controlled credential (Hardening 1.5): it is included
// ONLY when the viewer is the family's owner. Ordinary members — and everyone on the
// join/transfer responses, where the viewer is not (or no longer) the owner — never
// receive it, so no route can leak it by forgetting to check. `viewerId` is required.
function mapFamily(f, members, viewerId) {
  const viewer = members.find((m) => m.user_id === viewerId);
  const out = {
    id: f.id,
    name: f.name,
    ownerId: f.owner_id,
    createdAt: f.created_at,
    members: members.map(mapMember),
  };
  if (viewer && viewer.role === 'owner' && f.owner_id === viewerId) out.inviteCode = f.invite_code;
  return out;
}

function mapMember(m) {
  return {
    id: m.id,
    userId: m.user_id,
    phone: m.phone,
    displayName: m.display_name || (m.first_name ? `${m.first_name} ${m.last_name}` : m.phone),
    role: m.role,
    joinedAt: m.joined_at,
    registered: !!m.user_id,
  };
}

async function membersFor(familyId) {
  return await db.all(
    `SELECT fm.*, u.first_name, u.last_name FROM family_members fm
     LEFT JOIN users u ON u.id = fm.user_id WHERE fm.family_id = ? ORDER BY fm.joined_at ASC`,
    [familyId]
  );
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const ids = await getUserFamilyIds(req.user.id);
    if (!ids.length) return res.json({ families: [] });
    const placeholders = ids.map(() => '?').join(',');
    const families = await db.all(`SELECT * FROM families WHERE id IN (${placeholders})`, ids);
    const out = [];
    for (const f of families) out.push(mapFamily(f, await membersFor(f.id), req.user.id));
    res.json({ families: out });
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const name = req.body && req.body.name;
    if (!isNonEmpty(name)) throw new ValidationError('Circle name is required.');

    const code = await newUniqueInviteCode();

    const result = await db.run('INSERT INTO families (name, invite_code, owner_id) VALUES (?, ?, ?)', [
      name.trim(),
      code,
      req.user.id,
    ]);
    await db.run("INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'owner')", [
      result.lastInsertRowid,
      req.user.id,
    ]);
    await logActivity({
      userId: req.user.id,
      familyId: result.lastInsertRowid,
      type: 'member_joined',
      summary: `${req.user.first_name} created the circle "${name.trim()}"`,
    });

    const f = await db.get('SELECT * FROM families WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ family: mapFamily(f, await membersFor(f.id), req.user.id) });
  })
);

// Consume an invite code (previously generated/displayed but never
// redeemable — the invite code shown in the Overview tab had no way to
// actually join a family). Claims a phone-invited placeholder row if one
// matches the joining user's phone, otherwise adds a fresh member row.
router.post(
  '/join',
  asyncRoute(async (req, res) => {
    const code = req.body && req.body.code;
    if (!isNonEmpty(code)) throw new ValidationError('Invite code is required.', { code: 'Required' });

    // Guessing defence (Hardening 1 / F-03): failed attempts are limited per user
    // AND per client IP before the code is even looked up. Behind a reverse proxy
    // without Express "trust proxy", req.ip is the proxy's address, so the IP budget
    // is shared by everyone; the per-user budget still applies to each account.
    const userKey = `join|${req.user.id}`;
    // Every try is counted before the code is looked at, in one statement each: tries at the same instant
    // cannot all pass a check in which none of them has been counted yet. A right code gives its count back.
    const overUser = await limits.joinFailUser.consume(userKey);
    const overIp = await limits.joinFailIp.consume(req.ip);
    if (overUser) return await tooMany(res, limits.joinFailUser, userKey);
    if (overIp) return await tooMany(res, limits.joinFailIp, req.ip);

    // One generic failure for unknown, mistyped and revoked (rotated) codes alike.
    const family = code.length <= 64 ? await db.get('SELECT * FROM families WHERE invite_code = ?', [code.trim().toUpperCase()]) : null;
    if (!family) throw new ValidationError('Invalid invite code.', { code: 'Invalid code' });
    await limits.joinFailUser.refund(userKey);
    await limits.joinFailIp.refund(req.ip);

    const already = await db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [family.id, req.user.id]);
    if (already) throw new ValidationError('You are already a member of this circle.');

    const placeholder = await db.get(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id IS NULL AND phone = ?',
      [family.id, req.user.phone]
    );
    if (placeholder) {
      await db.run('UPDATE family_members SET user_id = ? WHERE id = ?', [req.user.id, placeholder.id]);
    } else {
      await db.run(`INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'member')`, [family.id, req.user.id]);
    }

    await logActivity({
      userId: req.user.id,
      familyId: family.id,
      type: 'member_joined',
      summary: `${req.user.first_name} joined ${family.name}`,
    });

    res.status(201).json({ family: mapFamily(family, await membersFor(family.id), req.user.id) });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    await requireMembership(req.user.id, Number(req.params.id));
    const f = await db.get('SELECT * FROM families WHERE id = ?', [req.params.id]);
    if (!f) return res.status(404).json({ error: 'Circle not found.' });
    res.json({ family: mapFamily(f, await membersFor(f.id), req.user.id) });
  })
);

// Add a member by phone number (spec §12: identify by phone, not name).
router.post(
  '/:id/members',
  txRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    await requireRole(req.user.id, familyId, ['owner', 'admin']);

    const { phone, displayName } = req.body || {};
    if (!isPhone(phone)) throw new ValidationError('A valid phone number is required.', { phone: 'Required' });
    const normalized = normalizePhone(phone);

    const existingMember = await db.get('SELECT id FROM family_members WHERE family_id = ? AND phone = ?', [
      familyId,
      normalized,
    ]);
    const matchedUser = await db.get('SELECT id FROM users WHERE phone = ?', [normalized]);
    if (matchedUser) {
      const already = await db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [
        familyId,
        matchedUser.id,
      ]);
      if (already) throw new ValidationError('This person is already in the circle.');
    } else if (existingMember) {
      throw new ValidationError('This phone number was already invited.');
    }

    const result = await db.run(
      `INSERT INTO family_members (family_id, user_id, phone, display_name, role) VALUES (?, ?, ?, ?, 'member')`,
      [familyId, matchedUser ? matchedUser.id : null, normalized, displayName || null]
    );

    const family = await db.get('SELECT name FROM families WHERE id = ?', [familyId]);
    await logActivity({
      userId: req.user.id,
      familyId,
      type: 'member_joined',
      summary: `${req.user.first_name} added ${displayName || normalized} to ${family.name}`,
    });
    if (matchedUser) {
      await notifyUser(matchedUser.id, {
        type: 'family',
        title: `You were added to ${family.name}`,
        link: '#/family',
      });
    }

    res.status(201).json({ member: mapMember({ ...await db.get('SELECT * FROM family_members WHERE id = ?', [result.lastInsertRowid]) }) });
  })
);

router.patch(
  '/:id/members/:memberId',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    await requireRole(req.user.id, familyId, ['owner']);
    const role = req.body && req.body.role;
    if (!['admin', 'member'].includes(role)) throw new ValidationError('Invalid role.');
    const target = await db.get('SELECT * FROM family_members WHERE id = ? AND family_id = ?', [req.params.memberId, familyId]);
    if (!target) return res.status(404).json({ error: 'Member not found.' });
    // Hardening 1 / F-13: the owner row can never be changed here, including by the
    // owner themself. A family must always have exactly one owner; the only way
    // ownership moves is POST /:id/transfer-ownership (atomic, to an explicit member).
    if (target.role === 'owner') {
      throw new ValidationError("The owner role can't be changed here. Use \"Make owner\" on another member to transfer ownership first.");
    }
    await db.run('UPDATE family_members SET role = ? WHERE id = ? AND family_id = ?', [role, target.id, familyId]);
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/members/:memberId',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    await requireRole(req.user.id, familyId, ['owner', 'admin']);
    const member = await db.get('SELECT * FROM family_members WHERE id = ? AND family_id = ?', [req.params.memberId, familyId]);
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    if (member.role === 'owner') throw new ValidationError('Cannot remove the circle owner.');
    await db.tx(async () => {
      await db.run('DELETE FROM family_members WHERE id = ?', [member.id]);
      // The removed person's bills must not keep feeding this family's feed.
      if (member.user_id) await db.run('UPDATE bills SET family_id = NULL WHERE owner_id = ? AND family_id = ?', [member.user_id, familyId]);
      if (member.user_id) await replanUser(member.user_id);
    });
    // Hardening 1 / F-03: a removed registered member still knows the old code, so
    // it is replaced; otherwise "remove" could be undone with one join request.
    // (Phone-invited people who never registered never held the code.)
    let inviteCodeRotated = false;
    if (member.user_id) {
      await rotateInviteCode(familyId);
      inviteCodeRotated = true;
    }
    res.json({ ok: true, inviteCodeRotated });
  })
);

// Explicit, owner-initiated ownership transfer (Phase 8.3). Ownership lives in
// TWO places that must always agree — families.owner_id and the members
// table's role='owner' row — so both change inside one transaction. Nothing is
// deleted; the old owner becomes a regular member. There is intentionally no
// automatic transfer anywhere (account deletion still refuses instead).
router.post(
  '/:id/transfer-ownership',
  txRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    const me = await requireRole(req.user.id, familyId, ['owner']);
    const memberId = Number(req.body && req.body.memberId);
    if (!Number.isInteger(memberId)) throw new ValidationError('Choose a member to transfer ownership to.');

    const target = await db.get('SELECT * FROM family_members WHERE id = ? AND family_id = ?', [memberId, familyId]);
    if (!target) return res.status(404).json({ error: 'Member not found.' });
    if (target.id === me.id || target.role === 'owner') throw new ValidationError('That member is already the owner.');
    if (!target.user_id) {
      throw new ValidationError(
        'Ownership can only be transferred to a member who has joined LifeAdmin. Invited members who have not registered yet cannot become owner.'
      );
    }

    await db.tx(async () => {
      // Re-check inside the transaction so a concurrent change can't leave the
      // two ownership fields disagreeing.
      const f = await db.get('SELECT owner_id FROM families WHERE id = ?', [familyId]);
      const mine = await db.get('SELECT role FROM family_members WHERE id = ?', [me.id]);
      if (!f || f.owner_id !== req.user.id || !mine || mine.role !== 'owner') {
        const err = new ValidationError('You do not have permission to do this.');
        err.status = 403;
        throw err;
      }
      await db.run('UPDATE families SET owner_id = ? WHERE id = ?', [target.user_id, familyId]);
      await db.run("UPDATE family_members SET role = 'member' WHERE id = ?", [me.id]);
      await db.run("UPDATE family_members SET role = 'owner' WHERE id = ?", [target.id]);
    });

    const family = await db.get('SELECT * FROM families WHERE id = ?', [familyId]);
    const newOwner = await db.get('SELECT first_name, last_name FROM users WHERE id = ?', [target.user_id]);
    await logActivity({
      userId: req.user.id,
      familyId,
      type: 'ownership_transferred',
      summary: `${req.user.first_name} transferred ownership of "${family.name}" to ${newOwner.first_name} ${newOwner.last_name}`,
    });
    await notifyUser(target.user_id, {
      type: 'family',
      title: `You are now the owner of "${family.name}"`,
      link: '#/family',
    });
    res.json({ family: mapFamily(family, await membersFor(familyId), req.user.id) });
  })
);

// Any non-owner member may leave. An owner must transfer ownership first (the
// backend enforces this — it is not just hidden in the UI). Leaving removes
// only the membership row; no family data is deleted.
router.post(
  '/:id/leave',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    const me = await requireMembership(req.user.id, familyId);
    const family = await db.get('SELECT * FROM families WHERE id = ?', [familyId]);
    if (!family) return res.status(404).json({ error: 'Circle not found.' });
    if (me.role === 'owner' || family.owner_id === req.user.id) {
      throw new ValidationError('Transfer ownership to another member before leaving this circle.');
    }
    await db.tx(async () => {
      await db.run('DELETE FROM family_members WHERE id = ?', [me.id]);
      await db.run('UPDATE bills SET family_id = NULL WHERE owner_id = ? AND family_id = ?', [req.user.id, familyId]);
      await replanUser(req.user.id);
    });
    await logActivity({
      userId: req.user.id,
      familyId,
      type: 'member_left',
      summary: `${req.user.first_name} left the circle`,
    });
    res.json({ ok: true });
  })
);

// Owner-initiated invite-code rotation (Hardening 1 / F-03). The old code is invalid
// immediately; the new one is returned only to the owner. Nothing rotates on its own
// except when a registered member is removed (see DELETE /:id/members/:memberId).
router.post(
  '/:id/invite-code/regenerate',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    await requireRole(req.user.id, familyId, ['owner']);
    const inviteCode = await rotateInviteCode(familyId);
    const family = await db.get('SELECT name FROM families WHERE id = ?', [familyId]);
    // The activity entry records THAT the code changed, never the code itself.
    await logActivity({
      userId: req.user.id,
      familyId,
      type: 'invite_code_changed',
      summary: `${req.user.first_name} changed the invite code for "${family.name}"`,
    });
    res.json({ ok: true, inviteCode });
  })
);

router.get(
  '/:id/activity',
  asyncRoute(async (req, res) => {
    await requireMembership(req.user.id, Number(req.params.id));
    const rows = await db.all(
      `SELECT a.*, u.first_name, u.last_name FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.family_id = ? AND ${HIDE_NON_FAMILY_TASK_ACTIVITY}
         AND ${showsLinkedTaskSql('a.link', req.user.id)} ORDER BY a.created_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json({
      activity: rows.map((r) => ({
        id: r.id,
        type: r.type,
        summary: r.summary,
        link: r.link,
        createdAt: r.created_at,
        actorName: r.first_name ? `${r.first_name} ${r.last_name}` : null,
      })),
    });
  })
);

// --- Shared shopping list (spec §41 idea) -----------------------------------
router.get(
  '/:id/shopping',
  asyncRoute(async (req, res) => {
    await requireMembership(req.user.id, Number(req.params.id));
    const rows = await db.all('SELECT * FROM shopping_items WHERE family_id = ? ORDER BY done ASC, created_at DESC', [
      req.params.id,
    ]);
    res.json({ items: rows });
  })
);

router.post(
  '/:id/shopping',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    await requireMembership(req.user.id, familyId);
    const { name, quantity } = req.body || {};
    if (!isNonEmpty(name)) throw new ValidationError('Item name is required.');
    const result = await db.run('INSERT INTO shopping_items (family_id, name, quantity, added_by) VALUES (?,?,?,?)', [
      familyId,
      name.trim(),
      quantity || null,
      req.user.id,
    ]);
    res.status(201).json({ item: await db.get('SELECT * FROM shopping_items WHERE id = ?', [result.lastInsertRowid]) });
  })
);

router.patch(
  '/:id/shopping/:itemId',
  asyncRoute(async (req, res) => {
    await requireMembership(req.user.id, Number(req.params.id));
    const done = req.body && req.body.done ? 1 : 0;
    await db.run('UPDATE shopping_items SET done = ? WHERE id = ? AND family_id = ?', [done, req.params.itemId, req.params.id]);
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/shopping/:itemId',
  asyncRoute(async (req, res) => {
    await requireMembership(req.user.id, Number(req.params.id));
    await db.run('DELETE FROM shopping_items WHERE id = ? AND family_id = ?', [req.params.itemId, req.params.id]);
    res.json({ ok: true });
  })
);

// Quiet about one circle for a while, on this person's devices only: the bell keeps filling, nobody else is
// affected, and reminders of the person's own tasks and bills still arrive. It ends by itself.
router.get(
  '/:id/mute',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    const me = await requireMembership(req.user.id, familyId);
    const until = me.muted_until ? `${String(me.muted_until).replace(' ', 'T')}Z` : null;
    res.json({ mutedUntil: until && Date.parse(until) > Date.now() ? until : null });
  })
);

router.post(
  '/:id/mute',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    await requireMembership(req.user.id, familyId);
    const hours = Number(req.body && req.body.hours);
    if (![1, 8, 24].includes(hours)) throw new ValidationError('Choose 1, 8 or 24 hours.', { hours: 'Invalid' });
    const until = new Date(Date.now() + hours * 3600000).toISOString().slice(0, 19).replace('T', ' ');
    await db.run('UPDATE family_members SET muted_until = ? WHERE family_id = ? AND user_id = ?', [until, familyId, req.user.id]);
    res.json({ ok: true, mutedUntil: `${until.replace(' ', 'T')}Z` });
  })
);

router.delete(
  '/:id/mute',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    await requireMembership(req.user.id, familyId);
    await db.run('UPDATE family_members SET muted_until = NULL WHERE family_id = ? AND user_id = ?', [familyId, req.user.id]);
    res.json({ ok: true, mutedUntil: null });
  })
);

module.exports = router;
