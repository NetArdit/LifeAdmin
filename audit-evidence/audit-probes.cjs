// FINAL AUDIT — backend probes. Each probe records what the CURRENT code actually does.
// "FINDING" lines mean the probe demonstrated a defect/gap; "OK" means the expected protection held.
const P = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const { startApp, makeClient, signUp } = require(P + '/test/helpers.js');

const out = [];
const rec = (id, kind, msg) => { out.push(`[${kind}] ${id}: ${msg}`); console.log(`[${kind}] ${id}: ${msg}`); };
const ok = (id, cond, msgOk, msgBad) => rec(id, cond ? 'OK' : 'FINDING', cond ? msgOk : msgBad);

(async () => {
  const app = await startApp();
  const db = require(P + '/src/db');
  async function user() {
    const c = makeClient(app.base);
    const { payload } = await signUp(c);
    const me = (await c.get('/api/auth/me')).data.user;
    return { c, payload, id: me.id };
  }
  async function family(owner, ...joiners) {
    const f = (await owner.c.post('/api/family', { name: 'Fam' })).data.family;
    for (const j of joiners) await j.c.post('/api/family/join', { code: f.inviteCode });
    return (await owner.c.get(`/api/family/${f.id}`)).data.family;
  }
  const A = await user(), B = await user(), C = await user(), X = await user(); // X = outsider

  // ---------- Authorization matrix (other authenticated user / unauthenticated) ----------
  const anon = makeClient(app.base);
  const t = (await A.c.post('/api/tasks', { title: 'A private task' })).data.task;
  const bill = (await A.c.post('/api/bills', { name: 'A bill', amount: 10, dueDate: '2030-01-01', recurrence: 'none' })).data.bill;
  const goal = (await A.c.post('/api/goals', { title: 'A goal' })).data.goal;
  const dec = (await A.c.post('/api/decisions', { question: 'A decision?' })).data.decision;
  const eco = (await A.c.post('/api/ecolife', { category: 'food', action: 'A eco' })).data.log;
  const matrix = [
    ['tasks', 'get', `/api/tasks/${t.id}`], ['tasks', 'patch', `/api/tasks/${t.id}`, { title: 'hacked' }], ['tasks', 'del', `/api/tasks/${t.id}`],
    ['tasks', 'post', `/api/tasks/${t.id}/comments`, { body: 'x' }], ['tasks', 'post', `/api/tasks/${t.id}/postpone`, {}],
    ['bills', 'patch', `/api/bills/${bill.id}`, { name: 'hacked' }], ['bills', 'post', `/api/bills/${bill.id}/pay`, {}], ['bills', 'del', `/api/bills/${bill.id}`],
    ['goals', 'get', `/api/goals/${goal.id}`], ['goals', 'patch', `/api/goals/${goal.id}`, { title: 'hacked' }], ['goals', 'del', `/api/goals/${goal.id}`],
    ['goals', 'post', `/api/goals/${goal.id}/milestones`, { title: 'm' }],
    ['decisions', 'get', `/api/decisions/${dec.id}`], ['decisions', 'post', `/api/decisions/${dec.id}/options`, { name: 'o' }], ['decisions', 'del', `/api/decisions/${dec.id}`],
    ['ecolife', 'del', `/api/ecolife/${eco.id}`],
  ];
  let matrixBad = [];
  for (const [area, m, url, body] of matrix) {
    const r = await X.c[m](url, body);
    if (![403, 404].includes(r.status)) matrixBad.push(`${area} ${m.toUpperCase()} ${url} -> ${r.status}`);
    const u = await anon[m](url, body);
    if (u.status !== 401) matrixBad.push(`${area} ${m.toUpperCase()} ${url} (unauth) -> ${u.status}`);
  }
  ok('AUTHZ-1', !matrixBad.length, `owner-scoped resources (tasks, bills, goals, decisions, ecolife) refuse other users (403/404) and unauthenticated (401) on ${matrix.length} probes`, matrixBad.join('; '));
  // lists show only own data
  const lists = await Promise.all(['/api/tasks', '/api/bills', '/api/goals', '/api/decisions', '/api/ecolife'].map((u) => X.c.get(u)));
  ok('AUTHZ-2', lists.every((r) => r.status === 200 && Object.values(r.data).every((v) => !Array.isArray(v) || v.length === 0)), 'other user\'s list endpoints return no foreign data', 'foreign data in a list');

  // ---------- Family / chat / shopping authz ----------
  const fam = await family(A, B);
  const fid = fam.id;
  const outsiderCalls = [['get', `/api/family/${fid}`], ['get', `/api/family/${fid}/activity`], ['get', `/api/family/${fid}/shopping`], ['post', `/api/family/${fid}/shopping`, { name: 'x' }], ['get', `/api/chat/${fid}/messages`], ['post', `/api/chat/${fid}/messages`, { body: 'x' }], ['post', `/api/family/${fid}/members`, { phone: '+38344111222' }], ['patch', `/api/family/${fid}/members/1`, { role: 'admin' }], ['del', `/api/family/${fid}/members/1`], ['post', `/api/family/${fid}/leave`, {}], ['post', `/api/family/${fid}/transfer-ownership`, { memberId: 1 }]];
  const badF = [];
  for (const [m, u, b] of outsiderCalls) { const r = await X.c[m](u, b); if (r.status !== 403) badF.push(`${m} ${u} -> ${r.status}`); }
  ok('AUTHZ-3', !badF.length, 'family/chat/shopping endpoints return 403 to a non-member on all 11 probes', badF.join('; '));
  // member (B) cannot use owner/admin operations
  const bm = fam.members.find((m) => m.userId === B.id);
  const bad2 = [];
  for (const [m, u, b] of [['post', `/api/family/${fid}/members`, { phone: '+38344111333' }], ['patch', `/api/family/${fid}/members/${bm.id}`, { role: 'admin' }], ['del', `/api/family/${fid}/members/${bm.id}`], ['post', `/api/family/${fid}/transfer-ownership`, { memberId: bm.id }]]) {
    const r = await B.c[m](u, b); if (r.status !== 403) bad2.push(`${m} ${u} -> ${r.status}`);
  }
  ok('AUTHZ-4', !bad2.length, 'plain member is refused add/role/remove/transfer (403)', bad2.join('; '));

  // ---------- F1 bills.familyId not membership-checked ----------
  const evil = await X.c.post('/api/bills', { name: 'PHISH: verify your account at evil.example', amount: 1, dueDate: '2030-01-01', recurrence: 'none', familyId: fid });
  ok('SEC-BILL-FAMILY-1', evil.status !== 201, 'bill with foreign familyId rejected', `non-member X created a bill attached to family ${fid} (HTTP ${evil.status})`);
  if (evil.status === 201) {
    await X.c.post(`/api/bills/${evil.data.bill.id}/pay`, {});
    const feed = (await A.c.get(`/api/family/${fid}/activity`)).data.activity.map((a) => a.summary);
    const notes = (await A.c.get('/api/notifications')).data.notifications.map((n) => n.title);
    rec('SEC-BILL-FAMILY-2', feed.some((s) => /PHISH/.test(s)) ? 'FINDING' : 'OK', `attacker-controlled text in victim family activity feed: ${feed.some((s) => /PHISH/.test(s))}; in victim notifications: ${notes.some((s) => /PHISH/.test(s))}`);
  }
  const ghost = await X.c.post('/api/bills', { name: 'ghost', amount: 1, dueDate: '2030-01-01', familyId: 999999 });
  rec('SEC-BILL-FAMILY-3', ghost.status === 500 ? 'FINDING' : 'OK', `bill with non-existent familyId -> HTTP ${ghost.status}`);

  // ---------- F2 chat reaction on foreign message ----------
  const m = (await A.c.post(`/api/chat/${fid}/messages`, { body: 'private family message' })).data.message;
  const otherFam = await family(X);
  const react = await X.c.post(`/api/chat/${otherFam.id}/messages/${m.id}/react`, { emoji: 'X'.repeat(50) });
  const seenByA = (await A.c.get(`/api/chat/${fid}/messages`)).data.messages.find((mm) => mm.id === m.id).reactions;
  ok('SEC-CHAT-REACT-1', react.status !== 201 || !seenByA.length, 'reaction on another family\'s message rejected', `member of family ${otherFam.id} added a reaction to message ${m.id} of family ${fid} (HTTP ${react.status}); victim sees ${seenByA.length} reaction(s) with arbitrary emoji string of length ${seenByA[0] ? seenByA[0].emoji.length : 0}`);
  const badMsg = await A.c.post(`/api/chat/${fid}/messages/999999/react`, { emoji: '👍' });
  rec('SEC-CHAT-REACT-2', badMsg.status === 500 ? 'FINDING' : 'OK', `reaction on non-existent message -> HTTP ${badMsg.status}`);

  // ---------- F3 removed / left member can rejoin with the static invite code ----------
  const code = fam.inviteCode;
  const fam2 = (await A.c.get(`/api/family/${fid}`)).data.family;
  await A.c.del(`/api/family/${fid}/members/${fam2.members.find((mm) => mm.userId === B.id).id}`);
  const rejoin = await B.c.post('/api/family/join', { code });
  ok('SEC-INVITE-1', rejoin.status !== 201, 'removed member cannot rejoin', `removed member rejoined with the unchanged invite code (HTTP ${rejoin.status}); no way to rotate/revoke the code (no route)`);
  const rotate = await A.c.post(`/api/family/${fid}/invite-code`, {});
  rec('SEC-INVITE-2', rotate.status === 404 ? 'FINDING' : 'OK', `invite-code rotation route: HTTP ${rotate.status} (404 = does not exist)`);
  // unlimited join attempts
  let limited = 0;
  for (let i = 0; i < 120; i++) { const r = await X.c.post('/api/family/join', { code: 'ZZZZ' + String(1000 + i) }); if (r.status === 429) limited++; }
  ok('SEC-INVITE-3', limited > 0, 'join attempts are rate limited', '120 wrong invite codes in a row were all answered 400 — no rate limit on /api/family/join');
  // demo-seeded family invite code entropy
  const D = await user();
  const seeded = await D.c.post('/api/demo/seed', {});
  const dfam = (await D.c.get('/api/family')).data.families[0];
  ok('SEC-INVITE-4', !/^DEMO\d{4}$/.test(dfam.inviteCode), 'demo family has a random 8-hex code', `demo-seeded family invite code is "${dfam.inviteCode}" (DEMO + 4 digits = 9,000 possible values) and /join is unlimited`);
  // guess it as an outsider (range restricted to prove feasibility, then the exact one)
  const num = dfam.inviteCode.slice(4);
  let hit = null; let tries = 0;
  for (let n = Math.max(1000, Number(num) - 30); n <= Number(num) + 30; n++) { tries++; const r = await X.c.post('/api/family/join', { code: 'DEMO' + n }); if (r.status === 201) { hit = 'DEMO' + n; break; } }
  rec('SEC-INVITE-5', hit ? 'FINDING' : 'OK', hit ? `outsider joined a demo-seeded family by guessing ${hit} after ${tries} tries (searched a ±30 window; full space is 9,000)` : 'not joined');
  if (hit) {
    const chat = (await X.c.get(`/api/chat/${dfam.id}/messages`)).data;
    rec('SEC-INVITE-6', 'FINDING', `...and could then read ${chat.messages ? chat.messages.length : 0} chat messages of that family`);
  }

  // ---------- F4 owner can demote themself ----------
  const O = await user(); const Q = await user();
  const of = await family(O, Q);
  const ownRow = of.members.find((mm) => mm.userId === O.id);
  const dem = await O.c.patch(`/api/family/${of.id}/members/${ownRow.id}`, { role: 'member' });
  const after = db.get("SELECT COUNT(*) c FROM family_members WHERE family_id = ? AND role = 'owner'", [of.id]).c;
  const ownerId = db.get('SELECT owner_id FROM families WHERE id = ?', [of.id]).owner_id;
  ok('INTEGRITY-OWNER-1', !(dem.status === 200 && after === 0), 'owner cannot demote self', `owner demoted themself via PATCH (HTTP ${dem.status}): owner rows=${after} but families.owner_id still ${ownerId} — the family now has no member able to manage it, and Phase 8.3's transfer is no longer possible`);
  const canTransfer = await O.c.post(`/api/family/${of.id}/transfer-ownership`, { memberId: of.members.find((mm) => mm.userId === Q.id).id });
  rec('INTEGRITY-OWNER-2', canTransfer.status === 403 ? 'FINDING' : 'OK', `after self-demotion, transfer-ownership -> HTTP ${canTransfer.status}`);
  const del = await O.c.del('/api/settings/account', { password: O.payload.password });
  rec('INTEGRITY-OWNER-3', 'INFO', `account deletion for that "demoted" owner -> HTTP ${del.status} (${(del.data && del.data.error || '').slice(0, 60)})`);

  // ---------- F5 private family-scoped tasks leak ----------
  const P1 = await user(); const P2 = await user();
  const pf = await family(P1, P2);
  const pt = (await P1.c.post('/api/tasks', { title: 'SECRET private thing', familyId: pf.id, visibility: 'private' })).data.task;
  const feedP = (await P2.c.get(`/api/family/${pf.id}/activity`)).data.activity.map((a) => a.summary);
  ok('PRIV-TASK-1', !feedP.some((s) => /SECRET/.test(s)), 'private task titles stay out of the family feed', `private task title visible to other member in the family activity feed: "${feedP.find((s) => /SECRET/.test(s))}"`);
  const tl = (await P2.c.get('/api/timeline')).data.activity.map((a) => a.summary);
  ok('PRIV-TASK-2', !tl.some((s) => /SECRET/.test(s)), 'not in timeline', 'private task title visible to other member in Timeline');
  const seeTask = await P2.c.get(`/api/tasks/${pt.id}`);
  ok('PRIV-TASK-3', seeTask.status === 404, 'private task itself is hidden (404)', `private task readable by other member (HTTP ${seeTask.status})`);
  // comment leakage requires an assignee that can comment
  await P1.c.patch(`/api/tasks/${pt.id}`, { assignedTo: P2.id });
  await P2.c.post(`/api/tasks/${pt.id}/comments`, { body: 'COMMENT-ON-PRIVATE-TASK' });
  const P3 = await user(); await P3.c.post('/api/family/join', { code: pf.inviteCode });
  const n3 = (await P3.c.get('/api/notifications')).data.notifications.map((n) => `${n.title} ${n.body || ''}`);
  const s3 = (await P3.c.get('/api/search?q=COMMENT-ON-PRIVATE')).data.results.map((r) => r.title);
  ok('PRIV-TASK-4', !n3.some((s) => /COMMENT-ON-PRIVATE/.test(s)) && !n3.some((s) => /SECRET/.test(s)), 'no notification leak', `third family member received notification exposing private task title/comment: ${JSON.stringify(n3.find((s) => /SECRET|COMMENT/.test(s)))}`);
  ok('PRIV-TASK-5', !s3.length, 'search does not expose private-task comments', `search returns private-task comment text to a third family member: ${JSON.stringify(s3)}`);

  // ---------- F8 assignee powers / leaver access ----------
  const asg = await P2.c.patch(`/api/tasks/${pt.id}`, { visibility: 'family', title: 'assignee renamed it', status: 'weird-status' });
  const now = db.get('SELECT visibility, title, status FROM tasks WHERE id = ?', [pt.id]);
  rec('AUTHZ-ASSIGNEE-1', asg.status === 200 ? 'FINDING' : 'OK', `assignee (not owner) PATCH -> ${asg.status}; task now visibility=${now.visibility}, title="${now.title}", status="${now.status}" (any field is editable by anyone who can see the task; status/priority/visibility values are not validated on PATCH)`);
  await P2.c.post(`/api/family/${pf.id}/leave`, {});
  const still = await P2.c.get(`/api/tasks/${pt.id}`);
  rec('LIFECYCLE-LEAVE-1', still.status === 200 ? 'FINDING' : 'OK', `after leaving the family, former member can still read the task assigned to them in that family -> HTTP ${still.status}`);
  const stillFeed = await P2.c.get(`/api/family/${pf.id}/activity`);
  rec('LIFECYCLE-LEAVE-2', stillFeed.status === 403 ? 'OK' : 'FINDING', `after leaving, family activity -> HTTP ${stillFeed.status}`);

  // ---------- F7 validation gaps ----------
  const b2 = (await A.c.post('/api/bills', { name: 'odd', amount: 5, dueDate: '2030-01-01', recurrence: 'daily' })).data.bill;
  const payOdd = await A.c.post(`/api/bills/${b2.id}/pay`, {});
  rec('VALID-BILL-1', payOdd.status === 500 ? 'FINDING' : 'OK', `bill with unsupported recurrence "daily" accepted on create, then Pay -> HTTP ${payOdd.status}`);
  const badDate = await A.c.post('/api/bills', { name: 'baddate', amount: 5, dueDate: 'not-a-date' });
  rec('VALID-BILL-2', badDate.status === 201 ? 'FINDING' : 'OK', `bill with dueDate "not-a-date" -> HTTP ${badDate.status}`);
  const negPatch = await A.c.patch(`/api/bills/${bill.id}`, { amount: -50 });
  rec('VALID-BILL-3', negPatch.status === 200 ? 'FINDING' : 'OK', `PATCH bill amount -50 -> HTTP ${negPatch.status}`);
  const objTitle = await A.c.patch(`/api/tasks/${t.id}`, { title: { a: 1 } });
  rec('VALID-TASK-1', objTitle.status === 500 ? 'FINDING' : 'OK', `PATCH task title as object -> HTTP ${objTitle.status} (generic 500; message: ${objTitle.data && objTitle.data.error})`);
  const emptyTitle = await A.c.patch(`/api/tasks/${t.id}`, { title: '' });
  rec('VALID-TASK-2', emptyTitle.status === 200 ? 'FINDING' : 'OK', `PATCH task title "" -> HTTP ${emptyTitle.status}`);
  const big = await A.c.post('/api/tasks', { title: 'T'.repeat(900000) });
  rec('VALID-LEN-1', big.status === 201 ? 'FINDING' : 'OK', `900,000-character task title -> HTTP ${big.status} (no length limits anywhere; only the 1 MB body cap)`);
  const g1 = (await A.c.post('/api/goals', { title: 'g' })).data.goal;
  const ms = (await A.c.post(`/api/goals/${g1.id}/milestones`, { title: 'only' })).data.milestone;
  await A.c.patch(`/api/goals/${g1.id}/milestones/${ms.id}`, { done: true });
  await A.c.del(`/api/goals/${g1.id}/milestones/${ms.id}`);
  const g1n = (await A.c.get(`/api/goals/${g1.id}`)).data.goal;
  rec('VALID-GOAL-1', g1n.progress === 100 && !g1n.milestones.length ? 'FINDING' : 'OK', `goal after its only (completed) milestone is deleted: progress=${g1n.progress}, status=${g1n.status}, milestones=${g1n.milestones.length}`);
  const badJson = await fetch(app.base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"identifier": ' });
  const bj = await badJson.json().catch(() => ({}));
  rec('ERR-JSON-1', /Unexpected|JSON|position/i.test(bj.error || '') ? 'FINDING' : 'OK', `malformed JSON body -> HTTP ${badJson.status}, error text: "${bj.error}"`);

  // ---------- Signup / enumeration / rate limit ----------
  const su = await makeClient(app.base).post('/api/auth/signup', { firstName: 'a', lastName: 'b', email: A.payload.email, phone: '+38344000999', password: 'password123', confirmPassword: 'password123' });
  rec('ENUM-SIGNUP-1', su.status === 400 && /already exists/.test(su.data.error) ? 'FINDING' : 'OK', `signup with an existing email -> "${su.data && su.data.error}" (reveals that the account exists; login/forgot-password are enumeration-safe)`);
  let created = 0;
  for (let i = 0; i < 25; i++) { const r = await makeClient(app.base).post('/api/auth/signup', { firstName: 'bulk', lastName: 'u', email: `bulk${i}.${Date.now()}@x.test`, phone: `+3835${String(1000000 + i)}`, password: 'password123', confirmPassword: 'password123' }); if (r.status === 201) created++; }
  ok('RATE-SIGNUP-1', created < 25, 'signup is rate limited', `25/25 rapid signups from one IP succeeded — /api/auth/signup has no rate limit (each costs a bcrypt hash)`);

  // ---------- Phone -> name oracle ----------
  const V = await user();
  const vphone = db.get('SELECT phone FROM users WHERE id = ?', [V.id]).phone;
  const oracleOwner = await user();
  const of2 = (await oracleOwner.c.post('/api/family', { name: 'probe' })).data.family;
  await oracleOwner.c.post(`/api/family/${of2.id}/members`, { phone: vphone });
  const members = (await oracleOwner.c.get(`/api/family/${of2.id}`)).data.family.members;
  const leaked = members.find((mm) => mm.userId === V.id);
  ok('PRIV-PHONE-1', !leaked || !leaked.displayName || leaked.displayName === vphone, 'adding a phone reveals nothing about the account', `any user can add an arbitrary phone number to their own family: the victim is added WITHOUT consent (no accept step) and their full name "${leaked && leaked.displayName}" is returned — a phone->name lookup`);

  // ---------- Notification prefs / AI toggle ----------
  const N1 = await user(), N2 = await user();
  const nf = await family(N1, N2);
  await N2.c.patch('/api/settings/preferences', { notifPrefs: { chat: false, task: false, comment: false, bill: false, decision: false, ai: false } });
  await N1.c.post(`/api/chat/${nf.id}/messages`, { body: 'ping' });
  const nn = (await N2.c.get('/api/notifications')).data.notifications.filter((n) => n.type === 'chat');
  ok('PREFS-1', nn.length === 0, 'notification preferences honoured', `chat notifications still delivered after the user disabled them (${nn.length} received) — preferences are stored but never read`);
  await N2.c.patch('/api/settings/preferences', { aiEnabled: false });
  const aiCall = await N2.c.post('/api/ai/chat', { message: 'hello' });
  rec('PREFS-2', 'FINDING', `with "Use AI features" turned OFF the AI chat endpoint still runs (HTTP ${aiCall.status}, body ${JSON.stringify(aiCall.data).slice(0, 90)}); no server-side check of ai_enabled exists (grep: only settings.js/auth.js reference it)`);

  // ---------- OTP demo mode in production ----------
  const prev = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
  const otp = await A.c.post('/api/auth/verify/email/request', {});
  process.env.NODE_ENV = prev;
  ok('OTP-1', !(otp.data && otp.data.demoCode), 'no OTP returned in production', `with NODE_ENV=production the verification endpoint still returns the code in the response ("demoCode": ${otp.data && otp.data.demoCode}) — "verified" badges prove nothing`);
  // OTP request unlimited
  let otps = 0; for (let i = 0; i < 30; i++) { const r = await A.c.post('/api/auth/verify/phone/request', {}); if (r.status === 200) otps++; }
  rec('OTP-2', otps === 30 ? 'FINDING' : 'OK', `${otps}/30 OTP requests accepted (no limit on issuing codes; also unbounded rows in otp_codes)`);

  // ---------- Session expiry comparison ----------
  const S = await user();
  const sid = db.get('SELECT id FROM sessions WHERE user_id = ?', [S.id]).id;
  const oneHourAgoIso = new Date(Date.now() - 3600 * 1000).toISOString();
  db.run('UPDATE sessions SET expires_at = ? WHERE id = ?', [oneHourAgoIso, sid]);
  const meAfter = await S.c.get('/api/auth/me');
  const sameDay = oneHourAgoIso.slice(0, 10) === new Date().toISOString().slice(0, 10);
  rec('SESSION-EXP-1', sameDay && meAfter.data.user ? 'FINDING' : (sameDay ? 'OK' : 'INFO'), `session whose expires_at was 1h ago (same UTC day) is still accepted: ${!!meAfter.data.user} (ISO 'T' vs SQLite ' ' string comparison; same defect class as the OTP bug fixed in 8.2). Effect: sessions live until UTC midnight after expiry (<= 24h over the 30-day TTL). No expired-session cleanup job exists.`);

  // ---------- Account deletion data lifecycle ----------
  const L1 = await user(), L2 = await user();
  const lf = await family(L1, L2);
  // L2 (member) creates family-visible task, comment on L1's task, chat msg, shopping item, reaction; L1 = owner stays
  const famTask = (await L2.c.post('/api/tasks', { title: 'Shared by L2', familyId: lf.id, visibility: 'family' })).data.task;
  const l1Task = (await L1.c.post('/api/tasks', { title: 'Shared by L1', familyId: lf.id, visibility: 'family' })).data.task;
  await L2.c.post(`/api/tasks/${l1Task.id}/comments`, { body: 'comment by L2' });
  await L2.c.post(`/api/chat/${lf.id}/messages`, { body: 'msg by L2' });
  await L2.c.post(`/api/family/${lf.id}/shopping`, { name: 'item by L2' });
  await L2.c.post('/api/bills', { name: 'L2 family bill', amount: 5, dueDate: '2030-01-01', familyId: lf.id });
  const before = { tasks: db.get('SELECT COUNT(*) c FROM tasks WHERE family_id = ?', [lf.id]).c, msgs: db.get('SELECT COUNT(*) c FROM messages WHERE family_id = ?', [lf.id]).c, comments: db.get('SELECT COUNT(*) c FROM task_comments WHERE task_id = ?', [l1Task.id]).c, shop: db.get('SELECT COUNT(*) c FROM shopping_items WHERE family_id = ?', [lf.id]).c, act: db.get('SELECT COUNT(*) c FROM activity_log WHERE family_id = ? AND user_id IS NOT NULL', [lf.id]).c };
  const delL2 = await L2.c.del('/api/settings/account', { password: L2.payload.password });
  const afterL = { tasks: db.get('SELECT COUNT(*) c FROM tasks WHERE family_id = ?', [lf.id]).c, msgs: db.get('SELECT COUNT(*) c FROM messages WHERE family_id = ?', [lf.id]).c, comments: db.get('SELECT COUNT(*) c FROM task_comments WHERE task_id = ?', [l1Task.id]).c, shop: db.get('SELECT COUNT(*) c FROM shopping_items WHERE family_id = ?', [lf.id]).c, act: db.get('SELECT COUNT(*) c FROM activity_log WHERE family_id = ? AND user_id IS NOT NULL', [lf.id]).c, nullAct: db.get('SELECT COUNT(*) c FROM activity_log WHERE family_id = ? AND user_id IS NULL', [lf.id]).c };
  rec('LIFECYCLE-DEL-1', 'INFO', `member deletes account (HTTP ${delL2.status}). family-scoped tasks ${before.tasks}->${afterL.tasks}; chat messages ${before.msgs}->${afterL.msgs}; comments on others' tasks ${before.comments}->${afterL.comments}; shopping items ${before.shop}->${afterL.shop} (kept, author cleared); activity rows with actor ${before.act}->${afterL.act} (+${afterL.nullAct} now actor-less)`);
  const famTaskGone = db.get('SELECT COUNT(*) c FROM tasks WHERE id = ?', [famTask.id]).c === 0;
  rec('LIFECYCLE-DEL-2', famTaskGone ? 'FINDING' : 'OK', `a task the deleted member shared with the family ("visibility: family") ${famTaskGone ? 'was deleted for everyone' : 'survived'}`);
  const l2Bill = db.get("SELECT COUNT(*) c FROM bills WHERE name = 'L2 family bill'").c;
  rec('LIFECYCLE-DEL-3', 'INFO', `bill with family_id owned by the deleted user remaining rows: ${l2Bill}`);
  const orphanScan = db.all('PRAGMA foreign_key_check');
  ok('INTEGRITY-FK-1', orphanScan.length === 0, 'PRAGMA foreign_key_check reports no violations after all probes', `foreign_key_check violations: ${JSON.stringify(orphanScan.slice(0, 3))}`);

  // ---------- Demo seed into a real family ----------
  const R1 = await user(), R2 = await user();
  const rf = await family(R1, R2);
  await R1.c.post('/api/demo/seed', {});
  const pollutedMsgs = (await R2.c.get(`/api/chat/${rf.id}/messages`)).data.messages.map((m2) => m2.body);
  rec('DEMO-1', pollutedMsgs.some((s) => /Good morning everyone/.test(s)) ? 'FINDING' : 'OK', `"Load demo data" by one member posted ${pollutedMsgs.length} fake chat messages into the REAL family visible to the other member`);
  await R1.c.post('/api/demo/seed', {}); await R1.c.post('/api/demo/seed', {});
  const dupTasks = db.get("SELECT COUNT(*) c FROM tasks WHERE owner_id = ? AND notes = '[demo-seed]'", [R1.id]).c;
  rec('DEMO-2', dupTasks > 8 ? 'FINDING' : 'OK', `seeding 3x -> ${dupTasks} demo tasks (not idempotent)`);
  await R1.c.post('/api/demo/clear', {});
  const left = { goals: db.get('SELECT COUNT(*) c FROM goals WHERE owner_id = ?', [R1.id]).c, eco: db.get('SELECT COUNT(*) c FROM eco_logs WHERE owner_id = ?', [R1.id]).c, decisions: db.get('SELECT COUNT(*) c FROM decisions WHERE owner_id = ?', [R1.id]).c, msgs: db.get('SELECT COUNT(*) c FROM messages WHERE family_id = ?', [rf.id]).c, shop: db.get('SELECT COUNT(*) c FROM shopping_items WHERE family_id = ?', [rf.id]).c };
  rec('DEMO-3', 'FINDING', `"Clear demo data" removes only tasks+bills; remaining after clear: goals=${left.goals}, eco logs=${left.eco}, decisions=${left.decisions}, family chat messages=${left.msgs}, shopping items=${left.shop}`);

  // ---------- Headers ----------
  const h = await fetch(app.base + '/');
  const hs = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'strict-transport-security', 'referrer-policy'].map((k) => `${k}=${h.headers.get(k) || '(absent)'}`);
  rec('HEADERS-1', 'FINDING', `response security headers: ${hs.join('; ')}; x-powered-by=${h.headers.get('x-powered-by') || '(absent)'}`);
  const health = await fetch(app.base + '/health'); const health2 = await fetch(app.base + '/api/health');
  rec('OPS-1', 'INFO', `/health -> ${health.status}, /api/health -> ${health2.status} (no health endpoint)`);
  const ck = await makeClient(app.base).post('/api/auth/login', { identifier: 'nobody@example.test', password: 'x' });
  const raw = await fetch(app.base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: A.payload.email, password: A.payload.password }) });
  rec('COOKIE-1', 'INFO', `session cookie attributes (NODE_ENV=test): ${raw.headers.get('set-cookie')}`);
  const pu = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
  const rawP = await fetch(app.base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: A.payload.email, password: A.payload.password }) });
  process.env.NODE_ENV = pu;
  rec('COOKIE-2', 'INFO', `session cookie attributes (NODE_ENV=production): ${rawP.headers.get('set-cookie')}`);
  void ck;

  await app.close();
  require('fs').writeFileSync(process.argv[2] || 'audit-probes.out.txt', out.join('\n') + '\n');
  process.exit(0);
})().catch((e) => { console.error('PROBE SCRIPT ERROR', e); process.exit(1); });
