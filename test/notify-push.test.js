// What the owner asked for, in their words: every member of a circle is notified of every message in the
// group, every comment on a task and every new task that somebody of the circle adds; one notification per
// event, at once, to everybody but the one who did it. And reminders reach the device too.
// No push service is called: the sender is replaced and what it was handed is looked at.

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { startApp, makeClient, signUp } = require('./helpers');

const b64 = (n) => crypto.randomBytes(n).toString('base64url');
const browser = () => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${b64(24)}`, expirationTime: null, keys: { p256dh: b64(65), auth: b64(16) } });
const ahead = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

test('notifications on devices: circle events and reminders', async (t) => {
  const keys = require('web-push').generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  process.env.PUSH_STORE_KEY = b64(32);
  process.env.APP_BASE_URL = '';
  process.env.ALLOWED_ORIGINS = '';
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const push = require('../src/lib/push');
  const worker = require('../src/lib/reminderWorker');
  const notify = require('../src/lib/notify');
  // Midday in Kosovo, whatever the hour the suite runs at: quiet hours must not decide the other tests.
  const MIDDAY = Date.parse('2026-07-15T10:00:00Z');
  const NIGHT = Date.parse('2026-07-15T00:30:00Z'); // 02:30 there
  const restoreClock = notify.setClock(() => MIDDAY);
  t.after(() => notify.setClock(restoreClock));
  const pushOf = async (userId) => db.get('SELECT id, push_status, push_attempts, push_retry_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  const due = (id) => db.run("UPDATE notifications SET push_retry_at = '2000-01-01 00:00:00' WHERE id = ?", [id]);

  // Every push that would have left, with whose device it was for.
  const sent = [];
  let fail = false;
  const restore = push.setSender(async (subscription, payload) => {
    if (fail) throw Object.assign(new Error('push service'), { statusCode: 500 });
    sent.push({ endpoint: subscription.endpoint, payload: JSON.parse(payload) });
  });
  t.after(restore);
  t.beforeEach(() => {
    sent.length = 0;
    fail = false;
    notify.setClock(() => MIDDAY);
  });

  async function person(name) {
    const c = makeClient(app.base);
    const { res } = await signUp(c, { firstName: name });
    const device = browser();
    assert.equal((await c.post('/api/push/subscription', device)).status, 201);
    return { c, id: res.data.user.id, name, endpoint: device.endpoint };
  }
  async function circle() {
    const [arta, besnik, drita] = [await person('Arta'), await person('Besnik'), await person('Drita')];
    const family = (await arta.c.post('/api/family', { name: 'Shtëpia' })).data.family;
    for (const p of [besnik, drita]) assert.equal((await p.c.post('/api/family/join', { code: family.inviteCode })).status, 201);
    sent.length = 0;
    return { arta, besnik, drita, family };
  }
  const reached = () => sent.map((s) => s.endpoint).sort();
  const bells = async (userId, type) => db.all('SELECT title, body, link, push_status FROM notifications WHERE user_id = ? AND type = ? ORDER BY id', [userId, type]);

  await t.test('a message in the group: every other member gets one push, the sender none; nothing of the message is in it', async () => {
    const { arta, besnik, drita, family } = await circle();
    const res = await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Kush e merr bukën sot? Kodi i derës është 4471.' });
    assert.equal(res.status, 201);
    assert.deepEqual(reached(), [besnik.endpoint, drita.endpoint].sort());
    for (const s of sent) {
      assert.deepEqual(Object.keys(s.payload).sort(), ['g', 'k', 'u']);
      assert.equal(s.payload.k, 'chat');
      assert.equal(s.payload.u, '/#/family/chat');
      assert.match(s.payload.g, /^n-\d+$/);
      assert.ok(!JSON.stringify(s.payload).includes('4471') && !JSON.stringify(s.payload).includes('Arta'));
    }
    // The words are in the bell, inside the app, and the row says a device was reached.
    const bell = await bells(besnik.id, 'chat');
    assert.equal(bell.length, 1);
    assert.match(bell[0].body, /4471/);
    assert.equal(bell[0].push_status, 'sent');
    assert.equal((await bells(arta.id, 'chat')).length, 0);
  });

  await t.test('five messages in a row are five notifications each: nothing is held back or bundled', async () => {
    const { arta, besnik, drita, family } = await circle();
    for (let i = 1; i <= 5; i++) await arta.c.post(`/api/chat/${family.id}/messages`, { body: `Mesazhi ${i}` });
    assert.equal(sent.length, 10);
    assert.equal(sent.filter((s) => s.endpoint === besnik.endpoint).length, 5);
    assert.equal(sent.filter((s) => s.endpoint === drita.endpoint).length, 5);
    // Each has a tag of its own, so one does not replace another on the device.
    assert.equal(new Set(sent.filter((s) => s.endpoint === besnik.endpoint).map((s) => s.payload.g)).size, 5);
    assert.equal((await bells(besnik.id, 'chat')).length, 5);
  });

  await t.test('a new task of the circle, and a comment on it: every other member, each time', async () => {
    const { arta, besnik, drita, family } = await circle();
    const task = (await besnik.c.post('/api/tasks', { title: 'Paguaj rrymën', familyId: family.id, visibility: 'family', dueDate: ahead(5) })).data.task;
    assert.deepEqual(reached(), [arta.endpoint, drita.endpoint].sort());
    assert.ok(sent.every((s) => s.payload.k === 'task' && s.payload.u === `/#/tasks/${task.id}`));
    assert.ok(!JSON.stringify(sent).includes('rrym'));

    sent.length = 0;
    assert.equal((await drita.c.post(`/api/tasks/${task.id}/comments`, { body: 'E paguaj unë nesër.' })).status, 201);
    assert.deepEqual(reached(), [arta.endpoint, besnik.endpoint].sort());
    assert.ok(sent.every((s) => s.payload.k === 'comment'));
    assert.equal((await bells(arta.id, 'comment')).length, 1);
  });

  await t.test('a private task tells nobody; a task that fails to be stored tells nobody', async () => {
    const { arta, family } = await circle();
    assert.equal((await arta.c.post('/api/tasks', { title: 'Vetëm e imja', familyId: family.id, visibility: 'private' })).status, 201);
    assert.equal((await arta.c.post('/api/tasks', { title: 'Datë e pamundur', familyId: family.id, visibility: 'family', dueDate: '2026-02-31' })).status, 400);
    // Stored half-way and rolled back: the push is sent only after the commit, so there is none.
    await db.exec('ALTER TABLE planned_reminders RENAME TO planned_reminders_away');
    const failed = await arta.c.post('/api/tasks', { title: 'Nuk ruhet', familyId: family.id, visibility: 'family', dueDate: ahead(3) });
    await db.exec('ALTER TABLE planned_reminders_away RENAME TO planned_reminders');
    assert.equal(failed.status, 500);
    assert.equal(sent.length, 0);
    assert.equal((await db.get("SELECT COUNT(*) AS c FROM notifications WHERE body = 'Nuk ruhet'")).c, 0);
  });

  await t.test('somebody who switched a kind off gets neither bell nor push; somebody with no device gets the bell', async () => {
    const { arta, besnik, drita, family } = await circle();
    await besnik.c.patch('/api/settings/preferences', { notifPrefs: { chat: false } });
    await drita.c.del('/api/push/subscription');
    await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'A jeni aty?' });
    assert.equal(sent.length, 0);
    assert.equal((await bells(besnik.id, 'chat')).length, 0);
    assert.deepEqual((await bells(drita.id, 'chat')).map((b) => b.push_status), ['none']);
  });

  await t.test('"mute this circle": the bell still fills, the device stays quiet, for that person and that circle only, and it ends', async () => {
    const { arta, besnik, drita, family } = await circle();
    assert.equal((await besnik.c.post(`/api/family/${family.id}/mute`, { hours: 8 })).status, 200);
    await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Gjatë qetësisë' });
    assert.deepEqual(reached(), [drita.endpoint]);
    assert.deepEqual((await bells(besnik.id, 'chat')).map((b) => b.push_status), ['muted']);

    // A reminder of his own is not about the circle: it still arrives.
    sent.length = 0;
    const own = (await besnik.c.post('/api/tasks', { title: 'E imja', dueDate: ahead(10) })).data.task;
    const row = await db.get("SELECT scheduled_at FROM planned_reminders WHERE source_type = 'task' AND source_id = ?", [own.id]);
    await worker.runDue({ now: Date.parse(row.scheduled_at) + 1000 });
    assert.deepEqual(reached(), [besnik.endpoint]);

    // Over (as if the eight hours had passed), or lifted by hand.
    sent.length = 0;
    await db.run("UPDATE family_members SET muted_until = '2000-01-01 00:00:00' WHERE user_id = ?", [besnik.id]);
    await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Pas qetësisë' });
    assert.deepEqual(reached(), [besnik.endpoint, drita.endpoint].sort());
    await besnik.c.post(`/api/family/${family.id}/mute`, { hours: 1 });
    assert.equal((await besnik.c.del(`/api/family/${family.id}/mute`)).data.mutedUntil, null);
    sent.length = 0;
    await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Pas heqjes' });
    assert.equal(sent.length, 2);

    assert.equal((await besnik.c.post(`/api/family/${family.id}/mute`, { hours: 500 })).status, 400);
    const stranger = await person('Tjetri');
    assert.equal((await stranger.c.post(`/api/family/${family.id}/mute`, { hours: 8 })).status, 403);
  });

  await t.test('a push service that is down never fails the message; the push stays owed and the clock sends it once the service is back', async () => {
    const { arta, besnik, drita, family } = await circle();
    fail = true;
    const res = await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Shërbimi ka rënë' });
    assert.equal(res.status, 201);
    assert.equal((await db.get('SELECT COUNT(*) AS c FROM messages WHERE family_id = ?', [family.id])).c, 1);
    const owed = await pushOf(besnik.id);
    assert.equal(owed.push_status, 'pending');
    assert.equal(owed.push_attempts, 1);
    assert.ok(owed.push_retry_at, 'nobody tries it again at once');

    // Too early: the row is still held by the attempt that failed.
    fail = false;
    assert.equal((await notify.retryPushes()).tried, 0);
    assert.equal(sent.length, 0);

    // The two minutes are over.
    await due(owed.id);
    await due((await pushOf(drita.id)).id);
    const out = await notify.retryPushes();
    assert.equal(out.tried, 2);
    assert.equal(out.sent, 2);
    assert.deepEqual(reached(), [besnik.endpoint, drita.endpoint].sort());
    assert.equal((await pushOf(besnik.id)).push_status, 'sent');
    // And only once.
    assert.equal((await notify.retryPushes()).tried, 0);
    assert.equal(sent.length, 2);
  });

  await t.test('a push is tried three times and then given up; a message that is no longer news is closed unsent', async () => {
    const { arta, besnik, drita, family } = await circle();
    fail = true;
    await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Tri herë' });
    const owed = await pushOf(besnik.id);
    await due(owed.id);
    assert.equal(await notify.deliverPush(owed.id), 'retry');
    await due(owed.id);
    assert.equal(await notify.deliverPush(owed.id), 'failed');
    assert.deepEqual([(await pushOf(besnik.id)).push_status, (await pushOf(besnik.id)).push_attempts], ['failed', notify.MAX_PUSH_ATTEMPTS]);
    assert.equal(await notify.deliverPush(owed.id), null, 'what is closed is not tried again');

    // Drita's is still owed, and by now forty minutes old.
    fail = false;
    const old = await pushOf(drita.id);
    await db.run("UPDATE notifications SET created_at = datetime('now', '-40 minutes'), push_retry_at = NULL WHERE id = ?", [old.id]);
    const out = await notify.retryPushes();
    assert.equal(out.expired, 1);
    assert.equal(sent.length, 0);
    assert.equal((await pushOf(drita.id)).push_status, 'expired');
  });

  await t.test('a push that was never attempted (the server stopped after storing the event) is sent by the clock; two attempts at once send one', async () => {
    const { besnik, family } = await circle();
    const insert = () => db.run("INSERT INTO notifications (user_id, type, title, link, family_id, push_status) VALUES (?, 'chat', 'Arta sent a message', '#/family/chat', ?, 'pending')", [besnik.id, family.id]);
    await insert();
    const out = await notify.retryPushes();
    assert.deepEqual([out.tried, out.sent], [1, 1]);
    assert.deepEqual(reached(), [besnik.endpoint]);

    sent.length = 0;
    const id = (await insert()).lastInsertRowid;
    const both = await Promise.all([notify.deliverPush(id), notify.deliverPush(id)]);
    assert.deepEqual(both.sort(), [null, 'sent'].sort());
    assert.equal(sent.length, 1);
  });

  await t.test('somebody who left the circle before the push went out is not told', async () => {
    const { arta, besnik, family } = await circle();
    fail = true;
    await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Para largimit' });
    const owed = await pushOf(besnik.id);
    assert.equal((await besnik.c.post(`/api/family/${family.id}/leave`, {})).status, 200);
    fail = false;
    await due(owed.id);
    assert.equal(await notify.deliverPush(owed.id), 'left');
    assert.ok(!reached().includes(besnik.endpoint));
  });

  await t.test('a circle is told at once at night too; for somebody who chose quiet circles the bell fills and the device stays silent, and nothing is sent in the morning', async () => {
    const { arta, besnik, drita, family } = await circle();
    // Drita changed nothing: the default. Besnik chose quiet circles.
    assert.equal((await besnik.c.patch('/api/settings/reminders', { defaults: { quietCircles: true } })).status, 200);
    notify.setClock(() => NIGHT);
    assert.equal((await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Në orën dy e gjysmë' })).status, 201);
    assert.deepEqual(reached(), [drita.endpoint]);
    const bell = await bells(besnik.id, 'chat');
    assert.deepEqual(bell.map((b) => [b.body, b.push_status]), [['Në orën dy e gjysmë', 'quiet']]);

    // Morning: what was kept quiet is not owed any more.
    notify.setClock(() => MIDDAY);
    sent.length = 0;
    assert.equal((await notify.retryPushes()).tried, 0);
    assert.equal(sent.length, 0);

    // With quiet hours switched off altogether, the night is like the day.
    assert.equal((await besnik.c.patch('/api/settings/reminders', { defaults: { quietOn: false } })).status, 200);
    notify.setClock(() => NIGHT);
    await arta.c.post(`/api/chat/${family.id}/messages`, { body: 'Pa orë të qeta' });
    assert.deepEqual(reached(), [besnik.endpoint, drita.endpoint].sort());
  });

  await t.test('a reminder that is due reaches the device once, as a reminder, after its bell row is stored', async () => {
    const me = await person('Era');
    const task = (await me.c.post('/api/tasks', { title: 'Rinovo pasaportën', dueDate: ahead(10) })).data.task;
    const row = await db.get("SELECT scheduled_at FROM planned_reminders WHERE source_type = 'task' AND source_id = ?", [task.id]);
    const out = await worker.runDue({ now: Date.parse(row.scheduled_at) + 1000 });
    assert.equal(out.sent, 1);
    assert.deepEqual(sent.map((s) => [s.endpoint, s.payload.k, s.payload.u]), [[me.endpoint, 'reminder', `/#/tasks/${task.id}`]]);
    assert.ok(!JSON.stringify(sent).includes('pasaport'));
    assert.equal((await worker.runDue({ now: Date.parse(row.scheduled_at) + 900000 })).claimed, 0);
    assert.equal(sent.length, 1);
    const bell = await db.all("SELECT push_status FROM notifications WHERE user_id = ? AND title LIKE 'Reminder%'", [me.id]);
    assert.deepEqual(bell.map((b) => b.push_status), ['sent']);
  });

  await t.test('a reminder whose push fails is still in the bell and is not sent to the device again and again', async () => {
    const me = await person('Lira');
    const task = (await me.c.post('/api/tasks', { title: 'Dentisti', dueDate: ahead(10) })).data.task;
    const row = await db.get("SELECT scheduled_at FROM planned_reminders WHERE source_type = 'task' AND source_id = ?", [task.id]);
    fail = true;
    const out = await worker.runDue({ now: Date.parse(row.scheduled_at) + 1000 });
    assert.equal(out.sent, 1, 'the reminder is delivered to the bell; the device is extra');
    assert.deepEqual((await db.all("SELECT push_status, push_attempts FROM notifications WHERE user_id = ? AND title LIKE 'Reminder%'", [me.id])).map((b) => [b.push_status, b.push_attempts]), [['pending', 1]]);
    // The reminder itself is done: the clock does not write a second bell row. Only the push is owed.
    assert.equal((await worker.runDue({ now: Date.parse(row.scheduled_at) + 900000 })).claimed, 0);
    assert.equal((await db.get("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND title LIKE 'Reminder%'", [me.id])).c, 1);
  });
});
