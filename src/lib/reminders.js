// Reminders that depend on time: what is planned, for whom and for which moment.
//
// Nothing is sent from here. This module keeps the table `planned_reminders` true to the items it is about:
// each open task, unpaid bill, active goal and open milestone with a date has at most one planned row per
// person, and a row stops being pending as soon as its item is done, deleted, moved or no longer visible to
// that person. A worker (a later unit) claims the rows that are due and must still check the item again
// before it sends: the calls to replan*() below run after the change they follow, not in its transaction.
//
// Moments are stored as UTC text ("2026-10-13T07:00:00Z"), which sorts as time does. What a person means by
// "09:00" is decided by their own time zone, at planning time.

const db = require('../db');
const { ValidationError, isDate } = require('./validate');
const { addDays } = require('./dates');
const { canAccessTask } = require('./taskAccess');

// Minutes before the due moment that the interface offers.
const OFFSETS = [0, 60, 300, 720, 1440, 4320, 7200, 10080];
const MODES = ['default', 'none', 'custom'];
const DEFAULT_PREFS = Object.freeze({
  dateOnlyTime: '09:00', // when a date without a time "happens"
  taskTimed: 60, // a task with a time: one hour before
  taskDate: 0, // a task with a date only: that day, at dateOnlyTime
  bill: 4320, // three days before
  milestone: 1440, // one day before
  goal: 10080, // a week before, for a goal that has no dated step
});
const KINDS = ['taskTimed', 'taskDate', 'bill', 'milestone', 'goal'];
// The date at the start of a stored text, if it is a real day.
const dayOf = (s) => (typeof s === 'string' && isDate(s.slice(0, 10)) ? s.slice(0, 10) : null);
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Kosovo and Albania keep the same clock; IANA has no zone of Prishtina's own.
function fallbackZone() {
  const z = process.env.DEFAULT_TIMEZONE;
  return isZone(z) ? z : 'Europe/Belgrade';
}

const formatters = new Map();
function formatter(zone) {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    formatters.set(zone, f);
  }
  return f;
}

function isZone(zone) {
  if (typeof zone !== 'string' || !zone || zone.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(zone)) return false;
  try {
    formatter(zone);
    return true;
  } catch {
    return false;
  }
}

/** What the clocks of `zone` show at the moment `ms`. */
function wallAt(ms, zone) {
  const p = {};
  for (const part of formatter(zone).formatToParts(new Date(ms))) p[part.type] = part.value;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, asUtc: Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) };
}

function offsetAt(ms, zone) {
  return wallAt(ms, zone).asUtc - Math.floor(ms / 1000) * 1000;
}

/**
 * The moment at which the clocks of `zone` show `date` `time`. On the night the clocks go forward an hour
 * does not exist, and on the night they go back an hour happens twice: in both cases the later moment is
 * taken, so a reminder is never earlier than what was asked for.
 */
function wallToUtc(date, time, zone) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  const first = naive - offsetAt(naive, zone);
  const offset = offsetAt(first, zone);
  const second = naive - offset;
  if (second === first) return first;
  return offsetAt(second, zone) === offset ? second : Math.max(first, second);
}

/**
 * `minutes` before a due moment. Whole days are taken off the calendar (so "three days before at 09:00"
 * stays at 09:00 across a change of clocks) and the rest off the clock.
 */
function remindAt({ date, time }, minutes, zone) {
  const days = Math.floor(minutes / 1440);
  return wallToUtc(addDays(date, -days), time, zone) - (minutes % 1440) * 60000;
}

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

// ---- what a person asked for ----------------------------------------------------------------------------

function prefsOf(user) {
  let stored = {};
  try {
    stored = JSON.parse((user && user.reminder_prefs) || '{}') || {};
  } catch {}
  const out = { ...DEFAULT_PREFS };
  if (TIME_RE.test(stored.dateOnlyTime)) out.dateOnlyTime = stored.dateOnlyTime;
  for (const k of KINDS) if (stored[k] === null || OFFSETS.includes(stored[k])) out[k] = stored[k];
  return out;
}

function zoneOf(user) {
  return user && isZone(user.timezone) ? user.timezone : fallbackZone();
}

/** Checks a change of the defaults from the client; answers only the keys that were given. */
function parsePrefs(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('Invalid reminder settings.');
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'dateOnlyTime') {
      if (typeof value !== 'string' || !TIME_RE.test(value)) throw new ValidationError('Invalid reminder time.', { dateOnlyTime: 'Use HH:MM' });
    } else if (KINDS.includes(key)) {
      if (value !== null && !OFFSETS.includes(value)) throw new ValidationError('Invalid reminder choice.', { [key]: 'Invalid' });
    } else {
      throw new ValidationError('Invalid reminder settings.', { [key]: 'Unknown' });
    }
    out[key] = value;
  }
  return out;
}

/**
 * Checks an item's own choice: { mode: 'default' | 'none' | 'custom', minutesBefore }. Answers undefined
 * when nothing was sent, otherwise the two columns to store.
 */
function parseReminder(input) {
  if (input === undefined) return undefined;
  if (input === null || typeof input !== 'object' || !MODES.includes(input.mode)) throw new ValidationError('Invalid reminder.', { reminder: 'Invalid' });
  if (input.mode !== 'custom') return { mode: input.mode, minutes: null };
  if (!OFFSETS.includes(input.minutesBefore)) throw new ValidationError('Invalid reminder.', { reminder: 'Invalid' });
  return { mode: 'custom', minutes: input.minutesBefore };
}

function reminderOf(row) {
  const mode = MODES.includes(row.reminder_mode) ? row.reminder_mode : 'default';
  return { mode, minutesBefore: mode === 'custom' ? row.reminder_minutes_before : null };
}

function minutesFor(row, kind, prefs) {
  const { mode, minutesBefore } = reminderOf(row);
  if (mode === 'none') return null;
  if (mode === 'custom' && Number.isInteger(minutesBefore) && minutesBefore >= 0) return minutesBefore;
  return prefs[kind];
}

// ---- what should be planned -----------------------------------------------------------------------------

// A task's start is written by the browser as an instant ("...Z"). Text without a zone is read as the
// person's own clock, never as the server's.
function taskDue(task, zone) {
  const date = dayOf(task.due_date);
  if (!date) return null;
  const s = task.start_time;
  if (typeof s === 'string' && s) {
    if (/(Z|[+-]\d\d:?\d\d)$/i.test(s)) {
      const ms = Date.parse(s);
      if (Number.isFinite(ms)) return { timed: true, key: iso(ms), ...wallAt(ms, zone) };
    } else if (dayOf(s) && TIME_RE.test(s.slice(11, 16))) {
      return { timed: true, key: `${s.slice(0, 10)}T${s.slice(11, 16)}`, date: s.slice(0, 10), time: s.slice(11, 16) };
    }
  }
  return { timed: false, key: date, date };
}

function plan(user, sourceType, sourceId, due, minutes) {
  if (minutes === null || minutes === undefined) return [];
  const zone = zoneOf(user);
  const at = remindAt({ date: due.date, time: due.time || prefsOf(user).dateOnlyTime }, minutes, zone);
  if (!Number.isFinite(at)) return [];
  return [{ userId: user.id, sourceType, sourceId, occurrenceKey: due.key, ruleKey: `before:${minutes}`, scheduledAt: iso(at), timezone: zone }];
}

async function userRow(id) {
  return id == null ? undefined : await db.get('SELECT id, timezone, reminder_prefs FROM users WHERE id = ?', [id]);
}

async function wantedForTask(task) {
  if (!task || task.status === 'completed' || task.status === 'cancelled') return [];
  const out = [];
  // The owner and the person it is assigned to: whoever has to do it. Not the whole circle.
  for (const id of new Set([task.owner_id, task.assigned_to].filter((x) => x != null))) {
    if (!await canAccessTask(id, task)) continue;
    const user = await userRow(id);
    if (!user) continue;
    const due = taskDue(task, zoneOf(user));
    if (!due) continue;
    out.push(...plan(user, 'task', task.id, due, minutesFor(task, due.timed ? 'taskTimed' : 'taskDate', prefsOf(user))));
  }
  return out;
}

async function wantedForBill(bill) {
  const date = bill && dayOf(bill.due_date);
  if (!date || bill.status !== 'unpaid') return [];
  const user = await userRow(bill.owner_id);
  if (!user) return [];
  return plan(user, 'bill', bill.id, { key: date, date }, minutesFor(bill, 'bill', prefsOf(user)));
}

async function wantedForGoal(goal, milestones) {
  if (!goal || goal.status !== 'active') return [];
  const user = await userRow(goal.owner_id);
  if (!user) return [];
  const prefs = prefsOf(user);
  const out = [];
  const dated = milestones.filter((m) => dayOf(m.due_date));
  for (const m of dated) {
    if (m.done) continue;
    const date = dayOf(m.due_date);
    out.push(...plan(user, 'milestone', m.id, { key: date, date }, prefs.milestone));
  }
  // A goal whose steps have dates is followed step by step; its own date is announced only when it has none.
  const date = dayOf(goal.target_date);
  if (!dated.length && date) {
    out.push(...plan(user, 'goal', goal.id, { key: date, date }, minutesFor(goal, 'goal', prefs)));
  }
  return out;
}

// ---- making the table agree -----------------------------------------------------------------------------

const keyOf = (r) => `${r.userId ?? r.user_id}|${r.sourceType ?? r.source_type}|${r.sourceId ?? r.source_id}|${r.occurrenceKey ?? r.occurrence_key}|${r.ruleKey ?? r.rule_key}`;

/**
 * Makes the pending rows of the items in `scope` equal to `wanted`. Rows that were sent, or that a worker
 * holds, are never touched, so a reminder that went out is not sent again when its item is edited back.
 * A reminder whose moment has already passed is not planned: somebody who writes at 10:00 a task due today
 * does not need to be told at once that it is due today.
 */
async function reconcile(scope, wanted, now = Date.now()) {
  const nowIso = iso(now);
  await db.tx(async () => {
    const existing = [];
    for (const { type, id } of scope) {
      existing.push(...await db.all(
        "SELECT id, user_id, source_type, source_id, occurrence_key, rule_key, scheduled_at, timezone, status FROM planned_reminders WHERE source_type = ? AND source_id = ? AND status IN ('pending','cancelled')",
        [type, id]
      ));
    }
    const wantedByKey = new Map(wanted.map((w) => [keyOf(w), w]));
    const seen = new Set();
    for (const row of existing) {
      const w = wantedByKey.get(keyOf(row));
      seen.add(keyOf(row));
      if (!w) {
        if (row.status === 'pending') await db.run("UPDATE planned_reminders SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ? AND status = 'pending'", [row.id]);
      } else if (row.status === 'pending') {
        if (row.scheduled_at !== w.scheduledAt || row.timezone !== w.timezone) {
          await db.run("UPDATE planned_reminders SET scheduled_at = ?, timezone = ? WHERE id = ? AND status = 'pending'", [w.scheduledAt, w.timezone, row.id]);
        }
      } else if (w.scheduledAt > nowIso) {
        await db.run("UPDATE planned_reminders SET status = 'pending', cancelled_at = NULL, scheduled_at = ?, timezone = ? WHERE id = ? AND status = 'cancelled'", [w.scheduledAt, w.timezone, row.id]);
      }
    }
    for (const w of wanted) {
      if (seen.has(keyOf(w)) || w.scheduledAt <= nowIso) continue;
      // A row with this key that was already sent, or is held by a worker, stays as it is.
      await db.run(
        `INSERT INTO planned_reminders (user_id, source_type, source_id, occurrence_key, rule_key, scheduled_at, timezone)
         VALUES (?,?,?,?,?,?,?) ON CONFLICT (user_id, source_type, source_id, occurrence_key, rule_key) DO NOTHING`,
        [w.userId, w.sourceType, w.sourceId, w.occurrenceKey, w.ruleKey, w.scheduledAt, w.timezone]
      );
    }
  });
}

// Each replan reads its item while holding a lock on the item's row, in the transaction that then writes
// the plan. Two replans of one item therefore run one after the other and the later one sees the item as
// the earlier left it: an older picture of the item can never be written over a newer plan. Called from a
// route that changed the item in the same transaction, the plan and the change stand or fall together.
async function replanTask(taskId, now) {
  await db.tx(async () => {
    const task = await db.get('SELECT * FROM tasks WHERE id = ? FOR UPDATE', [taskId]);
    if (!task) return forget('task', taskId);
    await reconcile([{ type: 'task', id: task.id }], await wantedForTask(task), now);
  });
}

async function replanBill(billId, now) {
  await db.tx(async () => {
    const bill = await db.get('SELECT * FROM bills WHERE id = ? FOR UPDATE', [billId]);
    if (!bill) return forget('bill', billId);
    await reconcile([{ type: 'bill', id: bill.id }], await wantedForBill(bill), now);
  });
}

/** A goal and its steps are planned together: whether the goal's own date is announced depends on them. */
async function replanGoal(goalId, now) {
  await db.tx(async () => {
    // Every change of a step replans its goal, so the goal's row is the lock for its steps too.
    const goal = await db.get('SELECT * FROM goals WHERE id = ? FOR UPDATE', [goalId]);
    if (!goal) return forget('goal', goalId);
    const milestones = await db.all('SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY id', [goal.id]);
    await forgetLostMilestones(goal.owner_id);
    await reconcile([{ type: 'goal', id: goal.id }, ...milestones.map((m) => ({ type: 'milestone', id: m.id }))], await wantedForGoal(goal, milestones), now);
  });
}

/**
 * After a person changed their time zone or their defaults, or lost access to a circle. Also what repairs a
 * person's plan from nothing: it derives every row again from the items themselves. Items are taken in the
 * order of their ids, so that two of these running at once cannot wait on each other.
 */
async function replanUser(userId, now) {
  await db.tx(async () => {
    await forgetLost(userId);
    const tasks = await db.all(
      `SELECT id FROM tasks WHERE (owner_id = ? OR assigned_to = ?) AND due_date IS NOT NULL AND status NOT IN ('completed','cancelled')
       UNION SELECT source_id AS id FROM planned_reminders WHERE user_id = ? AND source_type = 'task' AND status = 'pending'
       ORDER BY id`,
      [userId, userId, userId]
    );
    for (const t of tasks) await replanTask(t.id, now);
    for (const b of await db.all("SELECT id FROM bills WHERE owner_id = ? AND status = 'unpaid' ORDER BY id", [userId])) await replanBill(b.id, now);
    for (const g of await db.all("SELECT id FROM goals WHERE owner_id = ? AND status = 'active' ORDER BY id", [userId])) await replanGoal(g.id, now);
  });
}

/** The item is gone: so are its rows, whatever their state. */
async function forget(sourceType, sourceId) {
  await db.run('DELETE FROM planned_reminders WHERE source_type = ? AND source_id = ?', [sourceType, sourceId]);
}

// Steps disappear with their goal (ON DELETE CASCADE), without anybody naming them here.
async function forgetLostMilestones(userId) {
  await db.run("DELETE FROM planned_reminders WHERE user_id = ? AND source_type = 'milestone' AND source_id NOT IN (SELECT id FROM goal_milestones)", [userId]);
}

// Rows of one person whose item no longer exists, whatever removed it (the demo data is deleted in bulk).
async function forgetLost(userId) {
  for (const [type, table] of [['task', 'tasks'], ['bill', 'bills'], ['goal', 'goals']]) {
    await db.run(`DELETE FROM planned_reminders WHERE user_id = ? AND source_type = ? AND source_id NOT IN (SELECT id FROM ${table})`, [userId, type]);
  }
  await forgetLostMilestones(userId);
}

async function forgetGoal(goal) {
  await forget('goal', goal.id);
  await forgetLostMilestones(goal.owner_id);
}

module.exports = {
  OFFSETS,
  DEFAULT_PREFS,
  isZone,
  fallbackZone,
  wallAt,
  wallToUtc,
  remindAt,
  prefsOf,
  zoneOf,
  parsePrefs,
  parseReminder,
  reminderOf,
  replanTask,
  replanBill,
  replanGoal,
  replanUser,
  forget,
  forgetGoal,
};
