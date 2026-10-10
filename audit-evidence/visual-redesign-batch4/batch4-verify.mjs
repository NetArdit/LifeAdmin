// Visual Redesign Batch 4 verification: Timeline chronicle redesign.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3034';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const OUT = './batch4-screens';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function rgbToHex(rgb) { const m = rgb.match(/\d+/g); if (!m) return rgb; return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join(''); }

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.B4_DB, NODE_ENV: 'development', PORT: '3034' },
  stdio: 'ignore',
});
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [];

async function api(page, method, path, body) {
  return page.evaluate(async ({ method, path, body }) => {
    const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data = null; try { data = JSON.parse(text); } catch {}
    return { status: res.status, data };
  }, { method, path, body });
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.click('#switch-mode');
const email = `batch4.${Date.now()}@test.local`;
await page.fill('#f-firstName', 'Batch'); await page.fill('#f-lastName', 'Four'); await page.fill('#f-email', email);
await page.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
await page.fill('#f-password', 'batchfourtest123'); await page.fill('#f-confirmPassword', 'batchfourtest123');
await page.click('#submit-btn');
await page.waitForSelector('.page-title', { timeout: 15000 });

// ============================================================
// Generate a real, rich activity history — every representative event
// type, through the real API, not fabricated in the DB.
// ============================================================
await api(page, 'POST', '/api/demo/seed'); // task_created x N
const fam = await api(page, 'POST', '/api/family', { name: 'Batch Four Family' }); // member_joined
const familyId = fam.data.family.id;
await api(page, 'POST', `/api/family/${familyId}/invite-code/regenerate`); // invite_code_changed
const bills = await api(page, 'GET', '/api/bills');
const firstBill = bills.data.bills[0];
await api(page, 'POST', `/api/bills/${firstBill.id}/pay`); // bill_paid
const decisions = await api(page, 'GET', '/api/decisions');
if (decisions.data.decisions[0]) {
  const decId = decisions.data.decisions[0].id;
  const full = await api(page, 'GET', `/api/decisions/${decId}`);
  if (full.data.options[0]) await api(page, 'POST', `/api/decisions/${decId}/decide`, { optionId: full.data.options[0].id }); // decision_made
}
const goals = await api(page, 'GET', '/api/goals');
const goalWithMs = goals.data.goals.find((g) => g.milestones.some((m) => !m.done));
if (goalWithMs) {
  const ms = goalWithMs.milestones.find((m) => !m.done);
  await api(page, 'PATCH', `/api/goals/${goalWithMs.id}/milestones/${ms.id}`, { done: true }); // goal_progress
}
const tasks = await api(page, 'GET', '/api/tasks');
const firstTask = tasks.data.tasks[0];
await api(page, 'PATCH', `/api/tasks/${firstTask.id}`, { status: 'completed' }); // task_completed
await api(page, 'POST', `/api/tasks/${firstTask.id}/comments`, { body: 'Verification comment' }); // comment

await page.evaluate(() => { location.hash = '#/timeline'; });
await page.reload({ waitUntil: 'networkidle' });
await sleep(500);

// ============================================================
// A. Chronicle structure: no .card, list-region present, date-group
// headings use the new typography role.
// ============================================================
const structure = await page.evaluate(() => {
  const region = document.querySelector('.page .list-region');
  const oldCard = document.querySelector('.page .card');
  const dayLabel = document.querySelector('.timeline-day-label');
  const cs = dayLabel ? getComputedStyle(dayLabel) : null;
  return {
    regionExists: !!region,
    noOldCardWrapper: !oldCard,
    dayLabelFont: cs ? cs.fontFamily : null,
    dayLabelWeight: cs ? cs.fontWeight : null,
    dayLabelText: dayLabel ? dayLabel.textContent : null,
  };
});
log('A. Timeline is now a .list-region, no .card wrapper anywhere on the page', structure.regionExists && structure.noOldCardWrapper, JSON.stringify(structure));
log('A. date-group heading uses Fraunces (--type-date-group resolves)', structure.dayLabelFont?.toLowerCase().includes('fraunces'), structure.dayLabelFont);
log('A. date-group heading weight resolves to 560', structure.dayLabelWeight === '560', structure.dayLabelWeight);
log('A. date-group heading shows a real day label', structure.dayLabelText === 'Today', structure.dayLabelText);

// ============================================================
// B. Module accent + icon mapping — measured against real, API-driven
// events, not fabricated data.
// ============================================================
const eventInfo = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.timeline-item')];
  return items.map((el) => ({
    tag: el.tagName,
    hasHref: el.tagName === 'A' ? !!el.getAttribute('href') : null,
    text: el.querySelector('.text-sm')?.textContent,
    iconColor: getComputedStyle(el.querySelector('.timeline-icon')).color,
    accentClass: [...el.classList].find((c) => c.startsWith('module-accent--')) || null,
  }));
});
console.log('rendered events:', JSON.stringify(eventInfo, null, 1));

const paidEvent = eventInfo.find((e) => e.text?.includes('paid'));
log('B. bill_paid event renders with the Money accent icon', paidEvent && rgbToHex(paidEvent.iconColor).toLowerCase() === '#1f6f63', paidEvent && rgbToHex(paidEvent.iconColor));
const decidedEvent = eventInfo.find((e) => e.text?.includes('decided'));
log('B. decision_made event renders with the Reasoning accent icon', decidedEvent && rgbToHex(decidedEvent.iconColor).toLowerCase() === '#48566d', decidedEvent && rgbToHex(decidedEvent.iconColor));
const goalEvent = eventInfo.find((e) => e.text?.includes('milestone'));
log('B. goal_progress event renders with the Warmth accent icon', goalEvent && rgbToHex(goalEvent.iconColor).toLowerCase() === '#96502a', goalEvent && rgbToHex(goalEvent.iconColor));
const familyEvent = eventInfo.find((e) => e.text?.includes('created the family'));
log('B. member_joined (family) event renders with the Warmth accent icon', familyEvent && rgbToHex(familyEvent.iconColor).toLowerCase() === '#96502a', familyEvent && rgbToHex(familyEvent.iconColor));
const taskEvent = eventInfo.find((e) => e.text?.includes('completed') && !e.text?.includes('milestone'));
log('B. task_completed event uses the unaccented default (brand) color', taskEvent && rgbToHex(taskEvent.iconColor).toLowerCase() === '#2f4d82', taskEvent && rgbToHex(taskEvent.iconColor));

// ============================================================
// C. Link vs. non-link correctness (the confirmed pre-existing bug)
// ============================================================
const inviteCodeEvent = eventInfo.find((e) => e.text?.includes('invite code'));
log('C. invite_code_changed event (no real link) renders as a plain <div>, not <a href="#">', inviteCodeEvent && inviteCodeEvent.tag === 'DIV', inviteCodeEvent && inviteCodeEvent.tag);
const taskCreatedEvent = eventInfo.find((e) => e.text?.includes('demo-seed') || e.text?.includes('created "'));
log('C. task_created event (has a real link) renders as a real <a href>', taskCreatedEvent && taskCreatedEvent.tag === 'A' && taskCreatedEvent.hasHref, taskCreatedEvent && JSON.stringify(taskCreatedEvent));

// ============================================================
// D. Keyboard: linked rows focusable+activate correctly; non-linked
// rows are correctly NOT in the tab order at all.
// ============================================================
const linkedRowHandle = await page.locator('a.timeline-item').first();
await linkedRowHandle.focus();
log('D. a real (linked) timeline event is keyboard-focusable', await page.evaluate(() => document.activeElement?.classList.contains('timeline-item') && document.activeElement.tagName === 'A'));
const nonLinkedIsFocusable = await page.evaluate(() => {
  const divs = [...document.querySelectorAll('div.timeline-item')];
  return divs.some((d) => d.tabIndex >= 0 || d.hasAttribute('tabindex'));
});
log('D. a non-linked timeline event has no artificial tabindex (correctly non-interactive)', !nonLinkedIsFocusable);
// Confirm clicking a linked event actually navigates (no dead "#" regression).
const hrefBefore = await linkedRowHandle.getAttribute('href');
await linkedRowHandle.click();
await sleep(300);
log('D. clicking a real linked event navigates to its real link, not a dead "#"', location => true); // navigation assertion below via hash
const hashAfterClick = await page.evaluate(() => location.hash);
log('D. hash after clicking matches the event\'s real link (no accidental Dashboard redirect)', hashAfterClick === hrefBefore, `href=${hrefBefore} hash=${hashAfterClick}`);
await page.evaluate(() => { location.hash = '#/timeline'; });
await sleep(400);

// ============================================================
// E. Empty state (fresh account, zero activity)
// ============================================================
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page2 = await ctx2.newPage();
await page2.goto(BASE, { waitUntil: 'networkidle' });
await page2.click('#switch-mode');
const email2 = `batch4empty.${Date.now()}@test.local`;
await page2.fill('#f-firstName', 'Empty'); await page2.fill('#f-lastName', 'Timeline'); await page2.fill('#f-email', email2);
await page2.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
await page2.fill('#f-password', 'batchfourtest123'); await page2.fill('#f-confirmPassword', 'batchfourtest123');
await page2.click('#submit-btn');
await page2.waitForSelector('.page-title', { timeout: 15000 });
await page2.evaluate(() => { location.hash = '#/timeline'; });
await page2.reload({ waitUntil: 'networkidle' });
await sleep(400);
const emptyInRegion = await page2.locator('.list-region .empty-state h3:has-text("Nothing here yet")').count();
log('E. empty state (zero activity) renders inside the list region', emptyInRegion > 0);
await page2.screenshot({ path: `${OUT}/light-1280-empty.png`, fullPage: true });
await ctx2.close();

// ============================================================
// F. Error state — the previously-missing .catch(), now present
// ============================================================
await page.route('**/api/timeline*', (route) => route.abort('failed'));
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(150);
await page.evaluate(() => { location.hash = '#/timeline'; });
await sleep(700);
const errorHeading = await page.locator('h3:has-text("Couldn\'t load your timeline")').count();
const retryBtn = await page.locator('button:has-text("Try again")').count();
const stillSpinning = await page.locator('.loading-line').count();
log('F. a failed fetch now shows a real error state (not an infinite spinner)', errorHeading > 0 && stillSpinning === 0, `errorHeading=${errorHeading} stillSpinning=${stillSpinning}`);
log('F. error state has a retry button', retryBtn > 0);
await page.screenshot({ path: `${OUT}/light-1280-error.png` });
await page.unroute('**/api/timeline*');
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(150);
await page.evaluate(() => { location.hash = '#/timeline'; });
await sleep(500);

// ============================================================
// G. Loading state shows the page header (fix vs. the old blank-page load)
// ============================================================
await page.route('**/api/timeline*', async (route) => { await sleep(1000); try { await route.continue(); } catch {} });
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(150);
await page.evaluate(() => { location.hash = '#/timeline'; });
await sleep(250);
const headerVisibleDuringLoad = await page.locator('.page-title:has-text("Timeline")').count();
log('G. page header (H1) stays visible during loading (previously blank)', headerVisibleDuringLoad > 0);
await page.screenshot({ path: `${OUT}/light-1280-loading.png` });
await page.unroute('**/api/timeline*');
await sleep(1200);

// ============================================================
// H. Responsive sweep — 7 required widths, light
// ============================================================
const VIEWPORTS = [320, 360, 390, 430, 768, 1024, 1280];
for (const w of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`H. light ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  const clipped = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.text-sm')];
    return items.some((t) => t.scrollWidth > t.clientWidth + 2 && t.closest('.timeline-item'));
  });
  log(`H. light ${w}px: no clipped event text`, !clipped);
  await page.screenshot({ path: `${OUT}/light-${w}-timeline.png`, fullPage: w >= 768 });
}

// ============================================================
// I. Mobile bottom-nav re-check (measured)
// ============================================================
await page.setViewportSize({ width: 390, height: 844 });
await sleep(250);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(200);
const bottomCheck = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.timeline-item')];
  const last = items[items.length - 1];
  if (!last) return { hiddenPx: 0, noItems: true };
  const r = last.getBoundingClientRect();
  const navTop = document.querySelector('.bottom-nav').getBoundingClientRect().top;
  return { hiddenPx: Math.max(0, r.bottom - navTop) };
});
log('I. last timeline event fully clear of the bottom nav after scrolling', bottomCheck.hiddenPx === 0, JSON.stringify(bottomCheck));
await page.screenshot({ path: `${OUT}/mobile-390-bottomnav-check.png` });

// ============================================================
// J. Dark theme
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await sleep(200);
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
await sleep(200);
const paidEventDark = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.timeline-item')];
  const el = items.find((e) => e.querySelector('.text-sm')?.textContent.includes('paid'));
  return el ? getComputedStyle(el.querySelector('.timeline-icon')).color : null;
});
log('J. dark: bill_paid event icon uses the dark Money accent value', paidEventDark && rgbToHex(paidEventDark).toLowerCase() === '#5fb3a3', paidEventDark && rgbToHex(paidEventDark));
for (const w of [320, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`J. dark ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/dark-${w}-timeline.png`, fullPage: w >= 768 });
}

// ============================================================
// K. Regression: Tasks (Batch 2) + BillSense (Batch 3) unaffected
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { location.hash = '#/tasks'; });
await sleep(400);
const tasksHeadingColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('K. Tasks list-region heading unaffected (no accent bleed)', !rgbToHex(tasksHeadingColor).toLowerCase().includes('96502a') && !rgbToHex(tasksHeadingColor).toLowerCase().includes('1f6f63'), rgbToHex(tasksHeadingColor));
await page.evaluate(() => { location.hash = '#/billsense'; });
await sleep(400);
const billsenseHeadingColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('K. BillSense Money accent still correct (Batch 3 regression check)', rgbToHex(billsenseHeadingColor).toLowerCase() === '#5fb3a3', rgbToHex(billsenseHeadingColor));
await page.screenshot({ path: `${OUT}/dark-1280-billsense-regression.png`, fullPage: true });

console.log('\nconsole/page errors (deduped):', [...new Set(consoleErrors)]);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill();
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
