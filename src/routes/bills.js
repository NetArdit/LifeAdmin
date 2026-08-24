const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { addDays, daysUntil, todayISO } = require('../lib/dates');
const { logActivity } = require('../lib/family');
const { notifyFamily } = require('../lib/notify');
const ai = require('../lib/ai');

const router = express.Router();

const CATEGORIES = [
  'electricity',
  'water',
  'internet',
  'phone',
  'rent',
  'subscription',
  'insurance',
  'loan',
  'other',
];

function mapBill(b) {
  return {
    id: b.id,
    familyId: b.family_id,
    name: b.name,
    category: b.category,
    amount: b.amount,
    currency: b.currency,
    dueDate: b.due_date,
    recurrence: b.recurrence,
    status: b.status,
    notes: b.notes,
    daysUntilDue: daysUntil(b.due_date),
    createdAt: b.created_at,
  };
}

function nextDueDate(dueDate, recurrence) {
  if (recurrence === 'weekly') return addDays(dueDate, 7);
  if (recurrence === 'monthly') {
    const d = new Date(dueDate + 'T00:00:00');
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (recurrence === 'yearly') {
    const d = new Date(dueDate + 'T00:00:00');
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const rows = db.all('SELECT * FROM bills WHERE owner_id = ? ORDER BY due_date ASC', [req.user.id]);
    res.json({ bills: rows.map(mapBill) });
  })
);

// Deterministic dashboard stats — no AI (spec §17).
router.get(
  '/stats',
  asyncRoute(async (req, res) => {
    const rows = db.all('SELECT * FROM bills WHERE owner_id = ?', [req.user.id]);
    const today = todayISO();
    const unpaid = rows.filter((b) => b.status === 'unpaid');
    const overdue = unpaid.filter((b) => b.due_date < today);
    const upcoming = unpaid.filter((b) => b.due_date >= today && daysUntil(b.due_date) <= 14);
    const monthlyTotal = rows
      .filter((b) => b.recurrence === 'monthly')
      .reduce((sum, b) => sum + b.amount, 0);
    const byCategory = {};
    for (const b of rows) {
      byCategory[b.category] = (byCategory[b.category] || 0) + b.amount;
    }
    const highest = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 5);

    res.json({
      stats: {
        monthlyTotal,
        overdueCount: overdue.length,
        upcomingCount: upcoming.length,
        byCategory,
        highest: highest.map(mapBill),
      },
      overdue: overdue.map(mapBill),
      upcoming: upcoming.map(mapBill),
    });
  })
);

router.post(
  '/insights',
  asyncRoute(async (req, res) => {
    const rows = db.all('SELECT * FROM bills WHERE owner_id = ?', [req.user.id]);
    if (!rows.length) return res.json({ ok: true, data: { insights: ['Add a few bills to unlock spending insights.'] } });

    const byCategory = {};
    for (const b of rows) byCategory[b.category] = (byCategory[b.category] || 0) + b.amount;
    const monthlyTotal = rows.filter((b) => b.recurrence === 'monthly').reduce((s, b) => s + b.amount, 0);

    const result = await ai.billInsights({ monthlyTotal, byCategory, billCount: rows.length });
    res.json(result);
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const b = req.body || {};
    if (!isNonEmpty(b.name)) throw new ValidationError('Bill name is required.', { name: 'Required' });
    if (typeof b.amount !== 'number' || b.amount <= 0) throw new ValidationError('Amount must be a positive number.', { amount: 'Required' });
    if (!isNonEmpty(b.dueDate)) throw new ValidationError('Due date is required.', { dueDate: 'Required' });
    if (b.category && !CATEGORIES.includes(b.category)) throw new ValidationError('Invalid category.');

    const result = db.run(
      `INSERT INTO bills (owner_id, family_id, name, category, amount, currency, due_date, recurrence, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        b.familyId || null,
        b.name.trim(),
        b.category || 'other',
        b.amount,
        b.currency || 'EUR',
        b.dueDate,
        b.recurrence || 'monthly',
        b.notes || null,
      ]
    );
    const bill = db.get('SELECT * FROM bills WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ bill: mapBill(bill) });
  })
);

router.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const bill = db.get('SELECT * FROM bills WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });
    const b = req.body || {};
    const map = { name: 'name', category: 'category', amount: 'amount', currency: 'currency', dueDate: 'due_date', recurrence: 'recurrence', notes: 'notes' };
    const fields = [];
    const params = [];
    for (const [key, col] of Object.entries(map)) {
      if (b[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(b[key]);
      }
    }
    if (!fields.length) return res.json({ bill: mapBill(bill) });
    fields.push("updated_at = datetime('now')");
    db.run(`UPDATE bills SET ${fields.join(', ')} WHERE id = ?`, [...params, bill.id]);
    res.json({ bill: mapBill(db.get('SELECT * FROM bills WHERE id = ?', [bill.id])) });
  })
);

router.post(
  '/:id/pay',
  asyncRoute(async (req, res) => {
    const bill = db.get('SELECT * FROM bills WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });

    db.run('INSERT INTO bill_payments (bill_id, amount, note) VALUES (?, ?, ?)', [
      bill.id,
      bill.amount,
      (req.body && req.body.note) || null,
    ]);

    if (bill.recurrence === 'none') {
      db.run("UPDATE bills SET status = 'paid', updated_at = datetime('now') WHERE id = ?", [bill.id]);
    } else {
      const next = nextDueDate(bill.due_date, bill.recurrence);
      db.run("UPDATE bills SET status = 'unpaid', due_date = ?, updated_at = datetime('now') WHERE id = ?", [
        next,
        bill.id,
      ]);
    }

    logActivity({
      userId: req.user.id,
      familyId: bill.family_id,
      type: 'bill_paid',
      summary: `${req.user.first_name} marked "${bill.name}" as paid`,
      link: '#/billsense',
    });
    if (bill.family_id) {
      notifyFamily(bill.family_id, req.user.id, {
        type: 'bill',
        title: `${bill.name} was marked as paid`,
        link: '#/billsense',
      });
    }

    res.json({ bill: mapBill(db.get('SELECT * FROM bills WHERE id = ?', [bill.id])) });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const bill = db.get('SELECT * FROM bills WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });
    db.run('DELETE FROM bills WHERE id = ?', [bill.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
