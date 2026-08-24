const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, isPhone, normalizePhone, ValidationError } = require('../lib/validate');
const { requireMembership, requireRole, logActivity, getUserFamilyIds } = require('../lib/family');
const { notifyFamily, notifyUser } = require('../lib/notify');

const router = express.Router();

function inviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function mapFamily(f, members) {
  return {
    id: f.id,
    name: f.name,
    inviteCode: f.invite_code,
    ownerId: f.owner_id,
    createdAt: f.created_at,
    members: members.map(mapMember),
  };
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

function membersFor(familyId) {
  return db.all(
    `SELECT fm.*, u.first_name, u.last_name FROM family_members fm
     LEFT JOIN users u ON u.id = fm.user_id WHERE fm.family_id = ? ORDER BY fm.joined_at ASC`,
    [familyId]
  );
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const ids = getUserFamilyIds(req.user.id);
    if (!ids.length) return res.json({ families: [] });
    const placeholders = ids.map(() => '?').join(',');
    const families = db.all(`SELECT * FROM families WHERE id IN (${placeholders})`, ids);
    res.json({ families: families.map((f) => mapFamily(f, membersFor(f.id))) });
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const name = req.body && req.body.name;
    if (!isNonEmpty(name)) throw new ValidationError('Family name is required.');

    let code;
    do {
      code = inviteCode();
    } while (db.get('SELECT id FROM families WHERE invite_code = ?', [code]));

    const result = db.run('INSERT INTO families (name, invite_code, owner_id) VALUES (?, ?, ?)', [
      name.trim(),
      code,
      req.user.id,
    ]);
    db.run("INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'owner')", [
      result.lastInsertRowid,
      req.user.id,
    ]);
    logActivity({
      userId: req.user.id,
      familyId: result.lastInsertRowid,
      type: 'member_joined',
      summary: `${req.user.first_name} created the family "${name.trim()}"`,
    });

    const f = db.get('SELECT * FROM families WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ family: mapFamily(f, membersFor(f.id)) });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    requireMembership(req.user.id, Number(req.params.id));
    const f = db.get('SELECT * FROM families WHERE id = ?', [req.params.id]);
    if (!f) return res.status(404).json({ error: 'Family not found.' });
    res.json({ family: mapFamily(f, membersFor(f.id)) });
  })
);

// Add a member by phone number (spec §12: identify by phone, not name).
router.post(
  '/:id/members',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    requireRole(req.user.id, familyId, ['owner', 'admin']);

    const { phone, displayName } = req.body || {};
    if (!isPhone(phone)) throw new ValidationError('A valid phone number is required.', { phone: 'Required' });
    const normalized = normalizePhone(phone);

    const existingMember = db.get('SELECT id FROM family_members WHERE family_id = ? AND phone = ?', [
      familyId,
      normalized,
    ]);
    const matchedUser = db.get('SELECT id FROM users WHERE phone = ?', [normalized]);
    if (matchedUser) {
      const already = db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [
        familyId,
        matchedUser.id,
      ]);
      if (already) throw new ValidationError('This person is already in the family.');
    } else if (existingMember) {
      throw new ValidationError('This phone number was already invited.');
    }

    const result = db.run(
      `INSERT INTO family_members (family_id, user_id, phone, display_name, role) VALUES (?, ?, ?, ?, 'member')`,
      [familyId, matchedUser ? matchedUser.id : null, normalized, displayName || null]
    );

    const family = db.get('SELECT name FROM families WHERE id = ?', [familyId]);
    logActivity({
      userId: req.user.id,
      familyId,
      type: 'member_joined',
      summary: `${req.user.first_name} added ${displayName || normalized} to ${family.name}`,
    });
    if (matchedUser) {
      notifyUser(matchedUser.id, {
        type: 'family',
        title: `You were added to ${family.name}`,
        link: '#/family',
      });
    }

    res.status(201).json({ member: mapMember({ ...db.get('SELECT * FROM family_members WHERE id = ?', [result.lastInsertRowid]) }) });
  })
);

router.patch(
  '/:id/members/:memberId',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    requireRole(req.user.id, familyId, ['owner']);
    const role = req.body && req.body.role;
    if (!['admin', 'member'].includes(role)) throw new ValidationError('Invalid role.');
    db.run('UPDATE family_members SET role = ? WHERE id = ? AND family_id = ?', [role, req.params.memberId, familyId]);
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/members/:memberId',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    requireRole(req.user.id, familyId, ['owner', 'admin']);
    const member = db.get('SELECT * FROM family_members WHERE id = ? AND family_id = ?', [req.params.memberId, familyId]);
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    if (member.role === 'owner') throw new ValidationError('Cannot remove the family owner.');
    db.run('DELETE FROM family_members WHERE id = ?', [req.params.memberId]);
    res.json({ ok: true });
  })
);

router.get(
  '/:id/activity',
  asyncRoute(async (req, res) => {
    requireMembership(req.user.id, Number(req.params.id));
    const rows = db.all(
      `SELECT a.*, u.first_name, u.last_name FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.family_id = ? ORDER BY a.created_at DESC LIMIT 50`,
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
    requireMembership(req.user.id, Number(req.params.id));
    const rows = db.all('SELECT * FROM shopping_items WHERE family_id = ? ORDER BY done ASC, created_at DESC', [
      req.params.id,
    ]);
    res.json({ items: rows });
  })
);

router.post(
  '/:id/shopping',
  asyncRoute(async (req, res) => {
    const familyId = Number(req.params.id);
    requireMembership(req.user.id, familyId);
    const { name, quantity } = req.body || {};
    if (!isNonEmpty(name)) throw new ValidationError('Item name is required.');
    const result = db.run('INSERT INTO shopping_items (family_id, name, quantity, added_by) VALUES (?,?,?,?)', [
      familyId,
      name.trim(),
      quantity || null,
      req.user.id,
    ]);
    res.status(201).json({ item: db.get('SELECT * FROM shopping_items WHERE id = ?', [result.lastInsertRowid]) });
  })
);

router.patch(
  '/:id/shopping/:itemId',
  asyncRoute(async (req, res) => {
    requireMembership(req.user.id, Number(req.params.id));
    const done = req.body && req.body.done ? 1 : 0;
    db.run('UPDATE shopping_items SET done = ? WHERE id = ? AND family_id = ?', [done, req.params.itemId, req.params.id]);
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/shopping/:itemId',
  asyncRoute(async (req, res) => {
    requireMembership(req.user.id, Number(req.params.id));
    db.run('DELETE FROM shopping_items WHERE id = ? AND family_id = ?', [req.params.itemId, req.params.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
