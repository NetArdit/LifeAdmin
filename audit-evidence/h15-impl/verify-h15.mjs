// Hardening 1.5 real-browser verification: owner / member / former member / other-family user.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const SHOT = './screenshots-h15';
fs.mkdirSync(SHOT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, LIFEADMIN_DB_PATH: process.env.H15_DB, NODE_ENV: 'development', PORT: '3001' }, stdio: 'ignore' });
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [], pageErrors = [];
async function newUser(name, w = 1280, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', (e) => pageErrors.push(`${name}: ${e.message}`));
  const u = { name, page, password: 'h15pass123456' };
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  await page.fill('#f-firstName', name); await page.fill('#f-lastName', 'Tester'); await page.fill('#f-email', `h15.${name}.${Date.now()}@test.local`);
  await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
  await page.fill('#f-password', u.password); await page.fill('#f-confirmPassword', u.password);
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });
  return u;
}
const api = (page, path, method = 'GET', body) => page.evaluate(async ([p, m, b]) => {
  const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [path, method, body]);
const goto = async (u, hash) => { await u.page.evaluate((h) => { location.hash = h; }, hash); await u.page.reload({ waitUntil: 'networkidle' }); await u.page.waitForTimeout(500); };
const text = (u) => u.page.evaluate(() => document.body.innerText);
async function openTask(u, title) {
  await goto(u, '#/tasks');
  await u.page.click(`text=${title}`);
  await u.page.waitForSelector('.section-title');
}
async function openEdit(u) { await u.page.click('button:has-text("Edit")'); await u.page.waitForSelector('#task-form'); }
const famSelectValue = (u) => u.page.$eval('#task-form [name=familyId]', (e) => e.value);
const notifPanelText = async (u) => { await u.page.click('#open-notifications'); await u.page.waitForTimeout(500); const t = await u.page.locator('#notif-list').innerText(); await u.page.keyboard.press('Escape'); await u.page.click('body', { position: { x: 5, y: 500 } }).catch(() => {}); return t; };

try {
  const O = await newUser('Olga'), M = await newUser('Mark'), L = await newUser('Lena'), D = await newUser('Dana');
  // family X (owner Olga) and family Y (Dana) through the UI
  for (const [u, name] of [[O, 'Family X'], [D, 'Family Y']]) {
    await goto(u, '#/family');
    await u.page.click('button:has-text("Create a family"), button:has-text("New family")');
    await u.page.fill('#family-form [name=name]', name); await u.page.click('#create-family-save');
    await u.page.waitForSelector('.family-tabs-wrap');
  }
  const famX = (await api(O.page, '/api/family')).data.families[0];
  const famY = (await api(D.page, '/api/family')).data.families[0];
  log('setup: owner Olga created Family X and sees the invite code; Dana created Family Y', !!famX.inviteCode && /^[2-9A-HJ-NP-Z]{12}$/.test(famX.inviteCode));
  // Mark and Lena join through the UI
  for (const u of [M, L]) {
    await goto(u, '#/family');
    await u.page.click('button:has-text("Join with a code")');
    await u.page.fill('#join-family-form [name=code]', famX.inviteCode);
    await u.page.click('#join-family-save');
    await u.page.waitForTimeout(700);
  }
  const lenaId = (await api(L.page, '/api/auth/me')).data.user.id;
  log('setup: Mark and Lena joined Family X with the code', (await api(M.page, '/api/family')).data.families.length === 1 && (await api(L.page, '/api/family')).data.families.length === 1);

  // 1. owner creates a family-visible task through the UI
  await goto(O, '#/tasks');
  await O.page.click('button:has-text("New task")');
  await O.page.fill('#task-form [name=title]', 'Plan the SURPRISE trip');
  await O.page.selectOption('#task-form [name=familyId]', String(famX.id));
  await O.page.click('#save-task-btn');
  await O.page.waitForSelector('.row-item');
  const task = (await api(O.page, '/api/tasks')).data.tasks.find((t) => /SURPRISE/.test(t.title));
  log('1. owner created a family-visible task through the UI', task && task.visibility === 'family' && task.familyId === famX.id);
  // 2. member accesses it
  await goto(M, '#/tasks');
  log('2. member sees the task in their Tasks list', /SURPRISE/.test(await text(M)));
  // comment by member so notifications/threads exist
  await api(M.page, `/api/tasks/${task.id}/comments`, 'POST', { body: 'COMMENT-from-Mark about the trip' });
  // 3. owner makes it private through the edit form (intentional change)
  await openTask(O, 'Plan the SURPRISE trip'); await openEdit(O);
  log('3a. the owner\'s edit form opens on "Family X" while the task is family-visible', (await famSelectValue(O)) === String(famX.id));
  await O.page.selectOption('#task-form [name=familyId]', '');
  await O.page.click('#save-task-btn'); await O.page.waitForTimeout(900);
  const afterPrivate = (await api(O.page, `/api/tasks/${task.id}`)).data.task;
  log('3b. the owner made it private through the UI (server state)', afterPrivate.visibility === 'private' && afterPrivate.familyId === famX.id, JSON.stringify({ v: afterPrivate.visibility, f: afterPrivate.familyId }));
  // 4. member loses access
  await goto(M, '#/tasks');
  const mt = await text(M);
  const direct = await api(M.page, `/api/tasks/${task.id}`);
  log('4. member no longer sees the task in the list; direct access answers 404 with no data', !/SURPRISE/.test(mt) && direct.status === 404 && !JSON.stringify(direct.data).includes('SURPRISE'));
  await goto(M, `#/tasks/${task.id}`);
  log('4b. opening the remembered task link as the member shows no task content', !/SURPRISE|COMMENT-from-Mark/.test(await text(M)));
  await M.page.keyboard.press('Escape');
  await goto(M, '#/dashboard');
  log('4c. member\'s Dashboard shows nothing about it', !/SURPRISE/.test(await text(M)));
  await goto(M, '#/timeline');
  log('4d. member\'s Timeline shows nothing about it', !/SURPRISE/.test(await text(M)));
  await M.page.keyboard.press('/'); await M.page.waitForSelector('#cmd-input');
  await M.page.fill('#cmd-input', 'SURPRISE'); await M.page.waitForTimeout(700);
  const s1 = await M.page.locator('#cmd-results').innerText();
  await M.page.fill('#cmd-input', 'COMMENT-from-Mark'); await M.page.waitForTimeout(700);
  const s2 = await M.page.locator('#cmd-results').innerText();
  log('4e. member\'s search finds neither the task nor its comments', /No results/.test(s1) && /No results/.test(s2));
  await M.page.keyboard.press('Escape');
  const mn = await notifPanelText(M);
  log('4f. member\'s notification panel no longer shows the old task notifications', !/SURPRISE|COMMENT-from-Mark/.test(mn), mn.replace(/\s+/g, ' ').slice(0, 100));
  await O.page.screenshot({ path: `${SHOT}/04-owner-after-private.png` });
  // 5-6. owner edits description: stays private
  await openTask(O, 'Plan the SURPRISE trip'); await openEdit(O);
  const preselect = await famSelectValue(O);
  log('5a. the edit form of a PRIVATE task that still carries a family opens on "Private (only me)"', preselect === '', `select value = "${preselect}"`);
  await O.page.fill('#task-form [name=description]', 'Only the description changed');
  await O.page.fill('#task-form [name=title]', 'Plan the SURPRISE trip (edited)');
  await O.page.click('#save-task-btn'); await O.page.waitForTimeout(900);
  const afterEdit = (await api(O.page, `/api/tasks/${task.id}`)).data.task;
  log('5b-6. after editing title and description the task is STILL private and still hidden from Mark', afterEdit.visibility === 'private' && afterEdit.description === 'Only the description changed' && (await api(M.page, `/api/tasks/${task.id}`)).status === 404);
  // 7. owner intentionally shares again
  await openTask(O, 'Plan the SURPRISE trip (edited)'); await openEdit(O);
  await O.page.selectOption('#task-form [name=familyId]', String(famX.id));
  await O.page.click('#save-task-btn'); await O.page.waitForTimeout(900);
  log('7. the owner intentionally shares it again; Mark can read it and the old notifications reappear', (await api(M.page, `/api/tasks/${task.id}`)).status === 200 && (await goto(M, '#/dashboard'), /SURPRISE/.test(await notifPanelText(M))));
  // member edits content through the UI: no family select, visibility unchanged
  await openTask(M, 'Plan the SURPRISE trip (edited)'); await openEdit(M);
  const hasSelect = await M.page.locator('#task-form [name=familyId]').count();
  await M.page.fill('#task-form [name=notes]', 'Notes added by a member');
  await M.page.click('#save-task-btn'); await M.page.waitForTimeout(900);
  const afterMember = (await api(O.page, `/api/tasks/${task.id}`)).data.task;
  log('7b. an ordinary member edits the family task through the UI: no Family select is offered, the edit saves, visibility unchanged', hasSelect === 0 && afterMember.notes === 'Notes added by a member' && afterMember.visibility === 'family');
  // assign to Lena (API-only feature) and let Lena see it
  await api(O.page, `/api/tasks/${task.id}`, 'PATCH', { assignedTo: lenaId });
  await api(L.page, `/api/tasks/${task.id}/comments`, 'POST', { body: 'COMMENT-from-Lena' });
  await goto(L, '#/tasks');
  log('8a. Lena (assigned member) sees the task', /SURPRISE/.test(await text(L)));
  // 8. Lena leaves through the UI
  await goto(L, '#/family'); await L.page.click('.tab:has-text("Members")');
  await L.page.click('button:has-text("Leave family")'); await L.page.click('.modal-footer button:has-text("Leave family")');
  await L.page.waitForSelector('button:has-text("Create a family")', { timeout: 8000 });
  log('8b. Lena left the family through the UI', (await api(L.page, '/api/family')).data.families.length === 0);
  // 9-10. former member tries everything
  const dl = await api(L.page, `/api/tasks/${task.id}`);
  const pl = await api(L.page, `/api/tasks/${task.id}`, 'PATCH', { title: 'HACKED-BY-LENA', status: 'completed' });
  const cl = await api(L.page, `/api/tasks/${task.id}/comments`, 'POST', { body: 'LENA-AFTER-LEAVING' });
  const al = await api(L.page, `/api/tasks/${task.id}`, 'PATCH', { assignedTo: lenaId });
  const vl = await api(L.page, `/api/tasks/${task.id}`, 'PATCH', { visibility: 'private' });
  const dd = await api(L.page, `/api/tasks/${task.id}`, 'DELETE');
  log('9. former member Lena: direct read/update/complete/comment/assign/visibility/delete on the known task id are all refused (404)', [dl, pl, cl, al, vl, dd].every((r) => r.status === 404), [dl, pl, cl, al, vl, dd].map((r) => r.status).join('/'));
  const still = (await api(O.page, `/api/tasks/${task.id}`)).data;
  log('9b. nothing changed: title, status, comments, owner activity unaffected', !/HACKED/.test(still.task.title) && still.task.status !== 'completed' && !still.comments.some((c) => /LENA-AFTER/.test(c.body)));
  await goto(L, '#/tasks'); const lt = await text(L);
  await goto(L, '#/dashboard'); const ld = await text(L);
  await goto(L, '#/timeline'); const ltl = await text(L);
  await L.page.keyboard.press('/'); await L.page.waitForSelector('#cmd-input'); await L.page.fill('#cmd-input', 'SURPRISE'); await L.page.waitForTimeout(700);
  const ls = await L.page.locator('#cmd-results').innerText(); await L.page.keyboard.press('Escape');
  const ln = await notifPanelText(L);
  const leak = Object.entries({ tasks: lt, dashboard: ld, timeline: ltl, notifications: ln }).filter(([, x]) => /SURPRISE|COMMENT-from/.test(x)).map(([k, x]) => `${k}: ${x.replace(/\s+/g, ' ').match(/.{0,40}(SURPRISE|COMMENT-from).{0,40}/)?.[0]}`);
  log('10. Lena\'s Tasks, Dashboard, Timeline, Search and notification panel show nothing about the family task or its comments', leak.length === 0 && /No results/.test(ls), leak.join(' ; '));
  await L.page.screenshot({ path: `${SHOT}/10-former-member-tasks.png` });
  // 11-12. owner and member keep working access
  log('11. the owner still reads and edits the task', (await api(O.page, `/api/tasks/${task.id}`)).status === 200 && (await api(O.page, `/api/tasks/${task.id}`, 'PATCH', { priority: 'low' })).status === 200);
  log('12. member Mark still reads it, and the other-family user Dana cannot', (await api(M.page, `/api/tasks/${task.id}`)).status === 200 && (await api(D.page, `/api/tasks/${task.id}`)).status === 404);
  // 13. invite code visible only to owner
  await goto(O, '#/family'); const ownerHasCode = await O.page.locator('.card:has(.card-title:has-text("Invite code")) code').count();
  await goto(M, '#/family'); const memberHasCode = await M.page.locator('.card:has(.card-title:has-text("Invite code")) code').count();
  const memberNote = await M.page.locator('.card:has(.card-title:has-text("Invite code"))').innerText();
  const apiLeak = JSON.stringify((await api(M.page, '/api/family')).data).includes(famX.inviteCode) || JSON.stringify((await api(M.page, `/api/family/${famX.id}`)).data).includes(famX.inviteCode);
  log('13. the invite code is shown only to the owner: the member sees an explanation and the API never returns it to them', ownerHasCode === 1 && memberHasCode === 0 && /Only the family owner/.test(memberNote) && !apiLeak, memberNote.replace(/\s+/g, ' ').slice(0, 90));
  await M.page.screenshot({ path: `${SHOT}/13-member-overview-no-code.png` });
  // 14. rotation
  const oldCode = famX.inviteCode;
  await goto(O, '#/family');
  await O.page.click('button:has-text("New invite code")'); await O.page.click('.modal-footer button:has-text("Create new code")');
  await O.page.waitForSelector('.toast:has-text("New invite code created")'); await O.page.waitForTimeout(600);
  const newCode = await O.page.locator('.card:has(.card-title:has-text("Invite code")) code').textContent();
  const Z = await newUser('Zed');
  await goto(Z, '#/family'); await Z.page.click('button:has-text("Join with a code")'); await Z.page.fill('#join-family-form [name=code]', oldCode); await Z.page.click('#join-family-save'); await Z.page.waitForTimeout(700);
  const oldToast = (await Z.page.locator('.toast').allTextContents()).join(' | ');
  log('14. after rotation the old code is refused in the Join dialog', /Invalid invite code/.test(oldToast) && newCode !== oldCode && (await api(Z.page, '/api/family')).data.families.length === 0, oldToast);
  // removal by owner: Mark removed, code rotates, Mark loses task access, cannot rejoin with old code
  await goto(O, '#/family'); await O.page.click('.tab:has-text("Members")');
  await O.page.locator('.member-card:has-text("Mark") [aria-label^="Remove"]').click(); await O.page.click('.modal-footer button:has-text("Remove")');
  await O.page.waitForSelector('.toast:has-text("Member removed")');
  log('15. owner removes Mark: toast says the code changed, Mark loses the task at once, and the code he used is dead',
    /invite code was changed/.test((await O.page.locator('.toast').allTextContents()).join(' ')) && (await api(M.page, `/api/tasks/${task.id}`)).status === 404 &&
    (await api(M.page, '/api/family/join', 'POST', { code: newCode })).status === 400);

  // ---- responsive: changed UI (task edit form for owner and member, Overview code card for member) ----
  await api(O.page, '/api/tasks', 'POST', { title: 'R'.repeat(90), familyId: famX.id, visibility: 'family' });
  const rMember = await newUser('Rita');
  const curCode = (await api(O.page, '/api/family')).data.families[0].inviteCode;
  await api(rMember.page, '/api/family/join', 'POST', { code: curCode });
  const rows = [];
  for (const w of [320, 375, 414, 1280]) {
    const h = w >= 768 ? 900 : 740;
    for (const u of [O, rMember]) await u.page.setViewportSize({ width: w, height: h });
    const ov = (u) => u.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await goto(O, '#/tasks'); await O.page.click('.row-item >> nth=0'); await O.page.waitForSelector('.section-title'); await openEdit(O);
    const ob = await O.page.locator('.modal-panel').boundingBox(); const ofit = ob.x >= 0 && ob.x + ob.width <= w + 0.5;
    const oSel = await O.page.locator('#task-form [name=familyId]').count();
    rows.push(`${w}px owner form fits=${ofit} select=${oSel} overflow=${await ov(O)}`);
    const okO = ofit && oSel === 1 && (await ov(O)) <= 1;
    await O.page.keyboard.press('Escape'); await O.page.keyboard.press('Escape');
    await goto(rMember, '#/tasks'); await rMember.page.click('.row-item >> nth=0'); await rMember.page.waitForSelector('.section-title'); await openEdit(rMember);
    const mb = await rMember.page.locator('.modal-panel').boundingBox(); const mfit = mb.x >= 0 && mb.x + mb.width <= w + 0.5;
    const mSel = await rMember.page.locator('#task-form [name=familyId]').count();
    const okM = mfit && mSel === 0 && (await ov(rMember)) <= 1;
    await rMember.page.keyboard.press('Escape'); await rMember.page.keyboard.press('Escape');
    await goto(rMember, '#/family');
    const card = await rMember.page.locator('.card:has(.card-title:has-text("Invite code"))').boundingBox();
    const okC = card.x >= 0 && card.x + card.width <= w + 0.5 && (await ov(rMember)) <= 1;
    log(`${w}px: owner edit form (with Family select), member edit form (no select) and the member's invite-code card fit without horizontal overflow`, okO && okM && okC, `${rows[rows.length - 1]}; member select=${mSel}`);
    if (w === 320) { await goto(rMember, '#/family'); await rMember.page.screenshot({ path: `${SHOT}/resp-320-member-overview.png` }); }
  }
} catch (e) {
  log('script error', false, e.stack.split('\n').slice(0, 4).join(' | '));
}
console.log('console errors (deduped):', [...new Set(consoleErrors)].slice(0, 8));
console.log('page errors:', pageErrors.length, pageErrors.slice(0, 3));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill(); await browser.close(); process.exit(0);
