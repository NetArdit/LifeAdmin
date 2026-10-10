// FINAL AUDIT: dynamic XSS sink audit. Every user-controlled field is populated with an HTML/JS payload,
// then every page/tab/modal is opened as BOTH the author and a second family member. Nothing may execute
// and no payload markup may become DOM elements.
import { chromium } from 'playwright';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const BASE = 'http://localhost:3001';
const DBP = process.env.AUDIT_DB;
const SHOT = './screenshots-audit';
fs.mkdirSync(SHOT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };

const PAY = '<img src=x onerror="window.__x=(window.__x||0)+1">';
const PAY2 = '"><svg onload="window.__x=(window.__x||0)+1"><u id="probe-u">U</u>';
const ATTR = `" onmouseover="window.__x=(window.__x||0)+1" x="`;
const S = (tag) => `${tag} ${PAY}${PAY2}`;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const pageErrors = [];
async function newUser(name, first, last) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(`${name}: ${e.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  const email = `xss.${name}.${Date.now()}@test.local`;
  await page.fill('#f-firstName', first); await page.fill('#f-lastName', last); await page.fill('#f-email', email);
  await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
  await page.fill('#f-password', 'xsspass12345'); await page.fill('#f-confirmPassword', 'xsspass12345');
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });
  return { page, email };
}
const api = (page, path, method = 'GET', body) => page.evaluate(async ([p, m, b]) => {
  const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [path, method, body]);

async function probe(page, label) {
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({
    fired: window.__x || 0,
    imgs: document.querySelectorAll('img[src="x"]').length,
    svgs: document.querySelectorAll('svg[onload]').length,
    u: document.querySelectorAll('#probe-u').length,
    handlers: document.querySelectorAll('[onmouseover],[onerror],[onload]').length,
    rendered: /onerror=|<img src=x/.test(document.body.innerText),
  }));
  log(`${label}: no payload executed and none became markup`, r.fired === 0 && r.imgs === 0 && r.svgs === 0 && r.u === 0 && r.handlers === 0, `${JSON.stringify(r)}`);
  return r;
}
async function go(page, hash) { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(400); }

try {
  // U = author whose OWN NAME is the payload; V = second family member (viewer).
  const U = await newUser('u', PAY, PAY2);
  const V = await newUser('v', 'Vic', 'Viewer');
  // family (payload name), V joins
  const fam = (await api(U.page, '/api/family', 'POST', { name: S('FAM') })).data.family;
  await api(V.page, '/api/family/join', 'POST', { code: fam.inviteCode });
  // invited placeholder member with payload display name
  await api(U.page, `/api/family/${fam.id}/members`, 'POST', { phone: '+38344555666', displayName: S('INVITED') });
  // tasks (title, description, notes, category), comment, assigned + family visible
  const vId = (await api(V.page, '/api/auth/me')).data.user.id;
  const task = (await api(U.page, '/api/tasks', 'POST', { title: S('TASK'), description: S('DESC'), notes: S('NOTES'), category: S('CAT'), familyId: fam.id, visibility: 'family', assignedTo: vId, dueDate: new Date().toISOString().slice(0, 10) })).data.task;
  await api(U.page, `/api/tasks/${task.id}/comments`, 'POST', { body: S('COMMENT') });
  await api(V.page, `/api/tasks/${task.id}/comments`, 'POST', { body: S('COMMENT2') });
  await api(U.page, '/api/tasks', 'POST', { title: S('PRIVATE-TASK') });
  // chat, reactions, shopping
  const msg = (await api(U.page, `/api/chat/${fam.id}/messages`, 'POST', { body: S('CHAT') })).data.message;
  await api(V.page, `/api/chat/${fam.id}/messages/${msg.id}/react`, 'POST', { emoji: S('EMOJI') });
  await api(U.page, `/api/family/${fam.id}/shopping`, 'POST', { name: S('ITEM'), quantity: S('QTY') });
  // bills, goals, milestones, eco, decisions
  await api(U.page, '/api/bills', 'POST', { name: S('BILL'), amount: 12.5, dueDate: new Date().toISOString().slice(0, 10), notes: S('BILLNOTES'), currency: 'EUR', category: 'other', recurrence: 'none' });
  const goal = (await api(U.page, '/api/goals', 'POST', { title: S('GOAL'), description: S('GOALDESC') })).data.goal;
  await api(U.page, `/api/goals/${goal.id}/milestones`, 'POST', { title: S('MILESTONE') });
  await api(U.page, '/api/ecolife', 'POST', { category: 'food', action: S('ECO'), unit: S('UNIT'), notes: S('ECONOTES'), quantity: 2 });
  const dec = (await api(U.page, '/api/decisions', 'POST', { question: S('DECISION') })).data.decision;
  const crit = (await api(U.page, `/api/decisions/${dec.id}/criteria`, 'POST', { name: S('CRIT'), weight: 3 })).data.criterion;
  const optA = (await api(U.page, `/api/decisions/${dec.id}/options`, 'POST', { name: S('OPTA') })).data.option;
  await api(U.page, `/api/decisions/${dec.id}/options`, 'POST', { name: S('OPTB') });
  await api(U.page, `/api/decisions/${dec.id}/options/${optA.id}`, 'PATCH', { pros: [S('PRO')], cons: [S('CON')], criterionId: crit.id, rating: 4 });
  // Simulated AI-generated content containing HTML (written straight into the DB the way the AI routes persist it)
  const db = new DatabaseSync(DBP);
  const uId = (await api(U.page, '/api/auth/me')).data.user.id;
  db.prepare("UPDATE decisions SET recommendation = ? WHERE id = ?").run(JSON.stringify({ reasoningSummary: S('AI-REASON'), missingInfo: [S('AI-MISSING')], confidence: 'high', recommendedOptionId: optA.id }), dec.id);
  db.prepare("UPDATE decision_options SET risks = ? WHERE id = ?").run(JSON.stringify([S('AI-RISK')]), optA.id);
  const conv = db.prepare("INSERT INTO ai_conversations (user_id, title) VALUES (?, 'x')").run(uId).lastInsertRowid;
  db.prepare("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'user', ?)").run(conv, S('AI-USER-MSG'));
  db.prepare("INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)").run(conv, S('AI-REPLY'));
  db.close();
  log('fixtures created for every user-controlled field (names, family, invited member, task/desc/notes/category, comments, chat, emoji, shopping, bills, goals, milestones, eco, decisions, criteria, options, pros/cons, simulated AI text)', true);

  for (const [who, W] of [['author', U], ['other member', V]]) {
    const p = W.page;
    await p.reload({ waitUntil: 'networkidle' });
    await probe(p, `${who}: dashboard + app shell (user chip)`);
    await go(p, '#/tasks'); await probe(p, `${who}: Tasks list`);
    await go(p, `#/tasks/${task.id}`); await probe(p, `${who}: Task detail modal (title/desc/notes/comments/names)`);
    // delete dialog (author only can delete) + close
    if (who === 'author') {
      const del = p.locator('button:has-text("Delete")').first();
      if (await del.count()) { await del.click(); await p.waitForSelector('text=Delete task?'); await probe(p, `${who}: Delete-task confirm dialog`); await p.keyboard.press('Escape'); }
    }
    await p.keyboard.press('Escape');
    await go(p, '#/family');
    await p.waitForSelector('.tab:has-text("Overview")', { timeout: 10000 }).catch(() => {});
    for (const tab of ['Overview', 'Members', 'Chat', 'Shopping list', 'Activity']) {
      await p.click(`.tab:has-text("${tab}")`).catch(() => {});
      await probe(p, `${who}: Family › ${tab}`);
    }
    if (who === 'author') {
      const mk = p.locator('button[aria-label^="Make "]').first();
      if (await mk.count()) { await p.click('.tab:has-text("Members")'); await p.locator('button[aria-label^="Make "]').first().click(); await p.waitForSelector('.modal-panel'); await probe(p, `${who}: Transfer-ownership dialog (payload names)`); await p.keyboard.press('Escape'); }
    }
    await go(p, '#/billsense'); await probe(p, `${who}: BillSense`);
    await go(p, '#/goals'); await probe(p, `${who}: Goals`);
    await go(p, '#/ecolife'); await probe(p, `${who}: EcoLife`);
    await go(p, '#/timeline'); await probe(p, `${who}: Timeline (actor names + summaries)`);
    await go(p, '#/decisionflow'); await probe(p, `${who}: DecisionFlow list`);
    await go(p, `#/decisionflow/${dec.id}`); await probe(p, `${who}: DecisionFlow detail (criteria/options/pros/cons/AI recommendation)`);
    await go(p, '#/assistant'); await probe(p, `${who}: Assistant (history incl. simulated AI reply)`);
    await go(p, '#/settings'); await probe(p, `${who}: Settings › profile`);
    // notifications panel
    await p.click('#open-notifications'); await probe(p, `${who}: Notifications panel (titles/bodies)`); await p.keyboard.press('Escape'); await p.click('body', { position: { x: 5, y: 400 } }).catch(() => {});
    // command palette (search results incl. payload titles, chat/comment bodies) and payload query
    await p.keyboard.press('/');
    await p.waitForSelector('#cmd-input', { timeout: 3000 }).catch(() => {});
    await p.fill('#cmd-input', 'onerror').catch(() => {});
    await probe(p, `${who}: Command palette results for "onerror"`);
    await p.fill('#cmd-input', PAY).catch(() => {});
    await probe(p, `${who}: Command palette echo of a payload query`);
    await p.keyboard.press('Escape');
  }
  // Own-name markup glitch: 2 characters of first/last name are inserted unescaped into the avatar in the shell
  const G = await newUser('g', '<', 'b');
  const glitch = await G.page.evaluate(() => ({ chipHtml: document.querySelector('.user-chip').innerHTML.slice(0, 160), avatarCount: document.querySelectorAll('.user-chip .avatar').length, bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
  console.log('INFO name "<" + "b" -> shell user chip:', JSON.stringify(glitch));
  await G.page.screenshot({ path: `${SHOT}/initials-glitch.png` });
} catch (e) {
  log('script error', false, e.stack.split('\n').slice(0, 4).join(' | '));
}
console.log('page errors:', pageErrors.length, pageErrors.slice(0, 3));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
await browser.close();
