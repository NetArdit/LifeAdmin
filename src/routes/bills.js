const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { addDays, addMonths, daysUntil, todayISO } = require('../lib/dates');
const { logActivity, requireMembership, getMembership } = require('../lib/family');
const { notifyFamily } = require('../lib/notify');
const ai = require('../lib/ai');

const { parseReminder, reminderOf, replanBill, forget: forgetReminders } = require('../lib/reminders');

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

// The only recurrences nextDueDate() can advance. Anything else used to be
// stored as-is and then made "mark as paid" fail with a server error.
const RECURRENCES = ['none', 'weekly', 'monthly', 'yearly'];

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
    reminder: reminderOf(b),
    notes: b.notes,
    daysUntilDue: daysUntil(b.due_date),
    createdAt: b.created_at,
  };
}

function nextDueDate(dueDate, recurrence) {
  if (recurrence === 'weekly') return addDays(dueDate, 7);
  // addMonths/addDays are UTC-anchored (src/lib/dates.js) so this stays
  // correct regardless of the server's local timezone offset.
  if (recurrence === 'monthly') return addMonths(dueDate, 1);
  if (recurrence === 'yearly') return addMonths(dueDate, 12);
  return null;
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const rows = await db.all('SELECT * FROM bills WHERE owner_id = ? ORDER BY due_date ASC', [req.user.id]);
    res.json({ bills: rows.map(mapBill) });
  })
);

// Deterministic dashboard stats — no AI (spec §17).
router.get(
  '/stats',
  asyncRoute(async (req, res) => {
    const rows = await db.all('SELECT * FROM bills WHERE owner_id = ?', [req.user.id]);
    const today = todayISO();
    const unpaid = rows.filter((b) => b.status === 'unpaid');
    const overdue = unpaid.filter((b) => b.due_date < today);
    const upcoming = unpaid.filter((b) => b.due_date >= today && daysUntil(b.due_date) <= 14);
    // Amounts in different currencies are never added together. The currency
    // most bills use is the primary one: monthlyTotal and byCategory cover it
    // alone, and monthlyTotals carries one total for every currency in use.
    const perCurrency = {};
    for (const b of rows) perCurrency[b.currency] = (perCurrency[b.currency] || 0) + 1;
    const currencies = Object.keys(perCurrency).sort((a, b) => perCurrency[b] - perCurrency[a]);
    const currency = currencies[0] || 'EUR';
    const monthlyByCurrency = {};
    for (const b of rows.filter((r) => r.recurrence === 'monthly')) {
      monthlyByCurrency[b.currency] = (monthlyByCurrency[b.currency] || 0) + b.amount;
    }
    const monthlyTotal = monthlyByCurrency[currency] || 0;
    const monthlyTotals = currencies.filter((c) => monthlyByCurrency[c]).map((c) => ({ currency: c, total: monthlyByCurrency[c] }));
    const byCategory = {};
    for (const b of rows.filter((r) => r.currency === currency)) {
      byCategory[b.category] = (byCategory[b.category] || 0) + b.amount;
    }
    const highest = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 5);

    // What has actually been paid this calendar month, from the payments the
    // "mark as paid" action records. Without this, marking a recurring bill as
    // paid only moved its due date forward: the amount was stored and then
    // never shown or counted anywhere, so no figure on the page changed.
    const month = today.slice(0, 7);
    // paid_at is stored in UTC and read here in the server's timezone, so the
    // month matches todayISO(). One total per currency: amounts in different currencies are never added
    // together.
    const paidThisMonth = await db.all(
      `SELECT b.currency AS currency, SUM(p.amount) AS total, COUNT(*) AS count
       FROM bill_payments p JOIN bills b ON b.id = p.bill_id
       WHERE b.owner_id = ? AND substr(datetime(p.paid_at, 'localtime'), 1, 7) = ?
       GROUP BY b.currency ORDER BY total DESC`,
      [req.user.id, month]
    );

    res.json({
      stats: {
        monthlyTotal,
        monthlyTotals,
        currency,
        mixedCurrencies: currencies.length > 1,
        paidThisMonth,
        paidThisMonthCount: paidThisMonth.reduce((n, p) => n + p.count, 0),
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
    const rows = await db.all('SELECT * FROM bills WHERE owner_id = ?', [req.user.id]);
    if (!rows.length) return res.json({ ok: true, data: { insights: ['Add a few bills to unlock spending insights.'] } });
    if (ai.userAiDisabled(req.user)) return res.json(ai.AI_DISABLED_BY_USER);

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
    if (b.recurrence && !RECURRENCES.includes(b.recurrence)) throw new ValidationError('Invalid recurrence.', { recurrence: 'Invalid' });

    // Hardening 1 / F-01: a family id from the client is never trusted on its own.
    // A bill may be attached to a family only if the requester is a member of it
    // (403 otherwise, same response whether or not that family exists).
    let familyId = null;
    if (b.familyId !== undefined && b.familyId !== null) {
      if (!Number.isInteger(b.familyId) || b.familyId < 1) throw new ValidationError('Invalid circle.', { familyId: 'Invalid' });
      await requireMembership(req.user.id, b.familyId);
      familyId = b.familyId;
    }

    const reminder = parseReminder(b.reminder) || { mode: 'default', minutes: null };
    const result = await db.run(
      `INSERT INTO bills (owner_id, family_id, name, category, amount, currency, due_date, recurrence, notes, reminder_mode, reminder_minutes_before)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        familyId,
        b.name.trim(),
        b.category || 'other',
        b.amount,
        b.currency || 'EUR',
        b.dueDate,
        b.recurrence || 'monthly',
        b.notes || null,
        reminder.mode,
        reminder.minutes,
      ]
    );
    await replanBill(result.lastInsertRowid);
    const bill = await db.get('SELECT * FROM bills WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ bill: mapBill(bill) });
  })
);

router.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const bill = await db.get('SELECT * FROM bills WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });
    const b = req.body || {};
    // Hardening 1 / F-01: a bill's family association is fixed when it is created
    // (there is no move / detach operation). A PATCH may repeat the current value but
    // can never attach, move or clear it — that is what closes cross-family editing.
    if (b.familyId !== undefined && (b.familyId === null ? null : b.familyId) !== bill.family_id) {
      throw new ValidationError("A bill's circle can't be changed after it is created.", { familyId: 'Not editable' });
    }
    // Same rules as creating a bill: an edit must not store what a create would refuse.
    if (b.name !== undefined && !isNonEmpty(b.name)) throw new ValidationError('Bill name is required.', { name: 'Required' });
    if (b.amount !== undefined && (typeof b.amount !== 'number' || b.amount <= 0)) throw new ValidationError('Amount must be a positive number.', { amount: 'Required' });
    if (b.dueDate !== undefined && !isNonEmpty(b.dueDate)) throw new ValidationError('Due date is required.', { dueDate: 'Required' });
    if (b.category !== undefined && !CATEGORIES.includes(b.category)) throw new ValidationError('Invalid category.');
    if (b.recurrence !== undefined && !RECURRENCES.includes(b.recurrence)) throw new ValidationError('Invalid recurrence.', { recurrence: 'Invalid' });
    const map = { name: 'name', category: 'category', amount: 'amount', currency: 'currency', dueDate: 'due_date', recurrence: 'recurrence', notes: 'notes' };
    const fields = [];
    const params = [];
    for (const [key, col] of Object.entries(map)) {
      if (b[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(b[key]);
      }
    }
    const reminder = parseReminder(b.reminder);
    if (reminder) {
      fields.push('reminder_mode = ?', 'reminder_minutes_before = ?');
      params.push(reminder.mode, reminder.minutes);
    }
    if (!fields.length) return res.json({ bill: mapBill(bill) });
    fields.push("updated_at = datetime('now')");
    await db.run(`UPDATE bills SET ${fields.join(', ')} WHERE id = ?`, [...params, bill.id]);
    await replanBill(bill.id);
    res.json({ bill: mapBill(await db.get('SELECT * FROM bills WHERE id = ?', [bill.id])) });
  })
);

router.post(
  '/:id/pay',
  asyncRoute(async (req, res) => {
    const bill = await db.get('SELECT * FROM bills WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });

    await db.run('INSERT INTO bill_payments (bill_id, amount, note) VALUES (?, ?, ?)', [
      bill.id,
      bill.amount,
      (req.body && req.body.note) || null,
    ]);

    if (bill.recurrence === 'none') {
      await db.run("UPDATE bills SET status = 'paid', updated_at = datetime('now') WHERE id = ?", [bill.id]);
    } else {
      const next = nextDueDate(bill.due_date, bill.recurrence);
      await db.run("UPDATE bills SET status = 'unpaid', due_date = ?, updated_at = datetime('now') WHERE id = ?", [
        next,
        bill.id,
      ]);
    }

    // Paid for good: nothing left to remind of. Rolled to its next date: the reminder moves with it.
    await replanBill(bill.id);

    // Side effects go to the family only while the payer is STILL a member of it
    // (covers bills stored before the F-01 fix and members who have since left).
    const sharedFamilyId = bill.family_id && await getMembership(req.user.id, bill.family_id) ? bill.family_id : null;
    await logActivity({
      userId: req.user.id,
      familyId: sharedFamilyId,
      type: 'bill_paid',
      summary: `${req.user.first_name} marked "${bill.name}" as paid`,
      link: '#/billsense',
    });
    if (sharedFamilyId) {
      await notifyFamily(sharedFamilyId, req.user.id, {
        type: 'bill',
        title: `${bill.name} was marked as paid`,
        link: '#/billsense',
      });
    }

    res.json({ bill: mapBill(await db.get('SELECT * FROM bills WHERE id = ?', [bill.id])) });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const bill = await db.get('SELECT * FROM bills WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });
    await db.run('DELETE FROM bills WHERE id = ?', [bill.id]);
    await forgetReminders('bill', bill.id);
    res.json({ ok: true });
  })
);

module.exports = router;
