// Hardening 1.5 — Gate A research probes. READ-ONLY with respect to the product: these call the running
// (unmodified) API on disposable databases and record what the code actually does today.
const http = require('node:http');
const P = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';

const out = [];
const rec = (id, kind, msg) => { out.push(`[${kind}] ${id}: ${msg}`); console.log(`[${kind}] ${id}: ${msg}`); };

(async () => {
  // ---- mock Anthropic endpoint (captures what the assistant would send) ----
  const captured = [];
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { captured.push(JSON.parse(body)); } catch { captured.push({ raw: body }); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_mock', type: 'message', role: 'assistant', model: 'mock',
        content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', suggestions: [] }) }],
        stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
      }));
    });
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  process.env.ANTHROPIC_API_KEY = 'sk-ant-FAKE-for-local-mock';
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${mock.address().port}`;

  const { startApp, makeClient, signUp } = require(P + '/test/helpers.js');
  const aiLib = require(P + '/src/lib/ai.js');
  aiLib.assistantChat = async (args) => { captured.push(args); return { ok: true, data: { reply: 'ok', suggestions: [] } }; };
  aiLib.weeklyReview = async (ctx) => { captured.push(ctx); return { ok: true, data: { headline: 'h', highlights: [], forgettingChecklist: [] } }; };
  const app = await startApp();
  const db = require(P + '/src/db');
  const { resetAllLimits } = require(P + '/src/lib/authLimits');
  const mk = async () => { const c = makeClient(app.base); const { payload } = await signUp(c); return { c, payload, id: (await c.get('/api/auth/me')).data.user.id }; };
  const fam = async (o, ...js) => { const f = (await o.c.post('/api/family', { name: 'F' })).data.family; for (const j of js) await j.c.post('/api/family/join', { code: f.inviteCode }); return (await o.c.get(`/api/family/${f.id}`)).data.family; };
  const row = (f, uid) => f.members.find((m) => m.userId === uid);
  const notifs = async (u) => (await u.c.get('/api/notifications')).data.notifications.map((n) => `${n.title} | ${n.body || ''}`);

  // ============ P1: what does a REMOVED member keep? ============
  {
    const O = await mk(), M = await mk(), N = await mk();
    const f = await fam(O, M, N);
    const due = new Date().toISOString().slice(0, 10);
    const T = (await O.c.post('/api/tasks', { title: 'FAMTASK-assigned-to-M', familyId: f.id, visibility: 'family', assignedTo: M.id, dueDate: due })).data.task;
    await N.c.post(`/api/tasks/${T.id}/comments`, { body: 'THREAD-COMMENT-by-N (family discussion)' });
    const Tm = (await M.c.post('/api/tasks', { title: 'FAMTASK-owned-by-M', familyId: f.id, visibility: 'family', dueDate: due })).data.task;
    await O.c.del(`/api/family/${f.id}/members/${row(f, M.id).id}`);
    rec('P1-0', 'INFO', `M removed by owner; M's families now: ${JSON.stringify((await M.c.get('/api/family')).data.families.length)}`);
    const g = await M.c.get(`/api/tasks/${T.id}`);
    rec('P1-1', g.status === 200 ? 'FINDING' : 'OK', `removed member GET assigned family task -> ${g.status}; sees other members' comments: ${g.status === 200 && g.data.comments.some((c) => /THREAD/.test(c.body))}`);
    const list = (await M.c.get('/api/tasks')).data.tasks.map((t) => t.title);
    rec('P1-2', list.some((t) => /FAMTASK/.test(t)) ? 'FINDING' : 'OK', `removed member task list shows: ${JSON.stringify(list)}`);
    const dash = JSON.stringify((await M.c.get('/api/dashboard')).data);
    rec('P1-3', /FAMTASK/.test(dash) ? 'FINDING' : 'OK', `removed member dashboard payload mentions the family tasks: ${/FAMTASK/.test(dash)}`);
    const s = (await M.c.get('/api/search?q=FAMTASK')).data.results.map((r) => r.title);
    rec('P1-4', s.length ? 'FINDING' : 'OK', `removed member search "FAMTASK": ${JSON.stringify(s)}`);
    const before = (await notifs(N)).length;
    const cm = await M.c.post(`/api/tasks/${T.id}/comments`, { body: 'COMMENT-FROM-REMOVED-MEMBER' });
    const after = await notifs(N);
    rec('P1-5', cm.status === 201 ? 'FINDING' : 'OK', `removed member can still comment on the assigned family task -> ${cm.status}; family members notified: ${after.some((x) => /REMOVED-MEMBER/.test(x))}; feed shows: ${(await O.c.get(`/api/family/${f.id}/activity`)).data.activity.some((a) => /commented/.test(a.summary) && a.actorName)}`);
    const pt = await M.c.patch(`/api/tasks/${T.id}`, { title: 'RENAMED-BY-REMOVED-MEMBER', status: 'completed' });
    rec('P1-6', pt.status === 200 ? 'FINDING' : 'OK', `removed member can edit/complete the family task -> ${pt.status}; title now "${db.get('SELECT title FROM tasks WHERE id = ?', [T.id]).title}"`);
    const own = await M.c.patch(`/api/tasks/${Tm.id}`, { title: 'M-edits-own-family-task-after-removal' });
    const ownShown = (await N.c.get('/api/tasks')).data.tasks.some((t) => t.id === Tm.id);
    rec('P1-7', 'INFO', `removed member editing a family-visible task THEY OWN -> ${own.status}; the family still sees that task: ${ownShown} (task keeps family_id and visibility=family; its owner is no longer a member)`);
    const nn = await notifs(M);
    rec('P1-8', 'INFO', `removed member's own notification list still contains ${nn.length} row(s): ${JSON.stringify(nn.slice(0, 3))}`);
  }

  // ============ P2: invite-code exposure to plain members ============
  {
    const O = await mk(), M = await mk();
    const f = await fam(O, M);
    const list = (await M.c.get('/api/family')).data.families[0];
    const one = (await M.c.get(`/api/family/${f.id}`)).data.family;
    const exp = await M.c.get('/api/settings/export');
    const expCode = JSON.stringify(exp.data.families).includes(f.inviteCode);
    rec('P2-1', 'INFO', `plain member sees inviteCode in GET /api/family: ${list.inviteCode === f.inviteCode}; GET /api/family/:id: ${one.inviteCode === f.inviteCode}; in /api/settings/export: ${expCode}`);
    rec('P2-2', 'INFO', `add-member-by-phone (owner/admin only) for a plain member: ${(await M.c.post(`/api/family/${f.id}/members`, { phone: '+38344123123' })).status}; regenerate: ${(await M.c.post(`/api/family/${f.id}/invite-code/regenerate`, {})).status}; but the code lets ANY member invite anyone`);
    const N = await mk();
    rec('P2-3', 'INFO', `a plain member handing the code to a stranger works: stranger joins -> ${(await N.c.post('/api/family/join', { code: f.inviteCode })).status}`);
  }

  // ============ P3: F-10 — who can change visibility / assignment ============
  {
    const O = await mk(), M = await mk(), N = await mk();
    const f = await fam(O, M, N);
    const priv = (await O.c.post('/api/tasks', { title: 'PRIVATE-assigned-to-M', familyId: f.id, visibility: 'private', assignedTo: M.id })).data.task;
    const flip = await M.c.patch(`/api/tasks/${priv.id}`, { visibility: 'family' });
    rec('P3-1', flip.status === 200 ? 'FINDING' : 'OK', `assignee flips owner's private task to family -> ${flip.status}; N (unrelated member) can now read it: ${(await N.c.get(`/api/tasks/${priv.id}`)).status === 200}`);
    const fam2 = (await O.c.post('/api/tasks', { title: 'FAMILY-task', familyId: f.id, visibility: 'family' })).data.task;
    const hide = await N.c.patch(`/api/tasks/${fam2.id}`, { visibility: 'private' });
    rec('P3-2', hide.status === 200 ? 'FINDING' : 'OK', `ordinary member N sets the OWNER's family task to private -> ${hide.status}; M (another member) still sees it: ${(await M.c.get(`/api/tasks/${fam2.id}`)).status === 200}; owner still sees it: ${(await O.c.get(`/api/tasks/${fam2.id}`)).status === 200}`);
    const priv2 = (await O.c.post('/api/tasks', { title: 'PRIVATE-2', familyId: f.id, visibility: 'private', assignedTo: M.id })).data.task;
    const re = await M.c.patch(`/api/tasks/${priv2.id}`, { assignedTo: N.id });
    rec('P3-3', re.status === 200 ? 'FINDING' : 'OK', `assignee re-assigns the owner's PRIVATE task to another member -> ${re.status}; N can read it: ${(await N.c.get(`/api/tasks/${priv2.id}`)).status === 200}`);
    const del = await M.c.del(`/api/tasks/${priv.id}`);
    rec('P3-4', 'INFO', `assignee/member delete of someone else's task -> ${del.status} (owner-only already)`);
    // what the UI actually does: PATCH with visibility derived from the family select (existing.familyId preselected)
    const priv3 = (await O.c.post('/api/tasks', { title: 'PRIVATE-3', familyId: f.id, visibility: 'private' })).data.task;
    const uiEdit = await O.c.patch(`/api/tasks/${priv3.id}`, { title: 'PRIVATE-3 edited', priority: 'high', familyId: f.id, visibility: 'family' });
    rec('P3-5', 'INFO', `simulated UI edit payload of a private task that has family_id (form preselects the family, so it sends visibility:"family") -> ${uiEdit.status}; visibility now: ${db.get('SELECT visibility FROM tasks WHERE id = ?', [priv3.id]).visibility}`);
    rec('P3-6', 'INFO', `PATCH accepts any visibility string: ${(await O.c.patch(`/api/tasks/${priv3.id}`, { visibility: 'whatever' })).status} -> stored "${db.get('SELECT visibility FROM tasks WHERE id = ?', [priv3.id]).visibility}"`);
  }

  // ============ P4: historical notifications after a task becomes private / access is lost ============
  {
    const O = await mk(), M = await mk(), N = await mk();
    const f = await fam(O, M, N);
    const t = (await O.c.post('/api/tasks', { title: 'WAS-SHARED-TITLE', familyId: f.id, visibility: 'family' })).data.task;
    await M.c.post(`/api/tasks/${t.id}/comments`, { body: 'SHARED-PHASE-COMMENT' });
    await O.c.patch(`/api/tasks/${t.id}`, { visibility: 'private' });
    const n = await notifs(N);
    const link = (await N.c.get('/api/notifications')).data.notifications.find((x) => /WAS-SHARED/.test(x.title + x.body));
    rec('P4-1', n.some((x) => /WAS-SHARED-TITLE|SHARED-PHASE-COMMENT/.test(x)) ? 'FINDING' : 'OK', `N still receives snapshot text of a task N can no longer open (GET task -> ${(await N.c.get(`/api/tasks/${t.id}`)).status}): ${JSON.stringify(n.filter((x) => /SHARED/.test(x)))}; link=${link && link.link}`);
    const cols = db.all('PRAGMA table_info(notifications)').map((c) => c.name);
    rec('P4-2', 'INFO', `notifications columns: ${cols.join(', ')} (no task_id / family_id reference; the task id lives only inside the link string)`);
    const types = db.all("SELECT type, COUNT(*) c FROM notifications GROUP BY type").map((r) => `${r.type}:${r.c}`).join(', ');
    rec('P4-3', 'INFO', `notification types in this run: ${types}`);
    // other family-snapshot notification types a removed member keeps
    await N.c.post(`/api/chat/${f.id}/messages`, { body: 'CHAT-PREVIEW-TEXT' });
    const ms = await notifs(M);
    await O.c.del(`/api/family/${f.id}/members/${(await O.c.get(`/api/family/${f.id}`)).data.family.members.find((x) => x.userId === M.id).id}`);
    rec('P4-4', (await notifs(M)).some((x) => /CHAT-PREVIEW-TEXT/.test(x)) ? 'FINDING' : 'OK', `after removal M still sees family CHAT preview text in own notifications: ${(await notifs(M)).some((x) => /CHAT-PREVIEW-TEXT/.test(x))} (received while a member: ${ms.some((x) => /CHAT-PREVIEW-TEXT/.test(x))})`);
  }

  // ============ P5: throttle trust (X-Forwarded-For) ============
  {
    resetAllLimits();
    const O = await mk();
    const f = await fam(O);
    const users = [await mk(), await mk(), await mk(), await mk()];
    const statuses = [];
    for (let u = 0; u < users.length; u++) {
      let last = null;
      for (let i = 0; i < 10; i++) {
        const r = await fetch(app.base + '/api/family/join', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `203.0.113.${u * 10 + i + 1}`, Cookie: `la_session=${(await sessionOf(users[u]))}` }, body: JSON.stringify({ code: `SPOOF${u}${i}ABCDE` }) });
        last = r.status;
      }
      statuses.push(last);
    }
    rec('P5-1', statuses[3] === 429 ? 'OK' : 'FINDING', `4 accounts x 10 failures, every request carrying a different X-Forwarded-For: last status per account ${JSON.stringify(statuses)} (429 on the 4th means the header is ignored and the per-IP budget still applied)`);
    void f;
    resetAllLimits();
  }
  function sessionOf(u) { return db.get('SELECT id FROM sessions WHERE user_id = ?', [u.id]).id; }

  // ============ P6: brute-force arithmetic ============
  {
    const legacy = 16 ** 8, strong = 32 ** 12;
    const perIpPerDay = 30 * 4 * 24; // 30 failures / 15 min
    rec('P6-1', 'INFO', `legacy code space 2^32 = ${legacy.toExponential(2)}; strong 2^60 = ${strong.toExponential(2)}; one IP is limited to ${perIpPerDay} guesses/day (per-IP budget); with F live legacy families the chance a single guess hits any = F/2^32`);
    for (const F of [100, 10000]) {
      const pDay = 1 - Math.pow(1 - F / legacy, perIpPerDay);
      rec('P6-2', 'INFO', `F=${F} families with legacy codes: P(one IP finds >=1 code in a day) = ${(pDay * 100).toFixed(4)}%; IPs needed for ~50%/day = ${Math.ceil(Math.log(0.5) / Math.log(1 - F / legacy) / perIpPerDay).toLocaleString()}`);
    }
    rec('P6-3', 'INFO', 'strong codes: at 2880 guesses/day/IP even 1e6 IPs need ~1e3 years per 1e0 family -> not attackable by guessing');
  }

  // ============ P7: Assistant context privacy through a local mock of the provider ============
  {
    const O = await mk(), M = await mk(), N = await mk();
    const f = await fam(O, M, N);
    await O.c.post('/api/tasks', { title: 'CTX-OWNER-PRIVATE-in-family', familyId: f.id, visibility: 'private' });
    await O.c.post('/api/tasks', { title: 'CTX-OWNER-FAMILY-visible', familyId: f.id, visibility: 'family', dueDate: '2030-01-01' });
    await M.c.post('/api/tasks', { title: 'CTX-M-OWN-PRIVATE' });
    await N.c.post('/api/tasks', { title: 'CTX-N-OWN-PRIVATE' });
    await N.c.post('/api/bills', { name: 'CTX-N-BILL', amount: 9, dueDate: '2030-01-01' });
    const ask = async (u, msg) => {
      captured.length = 0;
      const r = await u.c.post('/api/ai/chat', { message: msg });
      const sys = captured.length ? JSON.stringify(captured[0].context) : '';
      return { status: r.status, ok: r.data && r.data.ok, sys };
    };
    const a = await ask(M, 'what are my family tasks and schedule today and bills?');
    rec('P7-0', a.sys ? 'OK' : 'FINDING', `assistant route built a context and handed it to the (stubbed) provider call: ${a.sys.slice(0, 200)}`);
    rec('P7-1', /CTX-OWNER-PRIVATE/.test(a.sys) ? 'FINDING' : 'OK', `M's assistant context contains the owner's PRIVATE family-scoped task: ${/CTX-OWNER-PRIVATE/.test(a.sys)}`);
    rec('P7-2', /CTX-OWNER-FAMILY/.test(a.sys) ? 'OK' : 'INFO', `M's context contains the family-visible task (expected): ${/CTX-OWNER-FAMILY/.test(a.sys)}`);
    rec('P7-3', /CTX-N-/.test(a.sys) ? 'FINDING' : 'OK', `M's context contains N's private task/bill: ${/CTX-N-/.test(a.sys)}`);
    await O.c.del(`/api/family/${f.id}/members/${(await O.c.get(`/api/family/${f.id}`)).data.family.members.find((x) => x.userId === M.id).id}`);
    const b = await ask(M, 'what are my family tasks and schedule today?');
    rec('P7-4', /CTX-OWNER-FAMILY/.test(b.sys) ? 'FINDING' : 'OK', `after removal M's assistant context still contains the family's tasks: ${/CTX-OWNER-FAMILY/.test(b.sys)}`);
    captured.length = 0;
    await N.c.post('/api/ai/weekly-review', {});
    rec('P7-5', /CTX-/.test(JSON.stringify(captured)) ? 'FINDING' : 'OK', `weekly-review request contains task titles: ${/CTX-/.test(JSON.stringify(captured))} (counts and goal titles only)`);
  }

  // ============ P8: invite join edge behaviours relevant to the rules ============
  {
    resetAllLimits();
    const O = await mk(), L = await mk();
    const f = await fam(O, L);
    await L.c.post(`/api/family/${f.id}/leave`, {});
    const back = await L.c.post('/api/family/join', { code: f.inviteCode });
    rec('P8-1', 'INFO', `voluntary leaver rejoins with the unchanged code -> ${back.status}; owner sees in activity: ${JSON.stringify((await O.c.get(`/api/family/${f.id}/activity`)).data.activity.slice(0, 3).map((a) => a.summary))}`);
    const T = (await O.c.post('/api/tasks', { title: 'ASSIGNED-TO-L', familyId: f.id, visibility: 'family', assignedTo: L.id })).data.task;
    await L.c.post(`/api/family/${f.id}/leave`, {});
    rec('P8-2', (await L.c.get(`/api/tasks/${T.id}`)).status === 200 ? 'FINDING' : 'OK', `leaver still opens the task assigned to them: ${(await L.c.get(`/api/tasks/${T.id}`)).status}`);
  }

  require('fs').writeFileSync(process.argv[2] || 'h15-probes.out.txt', out.join('\n') + '\n');
  await app.close();
  mock.close();
  process.exit(0);
})().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
