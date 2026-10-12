// Hardening 1: cross-family authorization (F-01, F-02), invite-code lifecycle (F-03),
// private-task privacy (F-04) and family-owner integrity (F-13).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { startApp, makeClient, signUp } = require('./helpers');

test('hardening 1: authorization, invites, privacy, ownership', async (t) => {
  const app = await startApp();
  t.after(() => app.close());
  const db = require('../src/db'); // after startApp: bound to the disposable DB
  const { resetAllLimits } = require('../src/lib/authLimits');
  const CODE_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/;

  async function newUser() {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    const me = (await c.get('/api/auth/me')).data.user;
    return { c, payload, id: me.id };
  }
  async function makeFamily(owner, ...joiners) {
    const f = (await owner.c.post('/api/family', { name: 'Fam' })).data.family;
    for (const j of joiners) assert.equal((await j.c.post('/api/family/join', { code: f.inviteCode })).status, 201);
    return (await owner.c.get(`/api/family/${f.id}`)).data.family;
  }
  const memberRow = (fam, userId) => fam.members.find((m) => m.userId === userId);
  const ownerRows = async (familyId) => await db.all("SELECT * FROM family_members WHERE family_id = ? AND role = 'owner'", [familyId]);
  const anon = () => makeClient(app.base);
  const bill = (extra = {}) => ({ name: 'Rent', amount: 10, dueDate: '2030-01-01', recurrence: 'none', ...extra });
  const feed = async (u, fid) => (await u.c.get(`/api/family/${fid}/activity`)).data.activity.map((a) => a.summary);
  const notifs = async (u) => (await u.c.get('/api/notifications')).data.notifications.map((n) => `${n.title} | ${n.body || ''}`);

  // ============================== F-01 ==============================
  await t.test('F-01 bills: same-family attach allowed; cross-family denied both ways; unauthenticated denied; no side effects leak', async () => {
    const A = await newUser(), B = await newUser();
    const famA = await makeFamily(A), famB = await makeFamily(B);
    const ok = await A.c.post('/api/bills', bill({ familyId: famA.id }));
    assert.equal(ok.status, 201);
    assert.equal(ok.data.bill.familyId, famA.id);
    assert.equal((await A.c.post('/api/bills', bill({ familyId: famB.id }))).status, 403, 'A -> Family B');
    assert.equal((await B.c.post('/api/bills', bill({ familyId: famA.id }))).status, 403, 'B -> Family A');
    assert.equal((await A.c.post('/api/bills', bill({ familyId: 999999 }))).status, 403, 'nonexistent family: same 403, never 500');
    assert.equal((await A.c.post('/api/bills', bill({ familyId: '1' }))).status, 400, 'non-integer family id');
    assert.equal((await A.c.post('/api/bills', bill({ familyId: -3 }))).status, 400);
    assert.equal((await anon().post('/api/bills', bill({ familyId: famA.id }))).status, 401);
    assert.equal((await db.get('SELECT COUNT(*) c FROM bills WHERE family_id = ? AND owner_id != ?', [famA.id, A.id])).c, 0);
    assert.equal((await db.get('SELECT COUNT(*) c FROM bills WHERE family_id = ?', [famB.id])).c, 0, 'nothing attached to Family B');
    assert.deepEqual((await feed(B, famB.id)).filter((s) => /marked/.test(s)), []);
  });

  await t.test('F-01 bills: a bill without a family, and one with familyId:null, still work; paying a family bill still feeds the family', async () => {
    const A = await newUser(), C = await newUser();
    const famA = await makeFamily(A, C);
    assert.equal((await A.c.post('/api/bills', bill())).status, 201);
    assert.equal((await A.c.post('/api/bills', bill({ familyId: null }))).status, 201);
    const fb = (await A.c.post('/api/bills', bill({ name: 'Family electricity', familyId: famA.id }))).data.bill;
    assert.equal((await A.c.post(`/api/bills/${fb.id}/pay`, {})).status, 200);
    assert.ok((await feed(C, famA.id)).some((s) => /Family electricity/.test(s)), 'same-family behaviour preserved');
    assert.ok((await notifs(C)).some((s) => /Family electricity/.test(s)));
  });

  await t.test('F-01 bills: editing cannot attach, move or clear the family; other edits still work', async () => {
    const A = await newUser(), B = await newUser();
    const famA = await makeFamily(A), famB = await makeFamily(B);
    const mine = (await A.c.post('/api/bills', bill({ familyId: famA.id }))).data.bill;
    const plain = (await A.c.post('/api/bills', bill({ name: 'Plain' }))).data.bill;
    assert.equal((await A.c.patch(`/api/bills/${mine.id}`, { familyId: famB.id })).status, 400, 'move to a family A is not in');
    assert.equal((await A.c.patch(`/api/bills/${plain.id}`, { familyId: famB.id })).status, 400, 'attach to a foreign family');
    assert.equal((await A.c.patch(`/api/bills/${plain.id}`, { familyId: famA.id })).status, 400, 'attaching later is not supported either');
    assert.equal((await A.c.patch(`/api/bills/${mine.id}`, { familyId: null })).status, 400, 'clearing is not supported');
    assert.equal((await A.c.patch(`/api/bills/${mine.id}`, { familyId: famA.id, name: 'Renamed' })).status, 200, 'repeating the current value is harmless');
    assert.equal((await A.c.patch(`/api/bills/${mine.id}`, { name: 'Renamed again' })).data.bill.name, 'Renamed again');
    assert.equal((await B.c.patch(`/api/bills/${mine.id}`, { familyId: famB.id })).status, 404, 'B cannot touch A\'s bill at all');
    assert.equal((await db.get('SELECT family_id FROM bills WHERE id = ?', [mine.id])).family_id, famA.id);
    assert.equal((await db.get('SELECT family_id FROM bills WHERE id = ?', [plain.id])).family_id, null);
  });

  await t.test('F-01 bills: after the owner leaves or is removed the family stops receiving that bill\'s activity; legacy foreign rows are neutralised', async () => {
    const O = await newUser(), M = await newUser(), N = await newUser();
    const fam = await makeFamily(O, M, N);
    const mb = (await M.c.post('/api/bills', bill({ name: 'M bill', familyId: fam.id }))).data.bill;
    await M.c.post(`/api/family/${fam.id}/leave`, {});
    assert.equal((await db.get('SELECT family_id FROM bills WHERE id = ?', [mb.id])).family_id, null, 'association cleared on leave');
    await M.c.post(`/api/bills/${mb.id}/pay`, {});
    assert.ok(!(await feed(O, fam.id)).some((s) => /M bill/.test(s)));
    // removal clears too
    const nb = (await N.c.post('/api/bills', bill({ name: 'N bill', familyId: fam.id }))).data.bill;
    const famNow = (await O.c.get(`/api/family/${fam.id}`)).data.family;
    await O.c.del(`/api/family/${fam.id}/members/${memberRow(famNow, N.id).id}`);
    assert.equal((await db.get('SELECT family_id FROM bills WHERE id = ?', [nb.id])).family_id, null);
    // a row stored by the old bug (owner NOT a member of the family) must not write into that family
    const X = await newUser();
    const legacy = await db.run("INSERT INTO bills (owner_id, family_id, name, amount, due_date, recurrence) VALUES (?, ?, 'LEGACY-INJECT', 5, '2030-01-01', 'none')", [X.id, fam.id]);
    assert.equal((await X.c.post(`/api/bills/${legacy.lastInsertRowid}/pay`, {})).status, 200);
    assert.ok(!(await feed(O, fam.id)).some((s) => /LEGACY-INJECT/.test(s)), 'no feed entry');
    assert.ok(!(await notifs(O)).some((s) => /LEGACY-INJECT/.test(s)), 'no notification');
  });

  // ============================== F-02 ==============================
  await t.test('F-02 reactions: same-family works; cross-family, removed member, unauthenticated, missing/garbage ids all fail cleanly', async () => {
    const A = await newUser(), A2 = await newUser(), B = await newUser(), R = await newUser();
    const famA = await makeFamily(A, A2, R), famB = await makeFamily(B);
    const msg = (await A.c.post(`/api/chat/${famA.id}/messages`, { body: 'hello A' })).data.message;
    const react = (u, fid, mid, body = { emoji: '👍' }) => u.c.post(`/api/chat/${fid}/messages/${mid}/react`, body);
    assert.equal((await react(A, famA.id, msg.id)).status, 201, 'author reacts');
    assert.equal((await react(A2, famA.id, msg.id, { emoji: '❤️' })).status, 201, 'another member reacts');
    assert.equal((await react(B, famB.id, msg.id)).status, 404, 'B via own family url: message is not in that family');
    assert.equal((await react(B, famA.id, msg.id)).status, 403, 'B via A\'s family url: not a member');
    assert.equal((await anon().post(`/api/chat/${famA.id}/messages/${msg.id}/react`, { emoji: 'x' })).status, 401);
    assert.equal((await react(A, famA.id, 999999)).status, 404, 'nonexistent message');
    assert.equal((await react(A, famA.id, 'abc')).status, 404, 'non-numeric message id');
    assert.equal((await react(A, famA.id, msg.id, { emoji: 'x'.repeat(33) })).status, 400, 'unbounded reaction text');
    assert.equal((await react(A, famA.id, msg.id, {})).status, 400);
    const famRow = (await A.c.get(`/api/family/${famA.id}`)).data.family;
    await A.c.del(`/api/family/${famA.id}/members/${memberRow(famRow, R.id).id}`);
    assert.equal((await react(R, famA.id, msg.id)).status, 403, 'removed member');
    const reactions = await db.all('SELECT user_id, emoji FROM message_reactions WHERE message_id = ?', [msg.id]);
    assert.deepEqual(reactions.map((r) => r.user_id).sort(), [A.id, A2.id].sort(), 'only the two legitimate reactions exist');
    const shown = (await A2.c.get(`/api/chat/${famA.id}/messages`)).data.messages[0].reactions;
    assert.equal(shown.length, 2, 'existing reaction behaviour preserved');
  });

  // ============================== F-03 ==============================
  await t.test('F-03 invite codes: strong random format, unique, and never predictable; demo families use the same generator', async () => {
    const O = await newUser();
    const codes = new Set();
    for (let i = 0; i < 40; i++) {
      const f = (await O.c.post('/api/family', { name: 'F' + i })).data.family;
      assert.match(f.inviteCode, CODE_RE);
      codes.add(f.inviteCode);
    }
    assert.equal(codes.size, 40);
    const D = await newUser();
    assert.equal((await D.c.post('/api/demo/seed', {})).status, 200);
    const demoFam = (await D.c.get('/api/family')).data.families[0];
    assert.match(demoFam.inviteCode, CODE_RE);
    assert.doesNotMatch(demoFam.inviteCode, /^DEMO/);
    assert.ok(!/^\d+$/.test(demoFam.inviteCode.slice(4)), 'not DEMO+digits');
  });

  await t.test('F-03 join: valid, lowercase-typed and invalid codes; one generic failure for unknown and stale codes', async () => {
    resetAllLimits();
    const O = await newUser(), J = await newUser(), K = await newUser();
    const fam = await makeFamily(O);
    assert.equal((await J.c.post('/api/family/join', { code: fam.inviteCode.toLowerCase() })).status, 201);
    const bad = await K.c.post('/api/family/join', { code: 'NOTAREALCODE' });
    assert.equal(bad.status, 400);
    const regen = await O.c.post(`/api/family/${fam.id}/invite-code/regenerate`, {});
    const stale = await K.c.post('/api/family/join', { code: fam.inviteCode });
    assert.equal(stale.status, 400);
    assert.deepEqual(stale.data, bad.data, 'revoked and unknown codes are indistinguishable');
    assert.equal((await K.c.post('/api/family/join', { code: 'x'.repeat(5000) })).status, 400);
    assert.equal((await anon().post('/api/family/join', { code: regen.data.inviteCode })).status, 401);
    assert.equal((await K.c.post('/api/family/join', { code: regen.data.inviteCode })).status, 201);
  });

  await t.test('F-03 throttling: failed joins are limited per user and per IP; success never resets; other users unaffected until the IP budget', async () => {
    resetAllLimits();
    const O = await newUser(), U1 = await newUser(), U2 = await newUser();
    const fam = await makeFamily(O);
    for (let i = 0; i < 10; i++) assert.equal((await U1.c.post('/api/family/join', { code: 'BADCODE' + i })).status, 400);
    const blocked = await U1.c.post('/api/family/join', { code: fam.inviteCode }); // even the CORRECT code
    assert.equal(blocked.status, 429, 'the 11th attempt is refused, whatever code it carries');
    assert.equal((await U1.c.get(`/api/family/${fam.id}`)).status, 403, 'and no membership was created');
    assert.equal((await U2.c.post('/api/family/join', { code: fam.inviteCode })).status, 201, 'another user is not affected by U1\'s budget');
    // a success does not refund attempts
    resetAllLimits();
    const V = await newUser();
    const other = await makeFamily(await newUser());
    for (let i = 0; i < 9; i++) await V.c.post('/api/family/join', { code: 'WRONG' + i });
    assert.equal((await V.c.post('/api/family/join', { code: other.inviteCode })).status, 201);
    assert.equal((await V.c.post('/api/family/join', { code: 'WRONGX' })).status, 400, '10th failure still answered');
    assert.equal((await V.c.post('/api/family/join', { code: 'WRONGY' })).status, 429, 'the counter was not reset by the earlier success');
    // per-IP budget: many accounts, one address
    resetAllLimits();
    const users = [await newUser(), await newUser(), await newUser(), await newUser()];
    for (const u of users.slice(0, 3)) for (let i = 0; i < 10; i++) await u.c.post('/api/family/join', { code: 'IPTEST' + i });
    const fourth = await users[3].c.post('/api/family/join', { code: 'IPTEST0' });
    assert.equal(fourth.status, 429, '30 failures from one IP exhaust the IP budget for every account behind it');
    assert.ok(fourth.data.error && !/family|code/i.test(fourth.data.error.replace(/try again/i, '')), 'throttle message reveals nothing about the family');
    resetAllLimits();
  });

  await t.test('F-03 rotation: owner-only, old code dies immediately, new one works, nothing is rotated implicitly, code is never logged', async () => {
    resetAllLimits();
    const O = await newUser(), M = await newUser(), X = await newUser(), N = await newUser();
    const fam = await makeFamily(O, M);
    const adminRow = memberRow(fam, M.id);
    await O.c.patch(`/api/family/${fam.id}/members/${adminRow.id}`, { role: 'admin' });
    for (const [who, label] of [[M, 'admin'], [X, 'outsider']]) {
      assert.equal((await who.c.post(`/api/family/${fam.id}/invite-code/regenerate`, {})).status, 403, label);
    }
    assert.equal((await anon().post(`/api/family/${fam.id}/invite-code/regenerate`, {})).status, 401);
    // reading / joining / page loads never rotate
    await O.c.get('/api/family'); await O.c.get(`/api/family/${fam.id}`);
    assert.equal((await db.get('SELECT invite_code FROM families WHERE id = ?', [fam.id])).invite_code, fam.inviteCode);
    const before = fam.inviteCode;
    const r = await O.c.post(`/api/family/${fam.id}/invite-code/regenerate`, {});
    assert.equal(r.status, 200);
    assert.match(r.data.inviteCode, CODE_RE);
    assert.notEqual(r.data.inviteCode, before);
    assert.equal((await N.c.post('/api/family/join', { code: before })).status, 400, 'old code invalid');
    assert.equal((await N.c.post('/api/family/join', { code: r.data.inviteCode })).status, 201, 'new code valid');
    const summaries = JSON.stringify((await O.c.get(`/api/family/${fam.id}/activity`)).data);
    assert.match(summaries, /changed the invite code/);
    assert.ok(!summaries.includes(r.data.inviteCode) && !summaries.includes(before), 'activity records that it changed, not the code');
    const sqlDump = JSON.stringify(await db.all('SELECT summary, link FROM activity_log'));
    assert.ok(!sqlDump.includes(r.data.inviteCode));
    // the joined family payload is what the UI shows
    assert.equal((await O.c.get(`/api/family/${fam.id}`)).data.family.inviteCode, r.data.inviteCode);
  });

  await t.test('F-03 lifecycle: removing a registered member replaces the code so they cannot rejoin; invited (unregistered) removal and voluntary leave do not', async () => {
    resetAllLimits();
    const O = await newUser(), M = await newUser(), L = await newUser();
    const fam = await makeFamily(O, M, L);
    const old = fam.inviteCode;
    // voluntary leave keeps the code (the person chose to go; the owner can still rotate)
    await L.c.post(`/api/family/${fam.id}/leave`, {});
    assert.equal((await db.get('SELECT invite_code FROM families WHERE id = ?', [fam.id])).invite_code, old);
    assert.equal((await L.c.post('/api/family/join', { code: old })).status, 201, 'a member who left may come back with a code they still hold (documented)');
    // an invited placeholder never held the code
    await O.c.post(`/api/family/${fam.id}/members`, { phone: '+38344909090', displayName: 'Guest' });
    const withGuest = (await O.c.get(`/api/family/${fam.id}`)).data.family;
    const guest = withGuest.members.find((m) => !m.registered);
    const rm1 = await O.c.del(`/api/family/${fam.id}/members/${guest.id}`);
    assert.equal(rm1.data.inviteCodeRotated, false);
    assert.equal((await db.get('SELECT invite_code FROM families WHERE id = ?', [fam.id])).invite_code, old);
    // removing a registered member rotates
    const cur = (await O.c.get(`/api/family/${fam.id}`)).data.family;
    const rm2 = await O.c.del(`/api/family/${fam.id}/members/${memberRow(cur, M.id).id}`);
    assert.equal(rm2.status, 200);
    assert.equal(rm2.data.inviteCodeRotated, true);
    const now = (await db.get('SELECT invite_code FROM families WHERE id = ?', [fam.id])).invite_code;
    assert.notEqual(now, old);
    const rejoin = await M.c.post('/api/family/join', { code: old });
    assert.equal(rejoin.status, 400, 'removed member + stale code = denied');
    assert.equal((await M.c.get(`/api/family/${fam.id}`)).status, 403);
    assert.equal((await ownerRows(fam.id)).length, 1);
  });

  await t.test('F-03 start-up hardening (real process restart): legacy 8-character codes replaced (Hardening 1.5 widened this from DEMO-only), 12-character codes untouched, ownerless family repaired, at-most-one-owner index in place', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-h1-'));
    const dbPath = path.join(dir, 'legacy.db');
    const root = path.join(__dirname, '..');
    // Each step is a process of its own on the same database folder, one at a time.
    const step = (script, env = {}) => {
      const out = execFileSync(process.execPath, ['-e', `(async () => { const db = require('./src/db'); ${script}; await db.close(); })().catch((e) => { console.log(JSON.stringify({ error: e.message })); process.exit(0); });`], { cwd: root, env: { ...process.env, LIFEADMIN_DB_PATH: dbPath, NODE_ENV: 'test', ...env }, encoding: 'utf8' }).trim();
      return JSON.parse(out.split('\n').pop() || 'null');
    };
    // 1st start creates the schema; then the legacy states are planted without the hardening running.
    step("await db.ready(); console.log('null')");
    const planted = step(`
      await db.exec('DROP INDEX IF EXISTS idx_family_one_owner');
      const mkUser = async (n) => (await db.run("INSERT INTO users (first_name,last_name,email,phone,password_hash) VALUES ('U','x',?,?,'h')", ['u' + n + '@x.test', '+3830000000' + n])).lastInsertRowid;
      const u1 = await mkUser(1), u2 = await mkUser(2), u3 = await mkUser(3);
      const fam = async (code, owner) => (await db.run('INSERT INTO families (name, invite_code, owner_id) VALUES (?,?,?)', ['F', code, owner])).lastInsertRowid;
      const fDemo = await fam('DEMO4821', u1), fOld = await fam('A1B2C3D4', u2), fOrphan = await fam('ORPHANCODE12', u3), fGone = await fam('GONECODE0001', u1);
      const mem = (f, u, role) => db.run('INSERT INTO family_members (family_id,user_id,role) VALUES (?,?,?)', [f, u, role]);
      await mem(fDemo, u1, 'owner'); await mem(fOld, u2, 'owner');
      await mem(fOrphan, u3, 'member');
      await mem(fGone, u2, 'member');
      console.log(JSON.stringify({ u1, u2, u3, fDemo, fOld, fOrphan, fGone }))`, { DB_SKIP_SCHEMA: '1' });
    const { u2, u3, fDemo, fOld, fOrphan, fGone } = planted;
    // 2nd start = the hardening pass
    const read = "console.log(JSON.stringify({codes: await db.all('SELECT id,invite_code FROM families ORDER BY id'), roles: await db.all('SELECT family_id,user_id,role FROM family_members ORDER BY id'), idx: await db.all(\"SELECT indexname AS name FROM pg_indexes WHERE indexname = 'idx_family_one_owner'\")}))";
    const out = step(read);
    const code = (id) => out.codes.find((c) => c.id === Number(id)).invite_code;
    assert.match(code(fDemo), CODE_RE, 'DEMO#### replaced by a strong code');
    assert.match(code(fOld), CODE_RE, 'a legacy 8-hex code is replaced too');
    assert.equal(code(fOrphan), 'ORPHANCODE12', 'a 12-character code is never touched');
    assert.equal(code(fGone), 'GONECODE0001');
    const role = (f, u) => out.roles.find((r) => r.family_id === Number(f) && r.user_id === Number(u)).role;
    assert.equal(role(fOrphan, u3), 'owner', 'the RECORDED owner regains the role');
    assert.equal(role(fGone, u2), 'member', 'nobody else is ever promoted');
    assert.equal(out.idx.length, 1, 'unique-owner index exists');
    // a third start changes nothing (idempotent)
    const again = step(read);
    assert.deepEqual(again.codes.map((c) => c.invite_code), out.codes.map((c) => c.invite_code));
    // and the index really prevents a second owner row
    const refused = step(`await db.run("INSERT INTO family_members (family_id,user_id,role) VALUES (?,?, 'owner')", [${Number(fDemo)}, ${Number(u2)}]); console.log(JSON.stringify({ error: null }))`, { DB_SKIP_SCHEMA: '1' });
    assert.match(String(refused.error), /unique|constraint/i);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // ============================== F-04 ==============================
  async function privacyWorld() {
    const O = await newUser(), M = await newUser(), M2 = await newUser(), Out = await newUser();
    const fam = await makeFamily(O, M, M2);
    const other = await makeFamily(Out);
    return { O, M, M2, Out, fam, other };
  }

  await t.test('F-04 private task inside a family: hidden from feed, dashboard feed, Timeline, search and notifications; comments do not leak', async () => {
    const { O, M, M2, Out, fam, other } = await privacyWorld();
    const priv = (await O.c.post('/api/tasks', { title: 'SECRET-TITLE', familyId: fam.id, visibility: 'private', assignedTo: M.id })).data.task;
    // the people who may open it
    assert.equal((await O.c.get(`/api/tasks/${priv.id}`)).status, 200);
    assert.equal((await M.c.get(`/api/tasks/${priv.id}`)).status, 200, 'assignee');
    assert.equal((await M2.c.get(`/api/tasks/${priv.id}`)).status, 404, 'unrelated family member');
    assert.equal((await Out.c.get(`/api/tasks/${priv.id}`)).status, 404, 'other family');
    await M.c.post(`/api/tasks/${priv.id}/comments`, { body: 'SECRET-COMMENT by assignee' });
    await O.c.post(`/api/tasks/${priv.id}/comments`, { body: 'SECRET-COMMENT by owner' });
    await O.c.patch(`/api/tasks/${priv.id}`, { status: 'completed' });
    const everything = async (u, fid = fam.id) => JSON.stringify({
      feed: await feed(u, fid),
      timeline: (await u.c.get('/api/timeline')).data.activity.map((a) => a.summary),
      dash: (await u.c.get('/api/dashboard')).data.familyActivity.map((a) => a.summary),
      searchTitle: (await u.c.get('/api/search?q=SECRET-TITLE')).data.results,
      searchComment: (await u.c.get('/api/search?q=SECRET-COMMENT')).data.results,
      notifs: await notifs(u),
    });
    const m2 = await everything(M2);
    assert.ok(!/SECRET/.test(m2), `unrelated member sees nothing: ${m2}`);
    assert.ok(!/SECRET/.test(await everything(Out, other.id)), 'other family sees nothing');
    assert.equal((await Out.c.get(`/api/family/${fam.id}/activity`)).status, 403, 'and cannot open the feed of a family they are not in');
    // owner and assignee do get what concerns them
    const own = await everything(O);
    assert.ok(/SECRET-COMMENT by assignee/.test(own), 'owner is notified of the assignee\'s comment');
    assert.ok(/SECRET-TITLE/.test(JSON.stringify((await O.c.get('/api/search?q=SECRET-TITLE')).data.results)), 'owner can find own task');
    assert.ok(/SECRET-COMMENT by owner/.test(await everything(M)), 'assignee is notified of the owner\'s comment');
    assert.ok(/SECRET-COMMENT/.test(JSON.stringify((await O.c.get('/api/search?q=SECRET-COMMENT')).data.results)), 'owner can search comments on own task');
    // nothing was deleted
    assert.equal((await db.get('SELECT COUNT(*) c FROM task_comments WHERE task_id = ?', [priv.id])).c, 2);
    assert.equal((await db.get('SELECT visibility FROM tasks WHERE id = ?', [priv.id])).visibility, 'private');
    // private activity is not attached to the family at write time either
    assert.equal((await db.get("SELECT COUNT(*) c FROM activity_log WHERE link = ? AND family_id IS NOT NULL", [`#/tasks/${priv.id}`])).c, 0);
  });

  await t.test('F-04 family-visible tasks keep working exactly as before (feed, timeline, dashboard, search, notifications)', async () => {
    const { O, M, M2, fam } = await privacyWorld();
    const shared = (await O.c.post('/api/tasks', { title: 'SHARED-TITLE', familyId: fam.id, visibility: 'family' })).data.task;
    await M.c.post(`/api/tasks/${shared.id}/comments`, { body: 'SHARED-COMMENT' });
    await O.c.patch(`/api/tasks/${shared.id}`, { status: 'completed' });
    assert.ok((await feed(M2, fam.id)).some((s) => /SHARED-TITLE/.test(s)));
    assert.ok((await M2.c.get('/api/timeline')).data.activity.some((a) => /SHARED-TITLE/.test(a.summary)));
    assert.ok((await M2.c.get('/api/dashboard')).data.familyActivity.some((a) => /SHARED-TITLE/.test(a.summary)));
    assert.ok((await M2.c.get('/api/search?q=SHARED-COMMENT')).data.results.length >= 1);
    const n = await notifs(M2);
    assert.ok(n.some((s) => /SHARED-COMMENT/.test(s)) && n.some((s) => /SHARED-TITLE/.test(s)));
  });

  await t.test('F-04 tasks switched to private later, and rows written by the old code, are hidden when read (nothing deleted)', async () => {
    const { O, M2, fam } = await privacyWorld();
    const tsk = (await O.c.post('/api/tasks', { title: 'WAS-SHARED', familyId: fam.id, visibility: 'family' })).data.task;
    assert.ok((await feed(M2, fam.id)).some((s) => /WAS-SHARED/.test(s)), 'visible while shared');
    await O.c.patch(`/api/tasks/${tsk.id}`, { visibility: 'private' });
    assert.ok(!(await feed(M2, fam.id)).some((s) => /WAS-SHARED/.test(s)), 'hidden once private');
    assert.ok(!(await M2.c.get('/api/timeline')).data.activity.some((a) => /WAS-SHARED/.test(a.summary)));
    assert.equal((await db.get("SELECT COUNT(*) c FROM activity_log WHERE link = ?", [`#/tasks/${tsk.id}`])).c >= 1, true, 'the log rows still exist');
    // a private task whose activity was written with family_id by the old code
    const legacyTask = (await O.c.post('/api/tasks', { title: 'LEGACY-PRIVATE' })).data.task;
    await db.run("UPDATE tasks SET family_id = ? WHERE id = ?", [fam.id, legacyTask.id]);
    await db.run("INSERT INTO activity_log (user_id, family_id, type, summary, link) VALUES (?, ?, 'task_created', 'legacy row LEGACY-PRIVATE', ?)", [O.id, fam.id, `#/tasks/${legacyTask.id}`]);
    assert.ok(!(await feed(M2, fam.id)).some((s) => /LEGACY-PRIVATE/.test(s)));
    assert.ok(!(await M2.c.get('/api/dashboard')).data.familyActivity.some((a) => /LEGACY-PRIVATE/.test(a.summary)));
    assert.ok((await O.c.get('/api/timeline')).data.activity.some((a) => /LEGACY-PRIVATE/.test(a.summary)), 'the author still sees own activity in own Timeline');
    // fail closed on an unexpected visibility value
    await db.run("UPDATE tasks SET visibility = 'weird' WHERE id = ?", [tsk.id]);
    assert.ok(!(await feed(M2, fam.id)).some((s) => /WAS-SHARED/.test(s)));
  });

  await t.test('F-04 private task with no family and other users\' private tasks never surface through search comments or notifications', async () => {
    const A = await newUser(), B = await newUser();
    await makeFamily(A, B);
    const tsk = (await A.c.post('/api/tasks', { title: 'A-ONLY', visibility: 'private' })).data.task;
    await A.c.post(`/api/tasks/${tsk.id}/comments`, { body: 'A-ONLY-COMMENT' });
    assert.deepEqual((await B.c.get('/api/search?q=A-ONLY')).data.results, []);
    assert.ok(!(await notifs(B)).some((s) => /A-ONLY/.test(s)));
    assert.equal((await B.c.post(`/api/tasks/${tsk.id}/comments`, { body: 'intruder' })).status, 404);
  });

  // ============================== F-13 ==============================
  await t.test('F-13 owner integrity: owner cannot demote or change own role; nobody can change the owner row; exactly one owner remains', async () => {
    const O = await newUser(), M = await newUser(), X = await newUser();
    const fam = await makeFamily(O, M);
    const ownRow = memberRow(fam, O.id);
    for (const role of ['member', 'admin']) {
      const r = await O.c.patch(`/api/family/${fam.id}/members/${ownRow.id}`, { role });
      assert.equal(r.status, 400, `owner -> ${role}`);
      assert.match(r.data.error, /transfer ownership/i);
    }
    assert.equal((await O.c.patch(`/api/family/${fam.id}/members/${ownRow.id}`, { role: 'owner' })).status, 400, 'invalid role value');
    assert.equal((await M.c.patch(`/api/family/${fam.id}/members/${ownRow.id}`, { role: 'member' })).status, 403, 'a member cannot touch the owner row');
    assert.equal((await X.c.patch(`/api/family/${fam.id}/members/${ownRow.id}`, { role: 'member' })).status, 403);
    assert.equal((await anon().patch(`/api/family/${fam.id}/members/${ownRow.id}`, { role: 'member' })).status, 401);
    assert.equal((await O.c.patch(`/api/family/${fam.id}/members/999999`, { role: 'member' })).status, 404);
    const otherFam = await makeFamily(X);
    assert.equal((await O.c.patch(`/api/family/${fam.id}/members/${memberRow(otherFam, X.id).id}`, { role: 'member' })).status, 404, 'a row of another family cannot be reached through this family');
    assert.equal(memberRow((await X.c.get(`/api/family/${otherFam.id}`)).data.family, X.id).role, 'owner');
    assert.equal((await ownerRows(fam.id)).length, 1);
    assert.equal((await ownerRows(fam.id))[0].user_id, O.id);
    assert.equal((await db.get('SELECT owner_id FROM families WHERE id = ?', [fam.id])).owner_id, O.id);
    // ordinary role management still works for non-owners
    assert.equal((await O.c.patch(`/api/family/${fam.id}/members/${memberRow(fam, M.id).id}`, { role: 'admin' })).status, 200);
    assert.equal((await O.c.patch(`/api/family/${fam.id}/members/${memberRow(fam, M.id).id}`, { role: 'member' })).status, 200);
    // and the family is still recoverable through the explicit transfer
    assert.equal((await O.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: memberRow(fam, M.id).id })).status, 200);
    assert.equal((await ownerRows(fam.id)).length, 1);
    assert.equal((await ownerRows(fam.id))[0].user_id, M.id);
  });

  await t.test('F-13 sole owner: cannot self-demote, cannot leave, cannot transfer, cannot delete the account', async () => {
    const S = await newUser();
    const fam = (await S.c.post('/api/family', { name: 'Solo' })).data.family;
    const own = fam.members[0];
    assert.equal((await S.c.patch(`/api/family/${fam.id}/members/${own.id}`, { role: 'member' })).status, 400);
    assert.equal((await S.c.post(`/api/family/${fam.id}/leave`, {})).status, 400);
    assert.equal((await S.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: own.id })).status, 400);
    assert.equal((await S.c.del('/api/settings/account', { password: S.payload.password })).status, 400);
    assert.equal((await ownerRows(fam.id)).length, 1);
  });

  await t.test('F-13 the database refuses a second owner row; a transfer that fails half-way rolls back to exactly one owner', async () => {
    const O = await newUser(), M = await newUser();
    const fam = await makeFamily(O, M);
    await assert.rejects(async () => db.run("UPDATE family_members SET role = 'owner' WHERE id = ?", [(await memberRow(fam, M.id)).id]), /UNIQUE|constraint/i);
    await db.exec("CREATE FUNCTION h1_boom_fn() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN IF NEW.role = 'owner' THEN RAISE EXCEPTION 'simulated failure'; END IF; RETURN NEW; END $f$; CREATE TRIGGER h1_boom BEFORE UPDATE OF role ON family_members FOR EACH ROW EXECUTE FUNCTION h1_boom_fn();");
    try {
      const r = await O.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: memberRow(fam, M.id).id });
      assert.equal(r.status, 500);
    } finally {
      await db.exec('DROP TRIGGER h1_boom ON family_members; DROP FUNCTION h1_boom_fn();');
    }
    assert.equal((await ownerRows(fam.id)).length, 1);
    assert.equal((await ownerRows(fam.id))[0].user_id, O.id, 'rolled back');
    assert.equal((await db.get('SELECT owner_id FROM families WHERE id = ?', [fam.id])).owner_id, O.id);
    assert.equal((await db.get('SELECT role FROM family_members WHERE id = ?', [memberRow(fam, M.id).id])).role, 'member');
  });

  await t.test('F-13 conflicting concurrent operations always end with exactly one owner that matches families.owner_id', async () => {
    for (let round = 0; round < 4; round++) {
      const O = await newUser(), M = await newUser(), N = await newUser();
      const fam = await makeFamily(O, M, N);
      const results = await Promise.all([
        O.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: memberRow(fam, M.id).id }),
        O.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: memberRow(fam, N.id).id }),
        O.c.patch(`/api/family/${fam.id}/members/${memberRow(fam, O.id).id}`, { role: 'member' }),
        O.c.post(`/api/family/${fam.id}/leave`, {}),
      ]);
      const wins = results.slice(0, 2).filter((r) => r.status === 200);
      assert.equal(wins.length, 1, `exactly one transfer wins (round ${round}): ${results.map((r) => r.status)}`);
      const owners = await ownerRows(fam.id);
      assert.equal(owners.length, 1);
      assert.equal((await db.get('SELECT owner_id FROM families WHERE id = ?', [fam.id])).owner_id, owners[0].user_id);
      assert.ok([M.id, N.id].includes(owners[0].user_id));
    }
  });

  await t.test('regression: owner -> transfer -> old owner leaves -> deletes account -> family survives with one owner', async () => {
    const A = await newUser(), B = await newUser(), C = await newUser();
    const fam = await makeFamily(A, B, C);
    assert.equal((await A.c.post(`/api/family/${fam.id}/transfer-ownership`, { memberId: memberRow(fam, B.id).id })).status, 200);
    assert.equal((await A.c.post(`/api/family/${fam.id}/leave`, {})).status, 200);
    assert.equal((await A.c.del('/api/settings/account', { password: A.payload.password })).status, 200);
    const after = (await B.c.get(`/api/family/${fam.id}`)).data.family;
    assert.equal(after.members.length, 2);
    assert.equal((await ownerRows(fam.id)).length, 1);
    assert.equal(after.ownerId, B.id);
    // PostgreSQL checks every reference as it is written; what can still be looked for is a row left without its parent.
    assert.deepEqual(await db.all('SELECT m.id FROM family_members m LEFT JOIN families f ON f.id = m.family_id WHERE f.id IS NULL'), []);
  });
});
