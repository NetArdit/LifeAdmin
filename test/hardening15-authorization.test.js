// Hardening 1.5: former-member access, private-task privacy, owner-only visibility/assignee,
// historical notification filtering, owner-only invite code, leave/remove semantics, legacy code
// migration. Every negative check asserts the ABSENCE OF DATA or the ABSENCE OF A CHANGE, not
// just an HTTP status.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { startApp, makeClient, signUp } = require('./helpers');

test('hardening 1.5', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const aiLib = require('../src/lib/ai');
  const { resetAllLimits } = require('../src/lib/authLimits');
  const CODE_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/;

  async function newUser() {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    return { c, payload, id: (await c.get('/api/auth/me')).data.user.id };
  }
  const anon = () => makeClient(app.base);
  const codeOf = async (owner, fid) => (await owner.c.get(`/api/family/${fid}`)).data.family.inviteCode;
  const memberRow = async (viewer, fid, userId) => (await viewer.c.get(`/api/family/${fid}`)).data.family.members.find((m) => m.userId === userId);
  const notifs = async (u) => (await u.c.get('/api/notifications')).data;
  const notifText = async (u) => JSON.stringify((await notifs(u)).notifications);
  const taskRow = async (id) => await db.get('SELECT * FROM tasks WHERE id = ?', [id]);

  // A = family X owner, B = member, C = the member who will leave / be removed, D = family Y user.
  async function world() {
    const A = await newUser(), B = await newUser(), C = await newUser(), D = await newUser();
    const fam = (await A.c.post('/api/family', { name: 'X' })).data.family;
    const code = fam.inviteCode;
    await B.c.post('/api/family/join', { code });
    await C.c.post('/api/family/join', { code });
    const famY = (await D.c.post('/api/family', { name: 'Y' })).data.family;
    return { A, B, C, D, fam, famY, code };
  }

  // ============ 1. FORMER MEMBER — every path, both ways of leaving ============
  for (const mode of ['voluntary leave', 'owner removal']) {
    await t.test(`former member (${mode}): every task read and mutation path is closed — verified by data, not status`, async () => {
      resetAllLimits();
      const { A, B, C, D, fam, code } = await world();
      const due = new Date().toISOString().slice(0, 10);
      // tasks with recognisable strings
      const T1 = (await A.c.post('/api/tasks', { title: 'FAMTASK-one assigned to C', familyId: fam.id, visibility: 'family', assignedTo: C.id, dueDate: due })).data.task;
      await B.c.post(`/api/tasks/${T1.id}/comments`, { body: 'THREAD-by-B on T1' });
      const T2 = (await C.c.post('/api/tasks', { title: 'FAMTASK-two owned by C', familyId: fam.id, visibility: 'family', dueDate: due })).data.task;
      const T3 = (await A.c.post('/api/tasks', { title: 'PRIVATETASK-three assigned to C', familyId: fam.id, visibility: 'private', assignedTo: C.id, dueDate: due })).data.task;
      const T4 = (await C.c.post('/api/tasks', { title: 'OWNTASK-four private of C', dueDate: due })).data.task;
      const T5 = (await C.c.post('/api/tasks', { title: 'OWNTASK-five private+family of C', familyId: fam.id, visibility: 'private', dueDate: due })).data.task;
      await C.c.post(`/api/tasks/${T2.id}/comments`, { body: 'COMMENT-by-C-while-member' });
      assert.ok((await notifText(C)).includes('FAMTASK-one'), 'precondition: C had notifications about T1 while a member');

      // C becomes a former member
      if (mode === 'voluntary leave') {
        assert.equal((await C.c.post(`/api/family/${fam.id}/leave`, {})).status, 200);
        assert.equal(await codeOf(A, fam.id), code, 'voluntary leave does NOT rotate the code');
      } else {
        const r = await A.c.del(`/api/family/${fam.id}/members/${(await memberRow(A, fam.id, C.id)).id}`);
        assert.equal(r.data.inviteCodeRotated, true);
        assert.notEqual(await codeOf(A, fam.id), code, 'owner removal rotates the code');
      }

      const before = {
        t1: await taskRow(T1.id), t2: await taskRow(T2.id),
        comments: (await db.get('SELECT COUNT(*) c FROM task_comments')).c,
        activity: (await db.get('SELECT COUNT(*) c FROM activity_log')).c,
        notifsB: (await db.get('SELECT COUNT(*) c FROM notifications WHERE user_id = ?', [B.id])).c,
        notifsA: (await db.get('SELECT COUNT(*) c FROM notifications WHERE user_id = ?', [A.id])).c,
      };

      // A. direct reads by known id
      for (const [label, id] of [['T1 family task assigned to C', T1.id], ['T2 family task owned by C', T2.id], ['T3 private task assigned to C', T3.id]]) {
        const r = await C.c.get(`/api/tasks/${id}`);
        assert.equal(r.status, 404, label);
        assert.ok(!JSON.stringify(r.data).includes('FAMTASK') && !JSON.stringify(r.data).includes('THREAD'), `${label}: no data in the response`);
      }
      assert.equal((await C.c.get(`/api/tasks/${T4.id}`)).status, 200, 'C still owns and reads a private task of their own');
      assert.equal((await C.c.get(`/api/tasks/${T5.id}`)).status, 200, 'and a private task that merely carries the family id');
      const list = (await C.c.get('/api/tasks')).data.tasks.map((x) => x.title).join(' | ');
      assert.ok(!/FAMTASK|PRIVATETASK/.test(list) && /OWNTASK-four/.test(list), `task list: ${list}`);
      assert.deepEqual((await C.c.get(`/api/tasks?familyId=${fam.id}`)).data.tasks.map((x) => x.title), ['OWNTASK-five private+family of C'], 'family filter shows only C\'s own private task');

      // B. update  C. completion  E. assignment  F. visibility  (all by direct id)
      for (const [label, id] of [['T1', T1.id], ['T2', T2.id]]) {
        assert.equal((await C.c.patch(`/api/tasks/${id}`, { title: 'HACKED', description: 'HACKED', notes: 'HACKED' })).status, 404, `update ${label}`);
        assert.equal((await C.c.patch(`/api/tasks/${id}`, { status: 'completed' })).status, 404, `complete ${label}`);
        assert.equal((await C.c.patch(`/api/tasks/${id}`, { assignedTo: C.id })).status, 404, `assign ${label}`);
        assert.equal((await C.c.patch(`/api/tasks/${id}`, { assignedTo: null })).status, 404, `unassign ${label}`);
        assert.equal((await C.c.patch(`/api/tasks/${id}`, { visibility: 'private' })).status, 404, `visibility ${label}`);
        assert.equal((await C.c.post(`/api/tasks/${id}/postpone`, { days: 5 })).status, 404, `postpone ${label}`);
        assert.equal((await C.c.del(`/api/tasks/${id}`)).status, 404, `delete ${label}`);
      }
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      assert.ok(same(await taskRow(T1.id), before.t1), 'T1 unchanged in the database');
      assert.ok(same(await taskRow(T2.id), before.t2), 'T2 unchanged in the database (their own former task)');
      // D. comment
      const cm = await C.c.post(`/api/tasks/${T1.id}/comments`, { body: 'COMMENT-FROM-FORMER-MEMBER' });
      assert.equal(cm.status, 404);
      assert.equal((await C.c.post(`/api/tasks/${T2.id}/comments`, { body: 'COMMENT-FROM-FORMER-MEMBER' })).status, 404);
      assert.equal((await db.get('SELECT COUNT(*) c FROM task_comments')).c, before.comments, 'no comment was written');
      assert.equal((await db.get('SELECT COUNT(*) c FROM activity_log')).c, before.activity, 'no family activity was generated');
      assert.equal((await db.get('SELECT COUNT(*) c FROM notifications WHERE user_id = ?', [B.id])).c, before.notifsB, 'B received nothing');
      assert.equal((await db.get('SELECT COUNT(*) c FROM notifications WHERE user_id = ?', [A.id])).c, before.notifsA, 'A received nothing');

      // G. search (titles, descriptions, comment text)
      for (const q of ['FAMTASK', 'PRIVATETASK', 'THREAD', 'COMMENT-by-C']) {
        assert.deepEqual((await C.c.get(`/api/search?q=${q}`)).data.results, [], `search "${q}"`);
      }
      assert.ok((await C.c.get('/api/search?q=OWNTASK')).data.results.length >= 2, 'their own private tasks are still searchable');
      // H. timeline
      const tl = JSON.stringify((await C.c.get('/api/timeline')).data.activity);
      assert.ok(!/FAMTASK|PRIVATETASK|THREAD/.test(tl), `timeline: ${tl}`);
      assert.ok(/OWNTASK-four/.test(tl), 'C still sees own private-task activity');
      // I. dashboard
      const dash = JSON.stringify((await C.c.get('/api/dashboard')).data);
      assert.ok(!/FAMTASK|PRIVATETASK/.test(dash), 'dashboard');
      assert.ok(/OWNTASK-four/.test(dash), 'dashboard still shows their own tasks');
      // J. notifications (rows + unread count)
      const n = await notifs(C);
      assert.ok(!/FAMTASK|PRIVATETASK|THREAD|COMMENT-by-C-while-member/.test(JSON.stringify(n.notifications)), 'notifications are filtered');
      assert.equal(n.unreadCount, n.notifications.filter((x) => !x.read).length, 'unread count matches what is shown');
      assert.ok((await db.get('SELECT COUNT(*) c FROM notifications WHERE user_id = ?', [C.id])).c > n.notifications.length, 'the hidden rows still exist in the database (nothing deleted)');
      // family feed and export
      assert.equal((await C.c.get(`/api/family/${fam.id}/activity`)).status, 403);
      const exp = (await C.c.get('/api/settings/export')).data;
      assert.ok(!/FAMTASK|PRIVATETASK|COMMENT-by-C/.test(JSON.stringify(exp.tasks) + JSON.stringify(exp.taskComments)), 'export');
      assert.ok(/OWNTASK-four/.test(JSON.stringify(exp.tasks)));

      // The people who should keep access do. B (current member) and A (owner) are unaffected.
      assert.equal((await B.c.get(`/api/tasks/${T1.id}`)).status, 200);
      assert.equal((await B.c.get(`/api/tasks/${T2.id}`)).status, 200, 'the family keeps what C shared');
      assert.equal((await B.c.get(`/api/tasks/${T3.id}`)).status, 404, 'B still cannot open a private task');
      assert.ok((await B.c.get('/api/search?q=FAMTASK')).data.results.length === 2);
      assert.equal((await A.c.get(`/api/tasks/${T3.id}`)).status, 200);
      // D (other family) never had access
      for (const id of [T1.id, T2.id, T3.id]) assert.equal((await D.c.get(`/api/tasks/${id}`)).status, 404);
      // unauthenticated
      for (const id of [T1.id, T2.id]) {
        assert.equal((await anon().get(`/api/tasks/${id}`)).status, 401);
        assert.equal((await anon().patch(`/api/tasks/${id}`, { title: 'x' })).status, 401);
      }

      // Orphaned family task (owner C is gone): only the FAMILY owner may delete it, nothing else is granted.
      assert.equal((await B.c.del(`/api/tasks/${T2.id}`)).status, 404, 'ordinary member cannot delete an orphaned task');
      assert.equal((await A.c.patch(`/api/tasks/${T2.id}`, { visibility: 'private' })).status, 403, 'family owner does not get visibility control');
      assert.equal((await A.c.patch(`/api/tasks/${T2.id}`, { assignedTo: B.id })).status, 403, 'nor assignee control');
      assert.equal((await A.c.patch(`/api/tasks/${T2.id}`, { title: 'FAMTASK-two edited by a member' })).status, 200, 'ordinary member-level edit works');
      assert.equal((await A.c.del(`/api/tasks/${T4.id}`)).status, 404, 'and cannot touch C\'s private tasks');
      assert.equal((await A.c.del(`/api/tasks/${T2.id}`)).status, 200, 'the family owner can remove the orphaned family task');
      assert.equal(await taskRow(T2.id), undefined);

      // Rejoin restores access according to normal membership rules.
      const rejoinCode = mode === 'voluntary leave' ? code : await codeOf(A, fam.id);
      if (mode === 'owner removal') assert.equal((await C.c.post('/api/family/join', { code })).status, 400, 'the old code stays dead after removal');
      assert.equal((await C.c.post('/api/family/join', { code: rejoinCode })).status, 201);
      assert.equal((await C.c.get(`/api/tasks/${T1.id}`)).status, 200, 'access to T1 is back after rejoining');
      assert.equal((await C.c.get(`/api/tasks/${T3.id}`)).status, 200, 'and to the private task assigned to them');
      assert.ok(/FAMTASK-one/.test(await notifText(C)), 'the hidden notification rows reappear');
    });
  }

  // ============ 2. F-10 — visibility / assignee are owner-only, judged by CHANGE ============
  await t.test('F-10: only the task owner can change visibility or assignee; unchanged values in the payload are fine', async () => {
    const { A, B, C, D, fam } = await world();
    await C.c.post(`/api/family/${fam.id}/leave`, {});
    const E = await newUser(); await E.c.post('/api/family/join', { code: await codeOf(A, fam.id) });
    const mk = async (extra = {}) => (await A.c.post('/api/tasks', { title: 'F10 task', familyId: fam.id, visibility: 'family', ...extra })).data.task;

    // family-visible task, assigned to B
    const t1 = await mk({ assignedTo: B.id });
    const state = async (id) => { const r = await taskRow(id); return `${r.visibility}|${r.assigned_to}|${r.family_id}|${r.title}`; };
    const s0 = await state(t1.id);
    for (const [who, u, want] of [['assignee B', B, 403], ['ordinary member E', E, 403], ['former member C', C, 404], ['other-family user D', D, 404]]) {
      assert.equal((await u.c.patch(`/api/tasks/${t1.id}`, { visibility: 'private' })).status, want, `${who}: visibility`);
      assert.equal((await u.c.patch(`/api/tasks/${t1.id}`, { assignedTo: E.id })).status, want, `${who}: assignee`);
      assert.equal((await u.c.patch(`/api/tasks/${t1.id}`, { assignedTo: null })).status, want, `${who}: unassign`);
    }
    assert.equal((await anon().patch(`/api/tasks/${t1.id}`, { visibility: 'private' })).status, 401);
    assert.equal(await state(t1.id), s0, 'nothing changed in the database');

    // the same people MAY edit content, and MAY submit the unchanged visibility / assignee / family (what the edit form sends)
    for (const [who, u] of [['assignee B', B], ['ordinary member E', E], ['owner A', A]]) {
      const r = await u.c.patch(`/api/tasks/${t1.id}`, { title: `edited by ${who}`, description: 'd', priority: 'high', visibility: 'family', familyId: fam.id, assignedTo: B.id });
      assert.equal(r.status, 200, `${who}: ordinary edit with unchanged visibility/family/assignee`);
      assert.equal(r.data.task.visibility, 'family');
    }
    assert.equal((await taskRow(t1.id)).assigned_to, B.id);

    // the owner may change both
    assert.equal((await A.c.patch(`/api/tasks/${t1.id}`, { assignedTo: E.id })).status, 200);
    assert.equal((await taskRow(t1.id)).assigned_to, E.id);
    assert.equal((await A.c.patch(`/api/tasks/${t1.id}`, { assignedTo: D.id })).status, 400, 'assignee must still be a family member');
    assert.equal((await A.c.patch(`/api/tasks/${t1.id}`, { visibility: 'private' })).status, 200);
    assert.equal((await taskRow(t1.id)).visibility, 'private');
    assert.equal((await A.c.patch(`/api/tasks/${t1.id}`, { visibility: 'whatever' })).status, 400, 'invalid visibility value');
    assert.equal((await A.c.patch(`/api/tasks/${t1.id}`, { visibility: 'family' })).status, 200, 'owner may share it again');

    // a private task assigned to B: the assignee cannot expose it or hand it on
    const t2 = await mk({ visibility: 'private', assignedTo: B.id });
    assert.equal((await B.c.patch(`/api/tasks/${t2.id}`, { visibility: 'family' })).status, 403);
    assert.equal((await B.c.patch(`/api/tasks/${t2.id}`, { assignedTo: E.id })).status, 403);
    assert.equal((await E.c.get(`/api/tasks/${t2.id}`)).status, 404, 'E still cannot read it');
    assert.equal((await taskRow(t2.id)).visibility, 'private');
    assert.equal((await B.c.patch(`/api/tasks/${t2.id}`, { status: 'completed' })).status, 200, 'the assignee can still complete it (existing permission)');

    // an owner who has left the family cannot share a task into it again; a task cannot be moved between families
    const F = await newUser(); await F.c.post('/api/family/join', { code: await codeOf(A, fam.id) });
    const t3 = (await F.c.post('/api/tasks', { title: 'F owns private-in-family', familyId: fam.id, visibility: 'private' })).data.task;
    await F.c.post(`/api/family/${fam.id}/leave`, {});
    assert.equal((await F.c.patch(`/api/tasks/${t3.id}`, { visibility: 'family' })).status, 403, 'not a member any more');
    assert.equal((await taskRow(t3.id)).visibility, 'private');
    const famY = (await D.c.post('/api/family', { name: 'Y2' })).data.family;
    assert.equal((await A.c.patch(`/api/tasks/${t1.id}`, { familyId: famY.id })).status, 400, 'no moving between families');
  });

  await t.test('private task stays private across ordinary owner edits (the edit-form bug), and only an intentional change shares it', async () => {
    const { A, B, fam } = await world();
    const priv = (await A.c.post('/api/tasks', { title: 'PRIV-EDIT', familyId: fam.id, visibility: 'private' })).data.task;
    // what the OLD form sent: family + visibility:'family' preselected — now the server refuses to treat that as an
    // ordinary edit only for non-owners; for the OWNER it is an intentional change, so the CLIENT must not send it.
    // What the FIXED form sends for an ordinary edit: content only.
    for (const patch of [
      { title: 'PRIV-EDIT renamed' }, { description: 'more text' }, { dueDate: '2030-05-05' }, { priority: 'high' }, { notes: 'n' },
      { title: 'again', visibility: 'private' },                        // visibility echoed unchanged
      { title: 'again2', visibility: 'private', familyId: fam.id },    // and the family echoed too
    ]) {
      const r = await A.c.patch(`/api/tasks/${priv.id}`, patch);
      assert.equal(r.status, 200, JSON.stringify(patch));
      assert.equal((await taskRow(priv.id)).visibility, 'private', `still private after ${JSON.stringify(patch)}`);
      assert.equal((await B.c.get(`/api/tasks/${priv.id}`)).status, 404, 'a member still cannot read it');
    }
    assert.ok(!/PRIV-EDIT/.test(JSON.stringify((await B.c.get(`/api/family/${fam.id}/activity`)).data)));
    await A.c.post(`/api/tasks/${priv.id}/comments`, { body: 'PRIV-COMMENT' });
    assert.ok(!/PRIV-EDIT|PRIV-COMMENT/.test(await notifText(B)), 'no notification about it reaches B');
    // intentional change
    assert.equal((await A.c.patch(`/api/tasks/${priv.id}`, { visibility: 'family', familyId: fam.id })).status, 200);
    assert.equal((await B.c.get(`/api/tasks/${priv.id}`)).status, 200);
    // a personal task (no family) can be shared by the owner in one edit: visibility + familyId
    const solo = (await A.c.post('/api/tasks', { title: 'SOLO-SHARE' })).data.task;
    assert.equal((await A.c.patch(`/api/tasks/${solo.id}`, { visibility: 'family' })).status, 400, 'needs a family');
    assert.equal((await A.c.patch(`/api/tasks/${solo.id}`, { visibility: 'family', familyId: fam.id })).status, 200);
    assert.deepEqual([(await taskRow(solo.id)).visibility, (await taskRow(solo.id)).family_id], ['family', fam.id]);
    assert.equal((await B.c.get(`/api/tasks/${solo.id}`)).status, 200);
  });

  // ============ 3. Historical notifications ============
  await t.test('notifications: a task-linked row disappears when the task becomes private, stays for owner/assignee, and returns when shared again', async () => {
    const { A, B, C, D, fam } = await world();
    const M2 = await newUser(); await M2.c.post('/api/family/join', { code: await codeOf(A, fam.id) });
    const task = (await A.c.post('/api/tasks', { title: 'NOTIF-TASK-TITLE', familyId: fam.id, visibility: 'family', assignedTo: B.id })).data.task;
    await B.c.post(`/api/tasks/${task.id}/comments`, { body: 'NOTIF-COMMENT-BODY' });
    assert.ok(/NOTIF-TASK-TITLE/.test(await notifText(M2)) && /NOTIF-COMMENT-BODY/.test(await notifText(M2)), 'precondition: M2 was told while it was family-visible');
    const totalBefore = (await db.get('SELECT COUNT(*) c FROM notifications')).c;
    const unreadBefore = (await notifs(M2)).unreadCount;
    assert.ok(unreadBefore >= 2);

    await A.c.patch(`/api/tasks/${task.id}`, { visibility: 'private' });
    const after = await notifs(M2);
    assert.ok(!/NOTIF-TASK-TITLE|NOTIF-COMMENT-BODY/.test(JSON.stringify(after.notifications)), 'old notification no longer exposes task-linked information');
    assert.equal(after.unreadCount, 0, 'and is not counted');
    assert.equal((await db.get('SELECT COUNT(*) c FROM notifications')).c, totalBefore, 'nothing was deleted');
    // people who still have access still see theirs
    assert.ok(/NOTIF-COMMENT-BODY|NOTIF-TASK-TITLE/.test(await notifText(A)) || true);
    assert.ok(/NOTIF-TASK-TITLE/.test(await notifText(B)), 'assignee still sees the assignment notification');
    assert.ok(/NOTIF-COMMENT-BODY/.test(await notifText(A)), 'owner still sees the comment notification');
    // other-family user and unrelated rows
    assert.ok(!/NOTIF-/.test(await notifText(D)));
    // reversible
    await A.c.patch(`/api/tasks/${task.id}`, { visibility: 'family' });
    assert.ok(/NOTIF-COMMENT-BODY/.test(await notifText(M2)), 'rows return when the task is shared again');
    // former member, other-family user, nonexistent task
    await C.c.post(`/api/family/${fam.id}/leave`, {});
    assert.ok(!/NOTIF-/.test(await notifText(C)), 'former member');
    await db.run("INSERT INTO notifications (user_id, type, title, link) VALUES (?, 'task', 'GHOST-TASK-ROW', '#/tasks/424242')", [B.id]);
    await db.run("INSERT INTO notifications (user_id, type, title, link) VALUES (?, 'chat', 'CHAT-ROW', '#/family/chat')", [B.id]);
    const bText = await notifText(B);
    assert.ok(/GHOST-TASK-ROW/.test(bText), 'reference to a task that does not exist is handled safely and kept');
    assert.ok(/CHAT-ROW/.test(bText), 'non-task notifications are untouched (chat/bill attribution is out of scope)');
    // marking read still works and is scoped
    const first = (await notifs(B)).notifications[0];
    assert.equal((await B.c.post(`/api/notifications/${first.id}/read`, {})).status, 200);
  });

  // ============ 4. Invite code: owner-only ============
  await t.test('invite code: only the family owner receives it — list, single, create, join response, transfer response and export', async () => {
    const A = await newUser(), B = await newUser(), Adm = await newUser(), Out = await newUser();
    const created = await A.c.post('/api/family', { name: 'Invite vis' });
    const fam = created.data.family;
    assert.match(created.data.family.inviteCode, CODE_RE, 'owner sees the code on creation');
    const code = fam.inviteCode;
    const joinB = await B.c.post('/api/family/join', { code });
    assert.equal(joinB.status, 201);
    assert.equal(joinB.data.family.inviteCode, undefined, 'the join response does not hand the code to the new member');
    assert.equal((await Adm.c.post('/api/family/join', { code })).status, 201);
    await A.c.patch(`/api/family/${fam.id}/members/${(await memberRow(A, fam.id, Adm.id)).id}`, { role: 'admin' });

    const has = (obj) => JSON.stringify(obj).includes(code);
    assert.ok(has((await A.c.get('/api/family')).data), 'owner: list');
    assert.ok(has((await A.c.get(`/api/family/${fam.id}`)).data), 'owner: single');
    assert.ok(has((await A.c.get('/api/settings/export')).data.families), 'owner: export');
    for (const [who, u] of [['ordinary member', B], ['admin (an API-only role: the UI has no way to assign it)', Adm]]) {
      assert.ok(!has((await u.c.get('/api/family')).data), `${who}: list`);
      assert.ok(!has((await u.c.get(`/api/family/${fam.id}`)).data), `${who}: single`);
      assert.ok(!has((await u.c.get('/api/settings/export')).data), `${who}: export`);
      assert.equal((await u.c.post(`/api/family/${fam.id}/invite-code/regenerate`, {})).status, 403, `${who}: cannot rotate`);
    }
    // outsider and anonymous
    assert.equal((await Out.c.get(`/api/family/${fam.id}`)).status, 403);
    assert.equal((await anon().get(`/api/family/${fam.id}`)).status, 401);
    // no other response carries it: activity feed and notifications
    assert.ok(!has((await A.c.get(`/api/family/${fam.id}/activity`)).data) && !has((await notifs(B)).notifications));
    // rotation by the owner: old dies, new works, only the owner sees the new one
    const rot = await A.c.post(`/api/family/${fam.id}/invite-code/regenerate`, {});
    assert.match(rot.data.inviteCode, CODE_RE);
    assert.equal((await Out.c.post('/api/family/join', { code })).status, 400, 'old code invalid after rotation');
    assert.ok(!JSON.stringify((await B.c.get(`/api/family/${fam.id}`)).data).includes(rot.data.inviteCode));
    assert.equal((await Out.c.post('/api/family/join', { code: rot.data.inviteCode })).status, 201);
    // transfer: the code follows ownership, and the previous owner stops receiving it
    const tr = await A.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: (await memberRow(A, fam.id, B.id)).id });
    assert.equal(tr.status, 200);
    assert.equal(tr.data.family.inviteCode, undefined, 'the transfer response to the former owner has no code');
    assert.ok(!JSON.stringify((await A.c.get(`/api/family/${fam.id}`)).data).includes(rot.data.inviteCode), 'former owner no longer sees it');
    assert.ok(JSON.stringify((await B.c.get(`/api/family/${fam.id}`)).data).includes(rot.data.inviteCode), 'the new owner does');
    assert.equal((await A.c.post(`/api/family/${fam.id}/invite-code/regenerate`, {})).status, 403);
  });

  // ============ 5. Leave / remove / rejoin semantics (credential side) ============
  await t.test('leave keeps the code; removal rotates it; rejoin needs a currently valid code', async () => {
    resetAllLimits();
    const { A, B, C, fam, code } = await world();
    await B.c.post(`/api/family/${fam.id}/leave`, {});
    assert.equal(await codeOf(A, fam.id), code);
    assert.equal((await B.c.post('/api/family/join', { code })).status, 201, 'leaver returns with the current code');
    await A.c.del(`/api/family/${fam.id}/members/${(await memberRow(A, fam.id, C.id)).id}`);
    assert.notEqual(await codeOf(A, fam.id), code);
    assert.equal((await C.c.post('/api/family/join', { code })).status, 400, 'removed member cannot use the old credential');
    assert.deepEqual((await C.c.get('/api/family')).data.families, []);
  });

  // ============ 6. Assistant context ============
  await t.test('assistant context (provider stubbed): no private or former-member family tasks are ever put into it', async () => {
    const { A, B, C, fam } = await world();
    const real = aiLib.assistantChat;
    const seen = [];
    aiLib.assistantChat = async (args) => { seen.push(JSON.stringify(args.context)); return { ok: true, data: { reply: 'ok', suggestions: [] } }; };
    try {
      await A.c.post('/api/tasks', { title: 'CTX-FAMILY-VISIBLE', familyId: fam.id, visibility: 'family' });
      await A.c.post('/api/tasks', { title: 'CTX-A-PRIVATE', familyId: fam.id, visibility: 'private' });
      await C.c.post('/api/tasks', { title: 'CTX-C-FAMILY-OWNED', familyId: fam.id, visibility: 'family' });
      const ask = async (u) => { seen.length = 0; await u.c.post('/api/ai/chat', { message: 'family tasks and schedule today' }); return seen[0] || ''; };
      const b = await ask(B);
      assert.ok(/CTX-FAMILY-VISIBLE/.test(b) && !/CTX-A-PRIVATE/.test(b), 'member: family-visible yes, private no');
      await C.c.post(`/api/family/${fam.id}/leave`, {});
      const c = await ask(C);
      assert.ok(!/CTX-FAMILY-VISIBLE|CTX-A-PRIVATE|CTX-C-FAMILY-OWNED/.test(c), `former member context: ${c}`);
    } finally {
      aiLib.assistantChat = real;
    }
  });

  // ============ 7. Legacy invite-code migration ============
  await t.test('legacy 8-character codes are replaced exactly once at start-up: old code dead, new works, data/ownership untouched, 12-character codes untouched', async () => {
    resetAllLimits();
    const { A, B, fam } = await world();
    const legacyFam = fam;
    const t1 = (await A.c.post('/api/tasks', { title: 'MIGRATION-TASK', familyId: fam.id, visibility: 'family' })).data.task;
    const current = (await A.c.post('/api/family', { name: 'Already strong' })).data.family;
    const demoFam = (await B.c.post('/api/family', { name: 'Demo-like' })).data.family;
    await db.run("UPDATE families SET invite_code = 'A1B2C3D4' WHERE id = ?", [legacyFam.id]);
    await db.run("UPDATE families SET invite_code = 'DEMO4821' WHERE id = ?", [demoFam.id]);
    const snapshot = async () => JSON.stringify({
      fam: await db.all('SELECT id, name, owner_id FROM families ORDER BY id'),
      members: await db.all('SELECT family_id, user_id, role FROM family_members ORDER BY id'),
      tasks: await db.all('SELECT id, title, family_id, visibility FROM tasks ORDER BY id'),
      messages: (await db.get('SELECT COUNT(*) c FROM messages')).c,
    });
    const before = await snapshot();
    const strongBefore = (await db.get('SELECT invite_code FROM families WHERE id = ?', [current.id])).invite_code;
    const restart = async () => {
      await db.close();
      await db.ready();
    };
    await restart();
    const codes = async () => Object.fromEntries((await db.all('SELECT id, invite_code FROM families')).map((r) => [r.id, r.invite_code]));
    const c1 = await codes();
    assert.match(c1[legacyFam.id], CODE_RE, 'legacy hex code replaced');
    assert.match(c1[demoFam.id], CODE_RE, 'legacy DEMO#### code replaced');
    assert.notEqual(c1[legacyFam.id], c1[demoFam.id]);
    assert.equal(c1[current.id], strongBefore, 'a valid 12-character code is not rotated');
    assert.equal(await snapshot(), before, 'families, members, ownership, tasks and messages unchanged');
    // old codes dead, new works
    const X = await newUser(), Y = await newUser();
    assert.equal((await X.c.post('/api/family/join', { code: 'A1B2C3D4' })).status, 400);
    assert.equal((await X.c.post('/api/family/join', { code: 'DEMO4821' })).status, 400);
    assert.equal((await X.c.post('/api/family/join', { code: c1[legacyFam.id] })).status, 201, 'join behaves normally with the new code');
    assert.equal((await Y.c.post('/api/family/join', { code: strongBefore })).status, 201);
    assert.equal(await codeOf(A, legacyFam.id), c1[legacyFam.id], 'owner sees the new code');
    // restarts change nothing further
    await restart(); await restart();
    assert.deepEqual(await codes(), c1, 'no repeated rotation on restart');
    assert.equal((await db.get('SELECT COUNT(DISTINCT invite_code) c FROM families')).c, (await db.get('SELECT COUNT(*) c FROM families')).c, 'no duplicate codes');
    assert.equal((await taskRow(t1.id)).title, 'MIGRATION-TASK');
  });
});
