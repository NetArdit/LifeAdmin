// The canonical task-access rule (src/lib/taskAccess.js) and the read-time filter for history rows
// that link to a task (src/lib/linkedTaskFilter.js), tested directly against a real database —
// no HTTP — including every NULL combination.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('task access predicate', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db');
  const { canAccessTask, taskAccessSql, isOrphanedFamilyTask, canDeleteOrphanedTask, isFamilyScoped } = require('../src/lib/taskAccess');
  const { showsLinkedTaskSql } = require('../src/lib/linkedTaskFilter');

  async function newUser() {
    const c = makeClient(app.base);
    await signUp(c);
    return { c, id: (await c.get('/api/auth/me')).data.user.id };
  }

  // A = family X owner, B = current member, C = FORMER member of X, D = user of another family Y,
  // E = user in no family at all.
  const A = await newUser(), B = await newUser(), C = await newUser(), D = await newUser(), E = await newUser();
  const X = (await A.c.post('/api/family', { name: 'X' })).data.family;
  await B.c.post('/api/family/join', { code: X.inviteCode });
  await C.c.post('/api/family/join', { code: X.inviteCode });
  const Y = (await D.c.post('/api/family', { name: 'Y' })).data.family;
  await C.c.post(`/api/family/${X.id}/leave`, {}); // C is now a former member
  const users = { A, B, C, D, E };

  let n = 0;
  const mk = async (owner, { family = null, visibility = 'private', assigned = null } = {}) => {
    n += 1;
    return (await db.run('INSERT INTO tasks (owner_id, family_id, assigned_to, visibility, title) VALUES (?,?,?,?,?)', [
      owner.id, family ? family.id : null, assigned ? assigned.id : null, visibility, `T${n}`,
    ])).lastInsertRowid;
  };

  // ---- the cases ----
  const cases = {
    'family-visible, owned by A': await mk(A, { family: X, visibility: 'family' }),
    'family-visible, owned by A, assigned to B': await mk(A, { family: X, visibility: 'family', assigned: B }),
    'family-visible, owned by A, assigned to C (former)': await mk(A, { family: X, visibility: 'family', assigned: C }),
    'family-visible, owned by C (former member)': await mk(C, { family: X, visibility: 'family' }),
    'family-visible, owned by D in family Y': await mk(D, { family: Y, visibility: 'family' }),
    'private + family, owned by A, no assignee (NULL assignee)': await mk(A, { family: X, visibility: 'private' }),
    'private + family, owned by A, assigned to B': await mk(A, { family: X, visibility: 'private', assigned: B }),
    'private + family, owned by A, assigned to C (former)': await mk(A, { family: X, visibility: 'private', assigned: C }),
    'private + family, owned by C (former member)': await mk(C, { family: X, visibility: 'private' }),
    'private, no family, owned by A (NULL family, NULL assignee)': await mk(A),
    'private, no family, owned by C': await mk(C),
    'unknown visibility value + family, owned by A': await mk(A, { family: X, visibility: 'weird' }),
    'visibility family but NO family id (legacy/odd), owned by A': await mk(A, { visibility: 'family' }),
  };

  // ---- the contract, written out by hand: who may access what (true = may) ----
  const expected = {
    'family-visible, owned by A': { A: 1, B: 1, C: 0, D: 0, E: 0 },
    'family-visible, owned by A, assigned to B': { A: 1, B: 1, C: 0, D: 0, E: 0 },
    'family-visible, owned by A, assigned to C (former)': { A: 1, B: 1, C: 0, D: 0, E: 0 }, // assignment does not survive leaving
    'family-visible, owned by C (former member)': { A: 1, B: 1, C: 0, D: 0, E: 0 },          // shared content stays with the family; the owner lost access
    'family-visible, owned by D in family Y': { A: 0, B: 0, C: 0, D: 1, E: 0 },
    'private + family, owned by A, no assignee (NULL assignee)': { A: 1, B: 0, C: 0, D: 0, E: 0 },
    'private + family, owned by A, assigned to B': { A: 1, B: 1, C: 0, D: 0, E: 0 },
    'private + family, owned by A, assigned to C (former)': { A: 1, B: 0, C: 0, D: 0, E: 0 },
    'private + family, owned by C (former member)': { A: 0, B: 0, C: 1, D: 0, E: 0 },        // their own private task stays theirs
    'private, no family, owned by A (NULL family, NULL assignee)': { A: 1, B: 0, C: 0, D: 0, E: 0 },
    'private, no family, owned by C': { A: 0, B: 0, C: 1, D: 0, E: 0 },
    'unknown visibility value + family, owned by A': { A: 1, B: 0, C: 0, D: 0, E: 0 },       // fails closed = private
    'visibility family but NO family id (legacy/odd), owned by A': { A: 1, B: 0, C: 0, D: 0, E: 0 },
  };

  await t.test('JS predicate matches the written contract for every user x task', async () => {
    for (const [name, id] of Object.entries(cases)) {
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      for (const [who, u] of Object.entries(users)) {
        assert.equal(await canAccessTask(u.id, task) ? 1 : 0, expected[name][who], `${who} on "${name}"`);
      }
    }
  });

  await t.test('SQL predicate equals the JS predicate and the contract, and is never NULL', async () => {
    for (const [who, u] of Object.entries(users)) {
      const rows = await db.all(`SELECT t.id, ${taskAccessSql('t', u.id)} AS ok FROM tasks t`);
      for (const r of rows) {
        assert.ok(r.ok === false || r.ok === true, 'the fragment must evaluate to true or false, never NULL');
        assert.equal(r.ok, await canAccessTask(u.id, await db.get('SELECT * FROM tasks WHERE id = ?', [r.id])));
      }
      const allowed = new Set((await db.all(`SELECT t.id FROM tasks t WHERE ${taskAccessSql('t', u.id)}`)).map((r) => r.id));
      for (const [name, id] of Object.entries(cases)) assert.equal(allowed.has(id) ? 1 : 0, expected[name][who], `${who} / ${name}`);
    }
  });

  await t.test('NULL safety: NOT(access) is the exact complement of access (the Gate A bug kept 34-44 rows per run)', async () => {
    const total = (await db.get('SELECT COUNT(*) c FROM tasks')).c;
    for (const u of Object.values(users)) {
      const yes = (await db.get(`SELECT COUNT(*) c FROM tasks t WHERE ${taskAccessSql('t', u.id)}`)).c;
      const no = (await db.get(`SELECT COUNT(*) c FROM tasks t WHERE NOT ${taskAccessSql('t', u.id)}`)).c;
      assert.equal(yes + no, total, 'every task is either accessible or not — NULL rows would make this fail');
    }
    // the specific shape that broke the prototype: NULL assigned_to and NULL family_id
    const nullTask = cases['private, no family, owned by A (NULL family, NULL assignee)'];
    const hidden = (await db.get(`SELECT COUNT(*) c FROM tasks t WHERE t.id = ? AND NOT ${taskAccessSql('t', B.id)}`, [nullTask])).c;
    assert.equal(hidden, 1, 'a stranger is NOT allowed on a task with NULL assignee and NULL family');
  });

  await t.test('rejects unsafe input to the SQL builder', async () => {
    assert.throws(() => taskAccessSql('t', "1; DROP TABLE tasks"), TypeError);
    assert.throws(() => taskAccessSql('t; --', 1), TypeError);
    assert.throws(() => taskAccessSql('t', 'abc'), TypeError);
    assert.equal(await canAccessTask(null, await db.get('SELECT * FROM tasks LIMIT 1')), false);
    assert.equal(await canAccessTask(A.id, null), false);
  });

  await t.test('access is CURRENT: it changes with membership and with visibility, in both directions', async () => {
    const id = cases['family-visible, owned by A, assigned to C (former)'];
    const task = async () => await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    assert.equal(await canAccessTask(C.id, await task()), false);
    // C rejoins -> access returns
    const code = (await A.c.get(`/api/family/${X.id}`)).data.family.inviteCode;
    assert.equal((await C.c.post('/api/family/join', { code })).status, 201);
    assert.equal(await canAccessTask(C.id, await task()), true, 'rejoining restores access');
    // task turned private: C is the assignee AND a member -> still has it; a plain member B does not
    await db.run("UPDATE tasks SET visibility = 'private' WHERE id = ?", [id]);
    assert.equal(await canAccessTask(C.id, await task()), true);
    assert.equal(await canAccessTask(B.id, await task()), false);
    // C leaves again: the private assignment no longer counts
    await C.c.post(`/api/family/${X.id}/leave`, {});
    assert.equal(await canAccessTask(C.id, await task()), false);
    await db.run("UPDATE tasks SET visibility = 'family' WHERE id = ?", [id]);
  });

  await t.test('orphaned family tasks: only the FAMILY owner gets the narrow delete capability', async () => {
    const orphan = await db.get('SELECT * FROM tasks WHERE id = ?', [cases['family-visible, owned by C (former member)']]);
    assert.equal(isFamilyScoped(orphan), true);
    assert.equal(await isOrphanedFamilyTask(orphan), true);
    assert.equal(await canDeleteOrphanedTask(A.id, orphan), true, 'family owner');
    assert.equal(await canDeleteOrphanedTask(B.id, orphan), false, 'ordinary member');
    assert.equal(await canDeleteOrphanedTask(C.id, orphan), false, 'the former owner');
    assert.equal(await canDeleteOrphanedTask(D.id, orphan), false, 'other family');
    const healthy = await db.get('SELECT * FROM tasks WHERE id = ?', [cases['family-visible, owned by A']]);
    assert.equal(await isOrphanedFamilyTask(healthy), false);
    assert.equal(await canDeleteOrphanedTask(A.id, healthy), false, 'not orphaned: ordinary owner rules apply');
    const priv = await db.get('SELECT * FROM tasks WHERE id = ?', [cases['private + family, owned by C (former member)']]);
    assert.equal(await isOrphanedFamilyTask(priv), false, 'a private task is not the family\'s to manage');
    assert.equal(await canDeleteOrphanedTask(A.id, priv), false);
  });

  // ---------------- history rows that link to a task ----------------
  await t.test('linked-task filter: hides rows about inaccessible tasks, keeps everything else, never NULL-drops', async () => {
    const ins = async (userId, link) => (await db.run("INSERT INTO notifications (user_id, type, title, link) VALUES (?, 'x', 'row', ?)", [userId, link])).lastInsertRowid;
    const famTask = cases['family-visible, owned by A'];
    const privTask = cases['private + family, owned by A, no assignee (NULL assignee)'];
    const nullTask = cases['private, no family, owned by A (NULL family, NULL assignee)'];
    const rows = {
      famForB: await ins(B.id, `#/tasks/${famTask}`),
      famForC: await ins(C.id, `#/tasks/${famTask}`),           // former member
      famForD: await ins(D.id, `#/tasks/${famTask}`),           // other family
      privForA: await ins(A.id, `#/tasks/${privTask}`),         // owner
      privForB: await ins(B.id, `#/tasks/${privTask}`),         // member without access
      nullForB: await ins(B.id, `#/tasks/${nullTask}`),
      goneForB: await ins(B.id, '#/tasks/999999'),               // task that does not exist
      junkForB: await ins(B.id, '#/tasks/abc'),                  // malformed id
      chatForB: await ins(B.id, '#/family/chat'),
      nullLink: (await db.run("INSERT INTO notifications (user_id, type, title, link) VALUES (?, 'x', 'row', NULL)", [B.id])).lastInsertRowid,
    };
    const shown = async (uid) => new Set((await db.all(`SELECT n.id FROM notifications n WHERE n.user_id = ? AND ${showsLinkedTaskSql('n.link', uid)}`, [uid])).map((r) => r.id));
    const sB = await shown(B.id);
    assert.ok(sB.has(rows.famForB), 'member: row about an accessible task is shown');
    assert.ok(!sB.has(rows.privForB), 'member: row about a private task they cannot open is hidden');
    assert.ok(!sB.has(rows.nullForB), 'NULL-assignee / NULL-family private task: hidden from a stranger');
    assert.ok(sB.has(rows.goneForB), 'row about a task that no longer exists is kept');
    assert.ok(sB.has(rows.junkForB), 'a malformed task id is not a task link that can be judged: kept');
    assert.ok(sB.has(rows.chatForB) && sB.has(rows.nullLink), 'non-task and NULL links are untouched');
    assert.ok(!(await shown(C.id)).has(rows.famForC), 'former member: hidden');
    assert.ok(!(await shown(D.id)).has(rows.famForD), 'other family: hidden');
    assert.ok((await shown(A.id)).has(rows.privForA), 'owner: shown');
    // nothing deleted
    assert.equal((await db.get('SELECT COUNT(*) c FROM notifications WHERE id IN (' + Object.values(rows).join(',') + ')')).c, Object.keys(rows).length);
    // the filter works on activity rows too (same helper, other table)
    const act = (await db.run("INSERT INTO activity_log (user_id, family_id, type, summary, link) VALUES (?, NULL, 'x', 's', ?)", [A.id, `#/tasks/${privTask}`])).lastInsertRowid;
    assert.equal((await db.all(`SELECT a.id FROM activity_log a WHERE a.id = ? AND ${showsLinkedTaskSql('a.link', B.id)}`, [act])).length, 0);
    assert.equal((await db.all(`SELECT a.id FROM activity_log a WHERE a.id = ? AND ${showsLinkedTaskSql('a.link', A.id)}`, [act])).length, 1);
    assert.throws(() => showsLinkedTaskSql('n.link; --', 1), TypeError);
  });

  await t.test('randomised worlds: JS and SQL predicates always agree with an independent reference implementation', async () => {
    const memberOf = async (uid, fid) => !!await db.get('SELECT 1 x FROM family_members WHERE user_id = ? AND family_id = ?', [uid, fid]);
    const ref = async (uid, task) => {
      const familyScoped = task.visibility === 'family' && task.family_id !== null;
      if (familyScoped) return await memberOf(uid, task.family_id);
      if (task.owner_id === uid) return true;
      return task.assigned_to === uid && (task.family_id === null || await memberOf(uid, task.family_id));
    };
    const ids = Object.values(users).map((u) => u.id);
    const fams = [null, X.id, Y.id];
    const vis = ['private', 'family', 'weird'];
    let checked = 0;
    for (let i = 0; i < 300; i++) {
      const pick = (a) => a[Math.floor(Math.random() * a.length)];
      const id = (await db.run('INSERT INTO tasks (owner_id, family_id, assigned_to, visibility, title) VALUES (?,?,?,?,?)', [
        pick(ids), pick(fams), Math.random() < 0.4 ? null : pick(ids), pick(vis), 'rnd' + i,
      ])).lastInsertRowid;
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      for (const uid of ids) {
        const want = await ref(uid, task);
        assert.equal(await canAccessTask(uid, task), want);
        assert.equal((await db.get(`SELECT ${taskAccessSql('t', uid)} AS ok FROM tasks t WHERE t.id = ?`, [id])).ok === true, want);
        checked += 1;
      }
    }
    assert.equal(checked, 300 * ids.length);
  });
});
