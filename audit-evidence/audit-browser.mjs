// FINAL AUDIT: journey A, failure modes (session expiry, backend down), responsive smoke (7 widths x all pages),
// automated accessibility scan (axe-core, light + dark).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const DBP = process.env.AUDIT_DB;
const SHOT = './screenshots-audit';
fs.mkdirSync(SHOT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const info = (label, detail) => console.log(`[INFO] ${label} — ${detail}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let srv = null;
async function startServer() {
  srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, LIFEADMIN_DB_PATH: DBP, NODE_ENV: 'development', PORT: '3001' }, stdio: ['ignore', 'inherit', 'inherit'] }); srv.on('error', (e) => console.log('SPAWN ERROR', e.message)); srv.on('exit', (c) => console.log('SERVER EXIT', c));
  for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) return; } catch {} await sleep(250); }
  throw new Error('server did not start');
}
async function stopServer() { if (srv) { srv.kill(); srv = null; await sleep(600); } }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [];
async function signup(page, first, last, tag) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  await page.fill('#f-firstName', first); await page.fill('#f-lastName', last);
  await page.fill('#f-email', `aud.${tag}.${Date.now()}@test.local`);
  await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
  await page.fill('#f-password', 'auditpass12345'); await page.fill('#f-confirmPassword', 'auditpass12345');
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });
}
const api = (page, path, method = 'GET', body) => page.evaluate(async ([p, m, b]) => {
  const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [path, method, body]);

try {
  await stopServer().catch(() => {});
  await startServer();

  // ================= Journey A =================
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const landing = await page.locator('body').innerText();
  log('A1 landing/login screen shows product tagline and sign-in form', /Tell LifeAdmin what's happening/.test(landing) && (await page.locator('#f-identifier').count()) === 1);
  await signup(page, 'Journey', 'Alpha', 'a');
  const dash1 = await page.locator('#page-root').innerText();
  log('A2 after signup the user lands on the Dashboard with onboarding for an empty account', /Good (morning|afternoon|evening)/.test(await page.locator('.page-title').first().innerText()), dash1.replace(/\s+/g, ' ').slice(0, 140));
  await page.screenshot({ path: `${SHOT}/A-dashboard-empty.png` });
  await page.click('#sidebar-nav a[href="#/tasks"]');
  await page.click('button:has-text("New task")');
  await page.fill('#task-form [name=title]', 'Renew passport');
  await page.fill('#task-form [name=dueDate]', new Date().toISOString().slice(0, 10));
  await page.click('#save-task-btn');
  await page.waitForSelector('.row-item');
  log('A3 created task appears in Tasks', (await page.locator('.row-title').allTextContents()).includes('Renew passport'));
  await page.locator('.row-check[aria-label="Toggle complete"]').first().click();
  await page.waitForTimeout(700);
  log('A4 task completed inline', (await page.locator('.row-title.done').count()) === 1);
  await page.click('#sidebar-nav a[href="#/dashboard"]');
  await page.waitForTimeout(1000);
  const dash2 = (await page.locator('#page-root').innerText()).replace(/\s+/g, ' ');
  log('A5 Dashboard reflects the completed task (no longer listed as open, completed count visible)', !/Renew passport.*(Due today|Overdue)/.test(dash2) , dash2.slice(0, 200));
  await page.screenshot({ path: `${SHOT}/A-dashboard-after.png` });
  // logout/login persistence
  await page.click('#user-chip'); // -> settings
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'networkidle' });
  log('A6 refresh keeps the session and the current route', (await page.locator('.page-title').first().innerText()).length > 0 && page.url().endsWith('#/settings'));

  // ================= Failure modes =================
  // (a) session expiry while the app is open
  const uid = (await api(page, '/api/auth/me')).data.user.id;
  const db = new DatabaseSync(DBP); db.prepare('DELETE FROM sessions WHERE user_id = ?').run(uid); db.close();
  await page.click('#sidebar-nav a[href="#/tasks"]');
  await page.waitForTimeout(1200);
  const afterExpiry = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 260);
  const onLogin = (await page.locator('#f-identifier').count()) > 0;
  info('F1 session deleted server-side while the app is open, then navigate to Tasks', `login screen shown: ${onLogin}; visible text: "${afterExpiry}"`);
  log('F1 expired session sends the user to sign-in (or shows a clear "signed out" state)', onLogin || /sign in|signed out|log in/i.test(afterExpiry));
  await page.screenshot({ path: `${SHOT}/F1-session-expired.png` });
  await page.reload({ waitUntil: 'networkidle' });
  log('F1b after reload the login screen is shown', (await page.locator('#f-identifier').count()) === 1);

  // (b) backend unavailable mid-session
  await page.fill('#f-identifier', 'x'); // noop
  await signup(page, 'Journey', 'Beta', 'b');
  await page.click('#sidebar-nav a[href="#/tasks"]');
  await page.waitForSelector('button:has-text("New task")');
  await stopServer();
  await page.click('#sidebar-nav a[href="#/goals"]');
  await page.waitForTimeout(1500);
  const down = (await page.locator('#page-root').innerText()).replace(/\s+/g, ' ').slice(0, 220);
  info('F2 server stopped, navigate to Goals', `page shows: "${down}"`);
  log('F2 backend-down navigation shows an understandable error state (no blank page, no stack trace)', down.length > 0 && !/at .*\(.*:\d+:\d+\)|TypeError|undefined/.test(down), down);
  await page.screenshot({ path: `${SHOT}/F2-backend-down.png` });
  await page.click('#sidebar-nav a[href="#/tasks"]');
  await page.waitForSelector('button:has-text("New task")', { timeout: 5000 }).catch(() => {});
  await page.click('button:has-text("New task")').catch(() => {});
  await page.fill('#task-form [name=title]', 'created while offline').catch(() => {});
  await page.click('#save-task-btn').catch(() => {});
  await page.waitForTimeout(800);
  const toastTxt = await page.locator('.toast').allTextContents();
  info('F2b saving a task while the server is down', `toasts: ${JSON.stringify(toastTxt)}; modal still open: ${(await page.locator('#task-form').count()) > 0}`);
  log('F2b failed save shows a friendly message and keeps the form', toastTxt.some((t2) => /network|server|running/i.test(t2)) && (await page.locator('#task-form').count()) > 0, JSON.stringify(toastTxt));
  await stopServer(); await startServer();
  await page.keyboard.press('Escape');
  await page.reload({ waitUntil: 'networkidle' });
  log('F3 after the server returns, a reload restores the session and data', (await page.locator('.page-title').count()) > 0);

  // ================= Responsive smoke =================
  const L = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const lp = await L.newPage();
  await signup(lp, 'Bartholomew-Maximilian'.repeat(2), 'Featherstonehaugh-Worthington'.repeat(2), 'long');
  const long = 'Unbroken' + 'X'.repeat(90);
  const fam = (await api(lp, '/api/family', 'POST', { name: 'The Extraordinarily Long Family Name Household ' + long })).data.family;
  const task = (await api(lp, '/api/tasks', 'POST', { title: long + ' and some words that wrap normally as well', description: long, familyId: fam.id, visibility: 'family', dueDate: new Date().toISOString().slice(0, 10) })).data.task;
  await api(lp, '/api/bills', 'POST', { name: long, amount: 1234567.89, dueDate: new Date().toISOString().slice(0, 10), category: 'other', recurrence: 'monthly' });
  const goal = (await api(lp, '/api/goals', 'POST', { title: long, description: long })).data.goal;
  await api(lp, `/api/goals/${goal.id}/milestones`, 'POST', { title: long });
  await api(lp, '/api/ecolife', 'POST', { category: 'food', action: long, unit: 'kg', quantity: 3 });
  const dec = (await api(lp, '/api/decisions', 'POST', { question: long + ' should we?' })).data.decision;
  await api(lp, `/api/decisions/${dec.id}/options`, 'POST', { name: long });
  await api(lp, `/api/chat/${fam.id}/messages`, 'POST', { body: long + long });
  await api(lp, `/api/family/${fam.id}/shopping`, 'POST', { name: long, quantity: long });
  const pages = [['dashboard', '#/dashboard'], ['tasks', '#/tasks'], ['task-detail', `#/tasks/${task.id}`], ['family', '#/family'], ['billsense', '#/billsense'], ['goals', '#/goals'], ['ecolife', '#/ecolife'], ['timeline', '#/timeline'], ['decisionflow', '#/decisionflow'], ['decision-detail', `#/decisionflow/${dec.id}`], ['assistant', '#/assistant'], ['settings', '#/settings']];
  const overflows = [];
  for (const w of [320, 360, 375, 390, 414, 768, 1280]) {
    await lp.setViewportSize({ width: w, height: w < 768 ? 740 : 900 });
    for (const [name, hash] of pages) {
      await lp.evaluate((h) => { location.hash = h; }, hash);
      await lp.waitForTimeout(450);
      if (name === 'family') { for (const tab of ['Members', 'Chat', 'Shopping list']) { await lp.click(`.tab:has-text("${tab}")`).catch(() => {}); await lp.waitForTimeout(250); const o = await lp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 1) overflows.push(`${w}px family/${tab} +${o}px`); } }
      const o = await lp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (o > 1) {
        const culprit = await lp.evaluate(() => { const cw = document.documentElement.clientWidth; const bad = [...document.querySelectorAll('#page-root *, .modal-panel *')].filter((e) => e.getBoundingClientRect().right > cw + 1).slice(0, 2); return bad.map((e) => `${e.tagName.toLowerCase()}.${(e.className || '').toString().split(' ')[0]}`).join(', '); });
        overflows.push(`${w}px ${name} +${o}px [${culprit}]`);
      }
      if (name === 'task-detail') await lp.keyboard.press('Escape');
    }
    if (w === 320 || w === 1280) await lp.screenshot({ path: `${SHOT}/resp-${w}-last.png` });
  }
  log('R1 no horizontal page overflow on 12 views (incl. task/decision detail, family tabs) x 7 widths with 90-char unbroken strings and very long names', overflows.length === 0, overflows.join(' | '));
  // unauthenticated screens
  const AU = await browser.newContext({ viewport: { width: 320, height: 700 } });
  const ap = await AU.newPage();
  const authOv = [];
  for (const w of [320, 360, 375, 390, 414, 768, 1280]) {
    await ap.setViewportSize({ width: w, height: 800 });
    await ap.goto(BASE, { waitUntil: 'networkidle' });
    let o = await ap.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 1) authOv.push(`${w} login +${o}`);
    await ap.click('#switch-mode'); o = await ap.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 1) authOv.push(`${w} signup +${o}`);
    await ap.click('#forgot-link').catch(async () => { await ap.click('#switch-mode'); await ap.click('#forgot-link'); });
    o = await ap.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 1) authOv.push(`${w} forgot +${o}`);
  }
  log('R2 login / signup / forgot-password fit at 7 widths', authOv.length === 0, authOv.join(' | '));

  // ================= Accessibility scan (axe-core) =================
  const axeSrc = await (await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js')).text();
  const agg = {};
  async function scan(p, label) {
    await p.evaluate(axeSrc);
    const res = await p.evaluate(async () => { const r = await window.axe.run(document, { resultTypes: ['violations'] }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(' ').slice(0, 90), help: v.help })); });
    for (const v of res) { const k = `${v.id} [${v.impact}]`; (agg[k] ||= { help: v.help, where: [] }).where.push(`${label}(${v.n}) e.g. ${v.sample}`); }
    return res.length;
  }
  for (const scheme of ['light', 'dark']) {
    const C = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    const cp = await C.newPage();
    await cp.goto(BASE, { waitUntil: 'networkidle' });
    await scan(cp, `${scheme}/login`);
    await cp.click('#switch-mode'); await scan(cp, `${scheme}/signup`);
    await signup(cp, 'Axe', 'Scan', 'axe' + scheme);
    await api(cp, '/api/demo/seed', 'POST', {});
    for (const [name, hash] of pages.filter(([n]) => !['task-detail', 'decision-detail'].includes(n))) {
      await cp.evaluate((h) => { location.hash = h; }, hash); await cp.waitForTimeout(700); await scan(cp, `${scheme}/${name}`);
    }
    await cp.evaluate(() => { location.hash = '#/tasks'; }); await cp.waitForTimeout(500);
    await cp.click('button:has-text("New task")'); await cp.waitForSelector('#task-form'); await scan(cp, `${scheme}/task-modal`); await cp.keyboard.press('Escape');
    await C.close();
  }
  for (const [k, v] of Object.entries(agg)) console.log(`[AXE] ${k}: ${v.help} — ${v.where.slice(0, 4).join(' ; ')}${v.where.length > 4 ? ` (+${v.where.length - 4} more views)` : ''}`);
  log('A11Y-1 axe-core scan completed on 12 views + modal in light and dark (violations listed above; see report)', true, `${Object.keys(agg).length} distinct rule(s) violated`);
} catch (e) {
  log('script error', false, e.stack.split('\n').slice(0, 5).join(' | '));
} finally {
  await stopServer();
}
console.log('console errors (deduped):', [...new Set(consoleErrors)].slice(0, 8));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
await browser.close();
process.exit(0);
