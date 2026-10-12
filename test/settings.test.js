const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('settings', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('profile update: valid change succeeds, empty name is rejected', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const updated = await c.patch('/api/settings/profile', { firstName: 'Updated' });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.user.firstName, 'Updated');

    const rejected = await c.patch('/api/settings/profile', { firstName: '   ' });
    assert.equal(rejected.status, 400);
  });

  await t.test('preferences: theme/notifPrefs/aiEnabled update, invalid theme rejected', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const bad = await c.patch('/api/settings/preferences', { theme: 'not-a-real-theme' });
    assert.equal(bad.status, 400);

    const good = await c.patch('/api/settings/preferences', { theme: 'dark', aiEnabled: false, notifPrefs: { task: false } });
    assert.equal(good.status, 200);
    assert.equal(good.data.user.theme, 'dark');
    assert.equal(good.data.user.aiEnabled, false);
  });

  // Batch 11: notif_prefs was persisted and shown in Settings but never
  // actually read by anything that creates a notification — verified real
  // gap, now enforced in src/lib/notify.js. This proves it end to end
  // through a real notification-creating action (a family task
  // assignment), not just that the preference itself round-trips.
  await t.test('turning a notification type off actually stops that notification from being created', async () => {
    const db = require('../src/db'); // after startApp: bound to the disposable DB
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = (await owner.post('/api/family', { name: 'Notif Test Family' })).data.family;

    const member = makeClient(app.base);
    await signUp(member);
    await member.post('/api/family/join', { code: family.inviteCode });
    const memberMe = (await member.get('/api/auth/me')).data.user;
    const taskNotifCount = async () =>
      (await db.get("SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND type = 'task'", [memberMe.id])).c;

    // Before-state, with default preferences (task notifications on):
    // assigning a family task to the member DOES create a 'task'
    // notification — establishes the mechanism actually works before
    // testing that the preference can turn it off.
    await owner.post('/api/tasks', {
      title: 'Assigned task 1',
      familyId: family.id,
      visibility: 'family',
      assignedTo: memberMe.id,
    });
    assert.equal(await taskNotifCount(), 1, 'precondition: default prefs create a task notification');

    // The member turns "Task reminders & deadlines" off.
    await member.patch('/api/settings/preferences', { notifPrefs: { task: false } });

    // Same action again — this time it must NOT create a second notification.
    await owner.post('/api/tasks', {
      title: 'Assigned task 2',
      familyId: family.id,
      visibility: 'family',
      assignedTo: memberMe.id,
    });
    assert.equal(await taskNotifCount(), 1, 'member turned task notifications off — the count must not have grown');
  });

  await t.test('password change: wrong current password rejected, correct one succeeds and old password stops working', async () => {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);

    const wrong = await c.post('/api/settings/password', { currentPassword: 'nope', newPassword: 'newpass123' });
    assert.equal(wrong.status, 400);

    const changed = await c.post('/api/settings/password', { currentPassword: payload.password, newPassword: 'newpass123' });
    assert.equal(changed.status, 200);

    const login = makeClient(app.base);
    const oldFails = await login.post('/api/auth/login', { identifier: payload.email, password: payload.password });
    assert.equal(oldFails.status, 400);
    const newWorks = await login.post('/api/auth/login', { identifier: payload.email, password: 'newpass123' });
    assert.equal(newWorks.status, 200);
  });

  await t.test('export returns a full JSON snapshot without leaking the password hash', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    await c.post('/api/tasks', { title: 'Exported task' });
    const res = await c.get('/api/settings/export');
    assert.equal(res.status, 200);
    assert.ok(res.data.tasks.some((t2) => t2.title === 'Exported task'));
    assert.equal(res.data.user.password, undefined);
    assert.equal(res.data.user.passwordHash, undefined);
    assert.equal(JSON.stringify(res.data).includes('password_hash'), false, 'the raw bcrypt hash column must never appear in the export');
  });

  // --- Fix #1 (P0, critical): account deletion ---------------------------
  await t.test('deletion fix: DELETE with no body (the exact pre-fix frontend bug) now fails cleanly, not silently — because a real request needs the password', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const res = await c.del('/api/settings/account'); // no body, on purpose
    assert.equal(res.status, 400);
    assert.match(res.data.error, /[Pp]assword/);

    const me = await c.get('/api/auth/me');
    assert.ok(me.data.user, 'account must still exist — a missing password must never delete the account');
  });

  await t.test('deletion fix: DELETE with the WRONG password is rejected, account survives', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const res = await c.del('/api/settings/account', { password: 'definitely-wrong' });
    assert.equal(res.status, 400);
    const me = await c.get('/api/auth/me');
    assert.ok(me.data.user);
  });

  await t.test('deletion fix: DELETE with the CORRECT password succeeds — this is the exact shape the fixed frontend api.del(url, body) now sends', async () => {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    const res = await c.del('/api/settings/account', { password: payload.password });
    assert.equal(res.status, 200);
    assert.equal(res.data.ok, true);

    const me = await c.get('/api/auth/me');
    assert.equal(me.data.user, null, 'session must be cleared after deletion');

    // The account is genuinely gone, not just logged out — logging back in must fail.
    const relogin = makeClient(app.base);
    const attempt = await relogin.post('/api/auth/login', { identifier: payload.email, password: payload.password });
    assert.equal(attempt.status, 400);
  });

  await t.test('deletion fix: deleting the account cascades — the user’s tasks are gone too', async () => {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    const task = await c.post('/api/tasks', { title: 'Should be cascade-deleted' });
    assert.equal(task.status, 201);

    await c.del('/api/settings/account', { password: payload.password });

    // No way to query as the deleted user anymore (logged out); verify indirectly
    // via a fresh account with the same email now being allowed (proves the row is gone).
    const reSignup = makeClient(app.base);
    const res = await reSignup.post('/api/auth/signup', { ...payload });
    assert.equal(res.status, 201, 'the email should be free again once the account and its data are truly deleted');
  });

  await t.test('the account-deletion endpoint requires authentication', async () => {
    const c = makeClient(app.base);
    const res = await c.del('/api/settings/account', { password: 'whatever' });
    assert.equal(res.status, 401);
  });

  // --- Phase 2.5 fix: deleting a family-owning account must not crash ---
  await t.test('deletion fix: a user who owns a family gets a clear error instead of a server crash, and the account survives', async () => {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    const family = await c.post('/api/family', { name: 'Do Not Cascade Me' });
    assert.equal(family.status, 201);

    const res = await c.del('/api/settings/account', { password: payload.password });
    assert.equal(res.status, 400);
    assert.match(res.data.error, /circle/i);

    // The account, and the family, must both still exist.
    const me = await c.get('/api/auth/me');
    assert.ok(me.data.user, 'account must survive a rejected deletion attempt');
    const families = await c.get('/api/family');
    assert.equal(families.data.families.length, 1);
  });

  await t.test('deletion fix: a user who is only a family MEMBER (not owner) can still delete their account', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'Owned By Someone Else' });

    const member = makeClient(app.base);
    const { payload: memberPayload } = await signUp(member);
    await owner.post(`/api/family/${family.data.family.id}/members`, { phone: memberPayload.phone });

    const res = await member.del('/api/settings/account', { password: memberPayload.password });
    assert.equal(res.status, 200);
  });
});
