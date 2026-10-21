// Goal reminders: encouraging lines from local templates (no AI), rotation, only true facts, and a lock screen
// that says one generic sentence unless the person turned on richer text.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { startApp, makeClient, signUp } = require('./helpers');
const { pickMotivation, LINES } = require('../src/lib/motivation');

const b64 = (n) => crypto.randomBytes(n).toString('base64url');
const browser = () => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${b64(24)}`, expirationTime: null, keys: { p256dh: b64(65), auth: b64(16) } });
const ahead = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const TODAY = '2026-07-15';

test('motivation lines (no database)', async (t) => {
  await t.test('never the same line twice in a row, over many picks and for every kind of goal', () => {
    const goals = [
      { category: 'fitness', progress: 40, target_date: '2026-08-01' },
      { category: 'financial', progress: 0, target_date: null },
      { category: 'learning', progress: 100, target_date: '2026-07-15' },
      { category: 'unknown', progress: 0, target_date: null },
    ];
    for (const goal of goals) {
      let last = null;
      for (let i = 0; i < 300; i++) {
        const pick = pickMotivation({ goal, today: TODAY, last });
        assert.notEqual(pick.key, last, `${goal.category}: ${pick.key} repeated`);
        last = pick.key;
      }
    }
  });

  await t.test('variation: a goal gets several different lines over time', () => {
    const seen = new Set();
    let last = null;
    for (let i = 0; i < 80; i++) {
      const p = pickMotivation({ goal: { category: 'habit', progress: 20, target_date: '2026-08-10' }, today: TODAY, last });
      seen.add(p.key);
      last = p.key;
    }
    assert.ok(seen.size >= 6, `only ${seen.size} different lines`);
  });

  await t.test('only true facts: no progress line at 0% or 100%, no days line without a date or beyond 60 days, no step line for a goal', () => {
    const keysFor = (goal, isStep = false) => {
      const keys = new Set();
      for (let i = 0; i < 200; i++) keys.add(pickMotivation({ goal, isStep, today: TODAY, rng: () => i / 200 }).key);
      return keys;
    };
    assert.equal(keysFor({ category: 'habit', progress: 0, target_date: null }).has('progress-n'), false);
    assert.equal(keysFor({ category: 'habit', progress: 100, target_date: null }).has('progress-n'), false);
    assert.equal(keysFor({ category: 'habit', progress: 50, target_date: null }).has('progress-n'), true);
    assert.equal([...keysFor({ category: 'habit', progress: 0, target_date: null })].some((k) => k.startsWith('days')), false);
    assert.equal([...keysFor({ category: 'habit', progress: 0, target_date: '2027-12-31' })].some((k) => k.startsWith('days')), false);
    assert.equal([...keysFor({ category: 'habit', progress: 0, target_date: '2026-07-10' })].some((k) => k.startsWith('days')), false, 'a date in the past gets no days-left line');
    assert.equal([...keysFor({ category: 'habit', progress: 0, target_date: '2026-07-15' })].includes('days-today'), true);
    assert.equal([...keysFor({ category: 'habit', progress: 0 })].some((k) => k.startsWith('step')), false);
    assert.equal([...keysFor({ category: 'habit', progress: 0 }, true)].some((k) => k.startsWith('step')), true);
    const days = pickMotivation({ goal: { category: 'x', progress: 0, target_date: '2026-07-25' }, today: TODAY, rng: () => 0.999 });
    for (let i = 0; i < 100; i++) {
      const p = pickMotivation({ goal: { category: 'x', progress: 0, target_date: '2026-07-25' }, today: TODAY, rng: () => i / 100 });
      if (p.key === 'days-n') assert.match(p.text, /^10 days to your target date/);
    }
    assert.ok(days.text);
    // No line pretends to know a streak: the app has no such data.
    assert.equal(LINES.some((l) => /streak|in a row/i.test(l.text({ daysLeft: 3, progress: 10 }))), false);
  });

  await t.test('no guilt, no pressure, no goal name, no money or health detail; short and plain enough for a lock screen', () => {
    for (const l of LINES) {
      const text = l.text({ daysLeft: 12, progress: 45, category: 'x' });
      assert.doesNotMatch(text, /behind|late\b|failed|failure|lazy|should have|disappoint|guilt|ashamed|wasted|too long|give up|deadline/i, text);
      assert.doesNotMatch(text, /[€$£]|\bmoney\b|\bdebt\b|\bweight\b|\bdiet\b|\bmedic|\bpill|\bdoctor|\bhealth/i, `${l.key}: ${text}`);
      assert.match(text, /^[\p{L}\p{N} .,!?'%:-]{1,120}$/u, `${l.key} must fit a lock-screen payload`);
    }
  });
});

test('goal reminders on the device: generic by default, richer only when turned on, with the AI off', async (t) => {
  const keys = require('web-push').generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  process.env.PUSH_STORE_KEY = b64(32);
  process.env.GROQ_API_KEY = '';
  process.env.ANTHROPIC_API_KEY = '';
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const push = require('../src/lib/push');
  const worker = require('../src/lib/reminderWorker');
  const sent = [];
  t.after(push.setSender(async (sub, payload) => sent.push(JSON.parse(payload))));
  const dueOf = (row) => Date.parse(row.scheduled_at) + 1000;
  async function person() {
    const c = makeClient(app.base);
    const { res } = await signUp(c);
    await c.post('/api/push/subscription', browser());
    await c.patch('/api/settings/reminders', { timezone: 'Europe/Budapest' });
    return { c, id: res.data.user.id };
  }
  async function runGoal(c, id, title, extra = {}) {
    const goal = (await c.post('/api/goals', { title, category: 'fitness', targetDate: ahead(60), ...extra })).data.goal;
    const row = await db.get("SELECT * FROM planned_reminders WHERE user_id = ? AND source_type = 'goal' AND source_id = ? AND status = 'pending'", [id, goal.id]);
    sent.length = 0;
    assert.equal((await worker.runDue({ now: dueOf(row) })).sent, 1);
    return { goal, bell: await db.get("SELECT * FROM notifications WHERE user_id = ? AND type = 'goal' ORDER BY id DESC LIMIT 1", [id]) };
  }

  await t.test('default: the push is the fixed kind only; the goal name and the line stay inside the app', async () => {
    const { c, id } = await person();
    const { bell } = await runGoal(c, id, 'Lose weight for my surgery');
    assert.equal(sent.length, 1);
    assert.deepEqual(Object.keys(sent[0]).sort(), ['g', 'k', 'u']);
    assert.equal(sent[0].k, 'goal');
    assert.equal(JSON.stringify(sent[0]).includes('surgery'), false);
    assert.match(bell.body, /Lose weight for my surgery/, 'inside the app the goal is named');
    assert.ok(bell.template_key, 'the line chosen is remembered');
    assert.match(fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8'), /goal: 'Time for a small step toward your goal\.'/);
  });

  await t.test('richer text is carried only after the person turned it on, and never names the goal', async () => {
    const { c, id } = await person();
    await c.patch('/api/settings/preferences', { notifPrefs: { richPush: true } });
    const { bell } = await runGoal(c, id, 'Secret health goal');
    assert.equal(sent.length, 1);
    assert.equal(typeof sent[0].m, 'string');
    assert.equal(JSON.stringify(sent[0]).includes('health'), false);
    assert.ok(bell.body.endsWith(sent[0].m), 'the lock screen line is the very line shown in the app');
  });

  await t.test('turning richer text off stops it at once, even for a push that was already owed', async () => {
    const { c, id } = await person();
    await c.patch('/api/settings/preferences', { notifPrefs: { richPush: true } });
    const goal = (await c.post('/api/goals', { title: 'Owed', category: 'habit', targetDate: ahead(60) })).data.goal;
    const row = await db.get("SELECT * FROM planned_reminders WHERE user_id = ? AND source_type = 'goal' AND source_id = ?", [id, goal.id]);
    // Hold the push back by making the first attempt fail, then turn it off, then let the retry go out.
    const restore = push.setSender(async () => {
      throw Object.assign(new Error('down'), { statusCode: 500 });
    });
    await worker.runDue({ now: dueOf(row) });
    restore();
    await c.patch('/api/settings/preferences', { notifPrefs: { richPush: false } });
    sent.length = 0;
    await db.run("UPDATE notifications SET push_retry_at = '2000-01-01 00:00:00' WHERE user_id = ?", [id]);
    await require('../src/lib/notify').retryPushes();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].m, undefined);
  });

  await t.test('consecutive goal reminders for one person never repeat a line', async () => {
    const { c, id } = await person();
    const keysSeen = [];
    for (let i = 0; i < 8; i++) {
      const { bell } = await runGoal(c, id, `Goal ${i}`);
      keysSeen.push(bell.template_key);
    }
    for (let i = 1; i < keysSeen.length; i++) assert.notEqual(keysSeen[i], keysSeen[i - 1]);
  });

  await t.test('a payload text that is not one of our plain lines is not sent', () => {
    for (const bad of ['<script>alert(1)</script>', 'x'.repeat(200), 'line\nbreak', 'https://evil.example']) {
      assert.equal(JSON.parse(push.payloadOf({ kind: 'goal', text: bad })).m, undefined);
    }
    assert.equal(JSON.parse(push.payloadOf({ kind: 'goal', text: 'A small step today is enough.' })).m, 'A small step today is enough.');
  });
});
