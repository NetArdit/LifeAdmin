// Hardening 1 real-browser verification: two/three real users, two families.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const SHOT = './screenshots-h1';
fs.mkdirSync(SHOT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, LIFEADMIN_DB_PATH: process.env.H1_DB, NODE_ENV: 'development', PORT: '3001' }, stdio: 'ignore' });
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [];
const pageErrors = [];
async function newUser(name, w = 1280, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', (e) => pageErrors.push(`${name}: ${e.message}`));
  const u = { name, password: 'h1pass123456', page, email: `h1.${name}.${Date.now()}@test.local` };
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  await page.fill('#f-firstName', name); await page.fill('#f-lastName', 'Tester'); await page.fill('#f-email', u.email);
  await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
  await page.fill('#f-password', u.password); await page.fill('#f-confirmPassword', u.password);
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });
  return u;
}
const api = (page, path, method = 'GET', body) => page.evaluate(async ([p, m, b]) => {
  const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [path, method, body]);
async function createFamilyUI(u, name) {
  await u.page.evaluate(() => { location.hash = '#/family'; });
  await u.page.waitForSelector('button:has-text("Create a family"), button:has-text("New family")');
  await u.page.click('button:has-text("Create a family"), button:has-text("New family")');
  await u.page.fill('#family-form [name=name]', name);
  await u.page.click('#create-family-save');
  await u.page.waitForSelector('.family-tabs-wrap');
  await u.page.waitForTimeout(400);
}
async function joinUI(u, code) {
  await u.page.evaluate(() => { location.hash = '#/family'; });
  await u.page.waitForSelector('button:has-text("Join with a code")');
  await u.page.click('button:has-text("Join with a code")');
  await u.page.fill('#join-family-form [name=code]', code);
  await u.page.click('#join-family-save');
  await u.page.waitForTimeout(700);
  return (await u.page.locator('.toast').allTextContents()).join(' | ');
}
const openTab = async (u, tab) => { await u.page.evaluate(() => { location.hash = '#/family'; }); await u.page.reload({ waitUntil: 'networkidle' }); await u.page.waitForSelector(`.tab:has-text("${tab}")`); await u.page.click(`.tab:has-text("${tab}")`); await u.page.waitForTimeout(500); };
const bodyText = (u) => u.page.evaluate(() => document.body.innerText);

try {
  // 1-2. two users, two families (through the UI)
  const A = await newUser('Alice');
  const B = await newUser('Bob');
  await createFamilyUI(A, 'Family Alpha');
  await createFamilyUI(B, 'Family Beta');
  const famA = (await api(A.page, '/api/family')).data.families[0];
  const famB = (await api(B.page, '/api/family')).data.families[0];
  log('1-2. Alice created Family Alpha and Bob created Family Beta through the UI; codes are 12-char strong codes', /^[2-9A-HJ-NP-Z]{12}$/.test(famA.inviteCode) && /^[2-9A-HJ-NP-Z]{12}$/.test(famB.inviteCode), famA.inviteCode.slice(0, 3) + '…');

  // 3. cross-family bill operations from the real sessions
  const billBody = (extra) => ({ name: 'Cross bill', amount: 5, dueDate: '2030-01-01', recurrence: 'none', ...extra });
  const r1 = await api(B.page, '/api/bills', 'POST', billBody({ familyId: famA.id }));
  const r2 = await api(A.page, '/api/bills', 'POST', billBody({ familyId: famB.id }));
  const r3 = await api(A.page, '/api/bills', 'POST', billBody({ familyId: famA.id }));
  const r4 = await api(A.page, `/api/bills/${r3.data.bill.id}`, 'PATCH', { familyId: famB.id });
  log('3. cross-family bill: B -> Family Alpha 403, A -> Family Beta 403, A -> own family 201, moving own bill to Beta 400', r1.status === 403 && r2.status === 403 && r3.status === 201 && r4.status === 400, `${r1.status}/${r2.status}/${r3.status}/${r4.status}`);
  await api(A.page, `/api/bills/${r3.data.bill.id}/pay`, 'POST', {});
  await openTab(B, 'Activity');
  log('3b. Family Beta\'s Activity tab shows nothing injected by Alice or Bob\'s attempt', !/Cross bill/.test(await bodyText(B)));

  // 4. cross-family reaction (message posted through the chat UI)
  await openTab(A, 'Chat');
  await A.page.fill('input[placeholder="Message the family…"]', 'Hello Alpha family');
  await A.page.click('button[aria-label="Send"]');
  await A.page.waitForTimeout(700);
  const msgId = (await api(A.page, `/api/chat/${famA.id}/messages`)).data.messages[0].id;
  const reactB1 = await api(B.page, `/api/chat/${famB.id}/messages/${msgId}/react`, 'POST', { emoji: '👍' });
  const reactB2 = await api(B.page, `/api/chat/${famA.id}/messages/${msgId}/react`, 'POST', { emoji: '👍' });
  const reactA = await api(A.page, `/api/chat/${famA.id}/messages/${msgId}/react`, 'POST', { emoji: '👍' });
  const reactMissing = await api(A.page, `/api/chat/${famA.id}/messages/99999/react`, 'POST', { emoji: '👍' });
  log('4. cross-family reaction: B via Beta URL 404, B via Alpha URL 403, same-family 201, nonexistent 404', reactB1.status === 404 && reactB2.status === 403 && reactA.status === 201 && reactMissing.status === 404, `${reactB1.status}/${reactB2.status}/${reactA.status}/${reactMissing.status}`);

  // 5. invite guessing / repeated invalid joins (X is a fresh user; first attempts through the UI)
  const X = await newUser('Xavier');
  const t1 = await joinUI(X, 'WRONGCODE1');
  log('5a. one wrong code through the Join dialog shows the generic message', /Invalid invite code/.test(t1), t1);
  const statuses = [];
  for (let i = 0; i < 9; i++) statuses.push((await api(X.page, '/api/family/join', 'POST', { code: `GUESS${i}ZZZZ` })).status);
  const afterTen = await api(X.page, '/api/family/join', 'POST', { code: famA.inviteCode });
  log('5b. after 10 wrong guesses even the CORRECT code is refused with 429 and no membership is created', statuses.every((s) => s === 400) && afterTen.status === 429, `${statuses.join(',')} then ${afterTen.status}`);
  await X.page.keyboard.press('Escape');
  const t2 = await joinUI(X, famA.inviteCode);
  log('5c. the throttle message is shown in the UI and reveals nothing about the family', /Too many attempts/.test(t2) && !/Alpha/.test(t2), t2);
  log('5d. Xavier is still in no family', (await api(X.page, '/api/family')).data.families.length === 0);
  await X.page.screenshot({ path: `${SHOT}/05-throttled-join.png` });

  // 6. rotate through the UI
  await openTab(A, 'Overview');
  const oldCode = await A.page.locator('.card:has(.card-title:has-text("Invite code")) code').textContent();
  await A.page.click('button:has-text("New invite code")');
  await A.page.waitForSelector('.modal-panel');
  const dlgText = await A.page.locator('.modal-panel').innerText();
  log('6a. rotation asks for confirmation and states the consequence', /current code will stop working/.test(dlgText), dlgText.replace(/\n+/g, ' | ').slice(0, 130));
  await A.page.click('.modal-footer button:has-text("Cancel")');
  await A.page.waitForTimeout(300);
  log('6b. Cancel keeps the code', (await A.page.locator('.card:has(.card-title:has-text("Invite code")) code').textContent()) === oldCode);
  await A.page.click('button:has-text("New invite code")');
  await A.page.click('.modal-footer button:has-text("Create new code")');
  await A.page.waitForSelector('.toast:has-text("New invite code created")');
  await A.page.waitForTimeout(600);
  const newCode = await A.page.locator('.card:has(.card-title:has-text("Invite code")) code').textContent();
  log('6c. a new code is shown and differs from the old one', /^[2-9A-HJ-NP-Z]{12}$/.test(newCode) && newCode !== oldCode, `${oldCode.slice(0, 3)}… -> ${newCode.slice(0, 3)}…`);

  // 7. old code refused (fresh user Y so the throttle is not the reason)
  const Y = await newUser('Yara');
  const t3 = await joinUI(Y, oldCode);
  log('7. Yara using the OLD code is refused with the same generic message', /Invalid invite code/.test(t3) && (await api(Y.page, '/api/family')).data.families.length === 0, t3);

  // 8. member joins with the new code, is removed by the owner
  await Y.page.keyboard.press('Escape');
  const t4 = await joinUI(Y, newCode);
  log('8a. Yara joins with the NEW code', /Joined Family Alpha/.test(t4), t4);
  await openTab(A, 'Members');
  await A.page.waitForSelector('.member-card:has-text("Yara")');
  await A.page.locator('.member-card:has-text("Yara") [aria-label^="Remove"]').click();
  await A.page.waitForSelector('.modal-panel');
  await A.page.click('.modal-footer button:has-text("Remove")');
  await A.page.waitForSelector('.toast:has-text("Member removed")');
  const removeToast = (await A.page.locator('.toast').allTextContents()).join(' | ');
  log('8b. owner removes Yara; the toast says the invite code was changed', /invite code was changed/.test(removeToast), removeToast);
  // 9. stale code cannot be reused
  await Y.page.keyboard.press('Escape');
  await Y.page.reload({ waitUntil: 'networkidle' });
  const t5 = await joinUI(Y, newCode);
  log('9. removed Yara cannot come back with the code she used (revoked)', /Invalid invite code/.test(t5) && (await api(Y.page, '/api/family')).data.families.length === 0, t5);
  await openTab(A, 'Overview');
  const codeAfterRemoval = await A.page.locator('.card:has(.card-title:has-text("Invite code")) code').textContent();
  log('9b. the family now shows a third, different code', codeAfterRemoval !== newCode && codeAfterRemoval !== oldCode);

  // 10-14. private task: created shared via the UI, then made private through the edit form (the UI path)
  const M = await newUser('Mila');
  await joinUI(M, codeAfterRemoval);
  await A.page.evaluate(() => { location.hash = '#/tasks'; });
  await A.page.waitForSelector('button:has-text("New task")');
  await A.page.click('button:has-text("New task")');
  await A.page.fill('#task-form [name=title]', 'Surprise party PRIVATEPLAN');
  await A.page.selectOption('#task-form [name=familyId]', String(famA.id));
  await A.page.click('#save-task-btn');
  await A.page.waitForSelector('.row-item');
  await openTab(M, 'Activity');
  log('10a. while the task is family-visible Mila sees it in the family feed', /PRIVATEPLAN/.test(await bodyText(M)));
  // make it private via the edit form (clear the family)
  await A.page.evaluate(() => { location.hash = '#/tasks'; });
  await A.page.waitForSelector('.row-item');
  await A.page.click('text=Surprise party PRIVATEPLAN');
  await A.page.waitForSelector('.section-title');
  await A.page.click('button:has-text("Edit")');
  await A.page.waitForSelector('#task-form');
  await A.page.selectOption('#task-form [name=familyId]', '');
  await A.page.click('#save-task-btn');
  await A.page.waitForTimeout(800);
  const taskRow = (await api(A.page, '/api/tasks')).data.tasks.find((t) => /PRIVATEPLAN/.test(t.title));
  log('10b. the edit made the task private (server state)', taskRow && taskRow.visibility === 'private', JSON.stringify({ visibility: taskRow && taskRow.visibility, familyId: taskRow && taskRow.familyId }));
  // Alice comments and completes it
  await api(A.page, `/api/tasks/${taskRow.id}/comments`, 'POST', { body: 'PRIVATECOMMENT hide the cake' });
  await api(A.page, `/api/tasks/${taskRow.id}`, 'PATCH', { status: 'completed' });
  // 11. family feed
  await openTab(M, 'Activity');
  log('11. Mila\'s family Activity tab no longer shows the task or its comment', !/PRIVATEPLAN|PRIVATECOMMENT/.test(await bodyText(M)));
  // 12. Timeline
  await M.page.evaluate(() => { location.hash = '#/timeline'; }); await M.page.waitForTimeout(900);
  log('12. Mila\'s Timeline page shows nothing about it', !/PRIVATEPLAN|PRIVATECOMMENT/.test(await bodyText(M)));
  await M.page.evaluate(() => { location.hash = '#/dashboard'; }); await M.page.waitForTimeout(900);
  log('12b. Mila\'s Dashboard family feed shows nothing about it', !/PRIVATEPLAN|PRIVATECOMMENT/.test(await bodyText(M)));
  // 13. search palette
  await M.page.keyboard.press('/');
  await M.page.waitForSelector('#cmd-input');
  for (const q of ['PRIVATEPLAN', 'PRIVATECOMMENT']) {
    await M.page.fill('#cmd-input', q); await M.page.waitForTimeout(700);
    log(`13. search "${q}" as Mila returns no result`, /No results/.test(await M.page.locator('#cmd-results').innerText()));
  }
  await M.page.keyboard.press('Escape');
  await A.page.keyboard.press('/');
  await A.page.waitForSelector('#cmd-input');
  await A.page.fill('#cmd-input', 'PRIVATEPLAN'); await A.page.waitForTimeout(700);
  log('13b. the same search as the owner still finds the task', /PRIVATEPLAN/.test(await A.page.locator('#cmd-results').innerText()));
  await A.page.keyboard.press('Escape');
  // 14. notifications
  await M.page.click('#open-notifications');
  await M.page.waitForTimeout(500);
  const notifText = await M.page.locator('#notif-list').innerText();
  log('14. Mila\'s notifications contain nothing about the private task or comment (shared-task notifications from before it went private are history)', !/PRIVATECOMMENT/.test(notifText), notifText.replace(/\s+/g, ' ').slice(0, 140));
  await M.page.keyboard.press('Escape');
  await M.page.click('body', { position: { x: 5, y: 500 } }).catch(() => {});
  await M.page.screenshot({ path: `${SHOT}/14-member-view-no-private.png` });

  // 15. owner self-demotion attempt
  const members = (await api(A.page, `/api/family/${famA.id}`)).data.family.members;
  const own = members.find((m) => m.role === 'owner');
  const demote = await api(A.page, `/api/family/${famA.id}/members/${own.id}`, 'PATCH', { role: 'member' });
  await openTab(A, 'Members');
  const ownerLabels = await A.page.locator('.member-card .member-role').allTextContents();
  log('15. owner self-demotion refused (400) and the Members tab still shows exactly one owner', demote.status === 400 && ownerLabels.filter((t) => /owner/i.test(t)).length === 1, `${demote.status}; roles: ${ownerLabels.map((t) => t.trim()).join(', ')}`);

  // 16-17. valid transfer, exactly one owner
  await A.page.locator('.member-card:has-text("Mila") button:has-text("Make owner")').click();
  await A.page.waitForSelector('.modal-panel');
  await A.page.click('.modal-footer button:has-text("Transfer ownership")');
  await A.page.waitForSelector('.toast:has-text("Ownership transferred")');
  await A.page.waitForTimeout(600);
  const after = (await api(A.page, `/api/family/${famA.id}`)).data.family;
  log('16-17. transfer to Mila succeeds; exactly one owner (Mila) and families.ownerId matches', after.members.filter((m) => m.role === 'owner').length === 1 && after.members.find((m) => m.role === 'owner').displayName.startsWith('Mila') && after.ownerId === after.members.find((m) => m.role === 'owner').userId);
  const oldOwnerDemote = await api(A.page, `/api/family/${famA.id}/members/${after.members.find((m) => m.role === 'owner').id}`, 'PATCH', { role: 'member' });
  log('17b. the former owner cannot touch the new owner\'s row (403)', oldOwnerDemote.status === 403);
  const regenByOld = await api(A.page, `/api/family/${famA.id}/invite-code/regenerate`, 'POST', {});
  log('17c. the former owner can no longer rotate the code (403)', regenByOld.status === 403);
  // 18-19. leave, then delete account
  await A.page.locator('button:has-text("Leave family")').click();
  await A.page.click('.modal-footer button:has-text("Leave family")');
  await A.page.waitForSelector('button:has-text("Create a family")', { timeout: 8000 });
  log('18. former owner leaves through the UI', (await api(A.page, '/api/family')).data.families.length === 0);
  await A.page.click('#sidebar-nav a[href="#/settings"]');
  await A.page.click('#settings-tab-data');
  await A.page.click('button:has-text("Delete my account")');
  await A.page.fill('#delete-account-form [name=password]', A.password);
  await A.page.click('#delete-account-confirm-btn');
  await A.page.waitForSelector('#f-identifier', { timeout: 10000 });
  const stillThere = (await api(M.page, `/api/family/${famA.id}`)).data.family;
  log('19. Alice\'s account is deleted; Family Alpha survives with Mila as its single owner', stillThere && stillThere.members.filter((m) => m.role === 'owner').length === 1 && stillThere.ownerId !== undefined);
} catch (e) {
  log('script error', false, e.stack.split('\n').slice(0, 4).join(' | '));
}
console.log('console errors (deduped):', [...new Set(consoleErrors)].slice(0, 10));
console.log('page errors:', pageErrors.length, pageErrors.slice(0, 3));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill(); await browser.close(); process.exit(0);
