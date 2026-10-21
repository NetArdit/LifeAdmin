// Routines: things a person does again and again (exercise, meditation, a medicine they name themselves).
//
// What this is and is not:
//   - A routine is a time on the clock and a rule (every day, or chosen weekdays). A reminder comes at that
//     time, in the routine's time zone, through the same planner and clock as every other reminder
//     (reminders.js, reminderWorker.js): one planned row per occurrence, never two for the same one.
//   - Nothing here knows whether anything was done. "Done" exists only as a check-in the PERSON makes. A day
//     that passes with no check-in is shown as "missed", never as done.
//   - A medicine is whatever the person types. The app never suggests a medicine, a dose or a time to take it.
//   - Only the owner sees or changes a routine (there is no circle sharing).
const express = require('express');
const db = require('../db');
const { asyncRoute, txRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const reminders = require('../lib/reminders');
const { addDays } = require('../lib/dates');

const router = express.Router();

const KINDS = ['exercise', 'meditation', 'medication', 'other'];
const MAX_ROUTINES = 30;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// After its time a routine is "due" for this long; after that, without a check-in, "missed".
const DUE_WINDOW_MS = 60 * 60 * 1000;
const MEDICATION_NOTE = 'A reminder is not medical advice, and LifeAdmin never suggests a medicine or a dose. A reminder does not show that you took it: you tick it yourself.';

function mapRoutine(r, user, now = Date.now()) {
  const zone = reminders.routineZone(r, user);
  const next = reminders.nextRoutineMoment(r, zone, now);
  return {
    id: r.id,
    title: r.title,
    details: r.details || '',
    kind: r.kind,
    time: r.time_of_day,
    days: reminders.routineDays(r),
    timezone: zone,
    followsProfileZone: !!r.follow_profile_zone,
    enabled: !!r.enabled,
    nextAt: next ? new Date(next).toISOString() : null,
    note: r.kind === 'medication' ? MEDICATION_NOTE : null,
  };
}

/** Checks the fields of a routine; with `partial`, only those that were given. Answers column values. */
function parseRoutine(body, { partial = false } = {}) {
  const b = body && typeof body === 'object' ? body : {};
  const out = {};
  const fields = {};
  if (!partial || b.title !== undefined) {
    if (!isNonEmpty(b.title) || b.title.trim().length > 80) fields.title = 'Give it a name of up to 80 characters.';
    else out.title = b.title.trim();
  }
  if (b.details !== undefined) {
    if (b.details !== null && (typeof b.details !== 'string' || b.details.length > 500)) fields.details = 'Details can be up to 500 characters.';
    else out.details = b.details ? b.details.trim() : null;
  }
  if (!partial || b.kind !== undefined) {
    const kind = b.kind === undefined ? 'other' : b.kind;
    if (!KINDS.includes(kind)) fields.kind = 'Pick one of the kinds.';
    else out.kind = kind;
  }
  if (!partial || b.time !== undefined) {
    if (typeof b.time !== 'string' || !TIME_RE.test(b.time)) fields.time = 'Use a time such as 07:30.';
    else out.time_of_day = b.time;
  }
  if (!partial || b.days !== undefined) {
    const days = b.days === undefined ? [] : b.days;
    if (!Array.isArray(days) || days.length > 7 || !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) fields.days = 'Pick days of the week, or none for every day.';
    else out.days_of_week = JSON.stringify([...new Set(days)].sort((x, y) => x - y));
  }
  if (b.timezone !== undefined) {
    if (b.timezone === null || b.timezone === '') out.follow_profile_zone = 1;
    else if (!reminders.isZone(b.timezone)) fields.timezone = 'Unknown time zone.';
    else {
      out.timezone = b.timezone;
      out.follow_profile_zone = 0;
    }
  }
  if (b.enabled !== undefined) {
    if (typeof b.enabled !== 'boolean') fields.enabled = 'Must be true or false.';
    else out.enabled = b.enabled ? 1 : 0;
  }
  if (Object.keys(fields).length) throw new ValidationError('Please fix the highlighted fields.', fields);
  return out;
}

async function mine(req, id) {
  const routine = Number.isInteger(id) ? await db.get('SELECT * FROM routines WHERE id = ? AND owner_id = ?', [id, req.user.id]) : null;
  if (!routine) {
    const err = new ValidationError('Routine not found.');
    err.status = 404;
    throw err;
  }
  return routine;
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const rows = await db.all('SELECT * FROM routines WHERE owner_id = ? ORDER BY time_of_day, id', [req.user.id]);
    res.json({ routines: rows.map((r) => mapRoutine(r, req.user)), medicationNote: MEDICATION_NOTE });
  })
);

router.post(
  '/',
  txRoute(async (req, res) => {
    const data = parseRoutine(req.body);
    const count = Number((await db.get('SELECT COUNT(*) AS c FROM routines WHERE owner_id = ?', [req.user.id])).c);
    if (count >= MAX_ROUTINES) throw new ValidationError(`You can keep up to ${MAX_ROUTINES} routines.`);
    // The zone is stored with the routine: the one given, else the person's own, worked out now.
    const follow = data.follow_profile_zone === undefined ? 1 : data.follow_profile_zone;
    const zone = data.timezone || reminders.zoneOf(req.user);
    const result = await db.run(
      `INSERT INTO routines (owner_id, title, details, kind, time_of_day, days_of_week, timezone, follow_profile_zone, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, data.title, data.details ?? null, data.kind, data.time_of_day, data.days_of_week, zone, follow, data.enabled === undefined ? 1 : data.enabled]
    );
    await reminders.replanRoutine(result.lastInsertRowid);
    const row = await db.get('SELECT * FROM routines WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ routine: mapRoutine(row, req.user) });
  })
);

router.patch(
  '/:id',
  txRoute(async (req, res) => {
    const existing = await mine(req, Number(req.params.id));
    const data = parseRoutine(req.body, { partial: true });
    const sets = Object.keys(data);
    if (sets.length) {
      await db.run(`UPDATE routines SET ${sets.map((k) => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`, [...sets.map((k) => data[k]), existing.id]);
      // Pending reminders follow the change; ones for the old time are cancelled (reminders.reconcile).
      await reminders.replanRoutine(existing.id);
    }
    res.json({ routine: mapRoutine(await db.get('SELECT * FROM routines WHERE id = ?', [existing.id]), req.user) });
  })
);

router.delete(
  '/:id',
  txRoute(async (req, res) => {
    const existing = await mine(req, Number(req.params.id));
    await db.run('DELETE FROM routines WHERE id = ?', [existing.id]);
    await reminders.forget('routine', existing.id);
    res.json({ ok: true });
  })
);

// What is on for today (and what was missed yesterday), each with its state. States:
//   upcoming  its time has not come
//   due       its time came in the last hour and nothing was ticked
//   missed    its time passed more than an hour ago and nothing was ticked (never "done")
//   done      the person ticked it
router.get(
  '/today',
  asyncRoute(async (req, res) => {
    const now = Date.now();
    const rows = await db.all('SELECT * FROM routines WHERE owner_id = ? AND enabled = 1 ORDER BY time_of_day, id', [req.user.id]);
    const checkins = await db.all(
      'SELECT routine_id, occurrence_date FROM routine_checkins WHERE routine_id IN (SELECT id FROM routines WHERE owner_id = ?)',
      [req.user.id]
    );
    const ticked = new Set(checkins.map((c) => `${c.routine_id}|${c.occurrence_date}`));
    const items = [];
    for (const r of rows) {
      const zone = reminders.routineZone(r, req.user);
      const today = reminders.wallAt(now, zone).date;
      for (const o of reminders.routineOccurrences(r, zone, now, { backHours: 48, ahead: 0 })) {
        // Today, and yesterday's leftovers only.
        if (o.date !== today && o.date !== addDays(today, -1)) continue;
        let status;
        if (ticked.has(`${r.id}|${o.date}`)) status = 'done';
        else if (o.at > now) status = 'upcoming';
        else status = now - o.at <= DUE_WINDOW_MS ? 'due' : 'missed';
        items.push({ routineId: r.id, title: r.title, kind: r.kind, date: o.date, day: o.date === today ? 'today' : 'yesterday', time: r.time_of_day, at: new Date(o.at).toISOString(), status, note: r.kind === 'medication' ? MEDICATION_NOTE : null });
      }
    }
    items.sort((a, b) => a.at.localeCompare(b.at));
    res.json({ items });
  })
);

// "I did it" — only the person says so, for today or yesterday of that routine (in its own zone), and only on a
// day the routine has an occurrence. Saying it twice is the same as once; it can be taken back.
async function checkinDay(req, routine, date) {
  const zone = reminders.routineZone(routine, req.user);
  const now = Date.now();
  const days = reminders.routineOccurrences(routine, zone, now, { backHours: 48, ahead: 0 });
  const found = days.find((o) => o.date === date);
  const today = reminders.wallAt(now, zone).date;
  if (!found || found.date > today) throw new ValidationError('That day has no occurrence of this routine to confirm.');
  return found;
}

router.post(
  '/:id/checkin',
  asyncRoute(async (req, res) => {
    const routine = await mine(req, Number(req.params.id));
    const date = req.body && req.body.date;
    if (typeof date !== 'string') throw new ValidationError('Say which day.');
    await checkinDay(req, routine, date);
    await db.run('INSERT INTO routine_checkins (routine_id, occurrence_date) VALUES (?, ?) ON CONFLICT (routine_id, occurrence_date) DO NOTHING', [routine.id, date]);
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/checkin/:date',
  asyncRoute(async (req, res) => {
    const routine = await mine(req, Number(req.params.id));
    await db.run('DELETE FROM routine_checkins WHERE routine_id = ? AND occurrence_date = ?', [routine.id, req.params.date]);
    res.json({ ok: true });
  })
);

module.exports = router;
