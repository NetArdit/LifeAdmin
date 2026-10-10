// Cross-cutting security/authorization checks that don't belong to one
// specific feature file: unauthorized access, invalid ids/payloads, cross-user
// data isolation, and family-boundary enforcement. Per-feature ownership
// checks (e.g. "a bill belongs to its owner only") also live in their own
// test files close to the feature; this file focuses on the boundary itself.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('security', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('every major protected route rejects an unauthenticated request with 401, not a crash or empty-but-200', async () => {
    const c = makeClient(app.base);
    const routes = [
      ['get', '/api/dashboard'],
      ['get', '/api/tasks'],
      ['get', '/api/family'],
      ['get', '/api/bills'],
      ['get', '/api/decisions'],
      ['get', '/api/goals'],
      ['get', '/api/ecolife'],
      ['get', '/api/timeline'],
      ['get', '/api/search?q=xx'],
      ['get', '/api/notifications'],
      ['get', '/api/settings/export'],
      ['post', '/api/demo/seed'],
    ];
    for (const [method, path] of routes) {
      const res = method === 'get' ? await c.get(path) : await c.post(path);
      assert.equal(res.status, 401, `${method.toUpperCase()} ${path} should require auth`);
    }
  });

  await t.test('non-numeric / nonexistent resource ids return a clean 400 or 404, never a 500', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const notFoundChecks = [
      c.get('/api/tasks/999999'),
      c.get('/api/bills/id-not-a-number' /* invalid, non-numeric */),
      c.get('/api/decisions/999999'),
      c.get('/api/goals/999999'),
    ];
    const results = await Promise.all(notFoundChecks);
    for (const res of results) {
      assert.ok([400, 404].includes(res.status), `expected 400/404, got ${res.status}`);
    }
  });

  await t.test('a user cannot read, modify, or delete another user’s task', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const task = await owner.post('/api/tasks', { title: 'Owner-only task' });
    const id = task.data.task.id;

    const stranger = makeClient(app.base);
    await signUp(stranger);

    const read = await stranger.get(`/api/tasks/${id}`);
    assert.equal(read.status, 404);

    const patch = await stranger.patch(`/api/tasks/${id}`, { title: 'Hijacked' });
    assert.equal(patch.status, 404);

    const del = await stranger.del(`/api/tasks/${id}`);
    assert.equal(del.status, 404);

    // Confirm nothing actually changed.
    const stillIntact = await owner.get(`/api/tasks/${id}`);
    assert.equal(stillIntact.data.task.title, 'Owner-only task');
  });

  await t.test('family boundary: a non-member cannot read family details, members, chat, shopping list, or activity', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'Boundary Family' });
    const familyId = family.data.family.id;

    const outsider = makeClient(app.base);
    await signUp(outsider);

    const detail = await outsider.get(`/api/family/${familyId}`);
    assert.equal(detail.status, 403);

    const chat = await outsider.get(`/api/chat/${familyId}/messages`);
    assert.equal(chat.status, 403);

    const shopping = await outsider.get(`/api/family/${familyId}/shopping`);
    assert.equal(shopping.status, 403);

    const activity = await outsider.get(`/api/family/${familyId}/activity`);
    assert.equal(activity.status, 403);

    const addMember = await outsider.post(`/api/family/${familyId}/members`, { phone: '+38344000000' });
    assert.equal(addMember.status, 403);
  });

  await t.test('family boundary: a private task is never returned by another family’s member, even if they are the assignee of nothing', async () => {
    const a = makeClient(app.base);
    await signUp(a);
    const familyA = await a.post('/api/family', { name: 'Family A' });
    await a.post('/api/tasks', { title: 'Family A private-ish task', familyId: familyA.data.family.id, visibility: 'private' });

    const b = makeClient(app.base);
    await signUp(b);
    await b.post('/api/family', { name: 'Family B' });
    const bTasks = await b.get('/api/tasks');
    assert.equal(bTasks.data.tasks.length, 0);
  });

  await t.test('malformed JSON body is rejected cleanly, not a server crash', async () => {
    const res = await fetch(`${app.base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    });
    assert.ok(res.status >= 400 && res.status < 500, `expected a 4xx for malformed JSON, got ${res.status}`);
    // The server must still be responsive afterward.
    const stillAlive = await fetch(`${app.base}/api/config`);
    assert.equal(stillAlive.status, 200);
  });

  await t.test('SQL-injection-shaped input in a search query is treated as a literal string, not executed', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    await c.post('/api/tasks', { title: "Normal task" });
    const res = await c.get(`/api/search?q=${encodeURIComponent("' OR '1'='1")}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.results, [], 'a literal SQLi-shaped string should just find nothing, not return every row');
  });

  await t.test('destructive operation (family member removal) is restricted to owner/admin roles', async () => {
    const owner = makeClient(app.base);
    await signUp(owner);
    const family = await owner.post('/api/family', { name: 'Removal Family' });
    const familyId = family.data.family.id;
    const added = await owner.post(`/api/family/${familyId}/members`, { phone: '+38344222333' });

    const plainMember = makeClient(app.base);
    const { payload: memberPayload } = await signUp(plainMember);
    await owner.post(`/api/family/${familyId}/members`, { phone: memberPayload.phone });

    const forbidden = await plainMember.del(`/api/family/${familyId}/members/${added.data.member.id}`);
    assert.equal(forbidden.status, 403);
  });
});
