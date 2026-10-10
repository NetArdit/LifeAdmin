// Gate A PROTOTYPE (not product code): can ONE shared task-access predicate express the rule, and does it differ
// from today's rule ONLY where we intend (former members)? Differential test old-vs-proposed over randomised worlds.
const P = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const { startApp, makeClient, signUp } = require(P + '/test/helpers.js');

(async () => {
  const app = await startApp();
  const db = require(P + '/src/db');
  const mk = async () => { const c = makeClient(app.base); await signUp(c); return { c, id: (await c.get('/api/auth/me')).data.user.id }; };

  // ---- world: 3 families, 8 users, random tasks (visibility x family x assignee x owner), random removals ----
  const users = []; for (let i = 0; i < 8; i++) users.push(await mk());
  const fams = [];
  for (let f = 0; f < 3; f++) {
    const owner = users[f];
    const fam = (await owner.c.post('/api/family', { name: 'F' + f })).data.family;
    fams.push({ id: fam.id, owner, code: fam.inviteCode, members: new Set([owner.id]) });
  }
  const rnd = (n) => Math.floor(Math.random() * n);
  for (const u of users.slice(3)) for (const f of fams) if (Math.random() < 0.6) { await u.c.post('/api/family/join', { code: f.code }); f.members.add(u.id); }
  // tasks (via SQL to reach states the API/UI can produce: private+family, assigned, weird visibility, family without family_id)
  for (let i = 0; i < 400; i++) {
    const fam = Math.random() < 0.75 ? fams[rnd(3)] : null;
    const pool = fam ? [...fam.members] : users.map((u) => u.id);
    const owner = { id: pool[rnd(pool.length)] };
    const vis = ['private', 'family', 'family', 'weird'][rnd(4)];
    const assigned = fam && Math.random() < 0.3 ? pool[rnd(pool.length)] : null;
    db.run('INSERT INTO tasks (owner_id, family_id, assigned_to, visibility, title) VALUES (?,?,?,?,?)', [owner.id, fam ? fam.id : null, assigned, vis, 't' + i]);
  }
  // some members leave / are removed AFTER tasks exist
  const removed = [];
  for (const f of fams) for (const m of [...f.members]) if (m !== f.owner.id && Math.random() < 0.35) { db.run('DELETE FROM family_members WHERE family_id = ? AND user_id = ?', [f.id, m]); f.members.delete(m); removed.push([f.id, m]); }

  // ---- OLD rule: verbatim from routes/tasks.js taskWhereClause ----
  const oldVisible = (uid) => {
    const fids = db.all('SELECT family_id FROM family_members WHERE user_id = ?', [uid]).map((r) => r.family_id);
    const ph = fids.map(() => '?').join(',');
    const clause = fids.length ? `(t.owner_id = ? OR t.assigned_to = ? OR (t.visibility = 'family' AND t.family_id IN (${ph})))` : '(t.owner_id = ? OR t.assigned_to = ?)';
    const params = fids.length ? [uid, uid, ...fids] : [uid, uid];
    return new Set(db.all(`SELECT t.id FROM tasks t WHERE ${clause}`, params).map((r) => r.id));
  };
  // ---- PROPOSED rule: one predicate ----
  const MEMBER = '(EXISTS (SELECT 1 FROM family_members fm WHERE fm.user_id = :u AND fm.family_id = t.family_id))';
  const NEW_SQL = `(
    (t.visibility = 'family' AND ${MEMBER})
    OR (t.owner_id = :u AND (t.visibility <> 'family' OR t.family_id IS NULL))
    OR (t.assigned_to = :u AND t.visibility <> 'family' AND (t.family_id IS NULL OR ${MEMBER}))
  )`;
  const newVisible = (uid) => new Set(db.all(`SELECT t.id FROM tasks t WHERE ${NEW_SQL.replaceAll(':u', String(uid))}`).map((r) => r.id));

  let diffTotal = 0; const buckets = { formerMemberOnly: 0, other: 0 }; const samples = [];
  const wasMember = (uid, fid) => removed.some(([f, m]) => f === fid && m === uid);
  for (const u of users) {
    const o = oldVisible(u.id), n = newVisible(u.id);
    for (const id of o) if (!n.has(id)) {
      diffTotal++;
      const t = db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      const explained = t.family_id && wasMember(u.id, t.family_id) && (t.owner_id === u.id || t.assigned_to === u.id) && t.visibility === 'family';
      const explained2 = t.family_id && wasMember(u.id, t.family_id) && t.assigned_to === u.id && t.visibility !== 'family' && t.owner_id !== u.id;
      if (explained || explained2) buckets.formerMemberOnly++; else { buckets.other++; if (samples.length < 5) samples.push(JSON.stringify(t)); }
    }
    for (const id of n) if (!o.has(id)) { buckets.other++; samples.push('NEW-ONLY ' + id); }
  }
  console.log('removed members in world:', removed.length, '| tasks:', db.get('SELECT COUNT(*) c FROM tasks').c);
  console.log('tasks visible under OLD but not NEW:', diffTotal, '=> explained by "former member of that family":', buckets.formerMemberOnly, '| unexplained differences:', buckets.other);
  if (samples.length) console.log('unexplained samples:', samples);

  // ---- notifications: hide rows about tasks the recipient cannot access (link '#/tasks/<id>') ----
  // seed notification rows referencing tasks
  const allTasks = db.all('SELECT id FROM tasks');
  for (const u of users) for (let i = 0; i < 25; i++) db.run("INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, 'comment', 'snap', 'body', ?)", [u.id, `#/tasks/${allTasks[rnd(allTasks.length)].id}`]);
  db.run("INSERT INTO notifications (user_id, type, title, link) SELECT id, 'chat', 'chat preview', '#/family/chat' FROM users");
  const NOTIF_SQL = (uid) => `SELECT n.id, n.link FROM notifications n WHERE n.user_id = ${uid}
     AND NOT (n.link LIKE '#/tasks/%' AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = CAST(substr(n.link, 9) AS INTEGER) AND NOT COALESCE(${NEW_SQL.replaceAll(':u', String(uid))}, 0)))`;
  let hidden = 0, kept = 0, wrongHidden = 0, wrongKept = 0, nonTask = 0;
  for (const u of users) {
    const vis = new Set(db.all(NOTIF_SQL(u.id)).map((r) => r.id));
    for (const n of db.all('SELECT * FROM notifications WHERE user_id = ?', [u.id])) {
      if (!n.link.startsWith('#/tasks/')) { nonTask++; if (!vis.has(n.id)) wrongHidden++; continue; }
      const tid = Number(n.link.slice(8));
      const accessible = newVisible(u.id).has(tid);
      if (vis.has(n.id)) { kept++; if (!accessible) { wrongKept++; if (wrongKept <= 3) console.log('WRONGLY KEPT', JSON.stringify({ user: u.id, link: n.link, task: db.get('SELECT id,owner_id,family_id,assigned_to,visibility FROM tasks WHERE id = ?', [tid]) })); } } else { hidden++; if (accessible) wrongHidden++; }
    }
  }
  console.log(`notifications: task-linked kept=${kept} hidden=${hidden}; non-task rows untouched=${nonTask}; wrongly hidden=${wrongHidden}; wrongly kept=${wrongKept}`);
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 200; i++) db.all(NOTIF_SQL(users[0].id)); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 200;
  console.log(`notification query with the access filter: ${ms.toFixed(2)} ms per call on this data (25+ rows/user, 400 tasks)`);
  await app.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
