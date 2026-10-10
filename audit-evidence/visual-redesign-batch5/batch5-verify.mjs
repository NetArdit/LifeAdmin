// Visual Redesign Batch 5 verification: Family (roster + activity/chat +
// tab composition).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3035';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const OUT = './batch5-screens';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function rgbToHex(rgb) { const m = rgb.match(/\d+/g); if (!m) return rgb; return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join(''); }

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.B5_DB, NODE_ENV: 'development', PORT: '3035' },
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
const email = `batch5.${Date.now()}@test.local`;
await page.fill('#f-firstName', 'Batch'); await page.fill('#f-lastName', 'Five'); await page.fill('#f-email', email);
await page.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
await page.fill('#f-password', 'batchfivetest123'); await page.fill('#f-confirmPassword', 'batchfivetest123');
await page.click('#submit-btn');
await page.waitForSelector('.page-title', { timeout: 15000 });

// Generate real activity: create family (member_joined), rotate invite
// code (invite_code_changed), add an unregistered member (member_joined
// again), a family-visible task, and a shopping item.
const fam = await api(page, 'POST', '/api/family', { name: 'Batch Five Family' });
const familyId = fam.data.family.id;
await api(page, 'POST', `/api/family/${familyId}/invite-code/regenerate`);
await api(page, 'POST', `/api/family/${familyId}/members`, { phone: '+38349' + String(1000000 + Math.floor(Math.random() * 8000000)), displayName: 'Invited Person' });
await api(page, 'POST', '/api/tasks', { title: 'Shared grocery run', familyId, visibility: 'family' });
await api(page, 'POST', `/api/family/${familyId}/shopping`, { name: 'Milk', quantity: '2' });

await page.evaluate(() => { location.hash = '#/family'; });
await page.reload({ waitUntil: 'networkidle' });
await sleep(500);

// ============================================================
// A. Tab system — semantics + keyboard, exactly re-tested
// ============================================================
const tabStructure = await page.evaluate(() => ({
  tablist: !!document.querySelector('[role="tablist"]'),
  tabCount: document.querySelectorAll('[role="tab"]').length,
  firstSelected: document.querySelector('[role="tab"]')?.getAttribute('aria-selected'),
  activeColor: getComputedStyle(document.querySelector('.tab.active')).color,
}));
log('A. tablist/tab roles intact', tabStructure.tablist && tabStructure.tabCount === 5 && tabStructure.firstSelected === 'true', JSON.stringify(tabStructure));
log('A. active tab now uses the Warmth accent color (light)', rgbToHex(tabStructure.activeColor).toLowerCase() === '#96502a', rgbToHex(tabStructure.activeColor));

await page.locator('[role="tab"][aria-selected="true"]').first().focus();
await page.keyboard.press('ArrowRight');
await sleep(150);
const afterArrow = await page.evaluate(() => ({ text: document.activeElement?.textContent, selected: document.activeElement?.getAttribute('aria-selected') }));
log('A. ArrowRight moves focus+selection to Members', afterArrow.text === 'Members' && afterArrow.selected === 'true', JSON.stringify(afterArrow));
await page.keyboard.press('End');
await sleep(150);
log('A. End jumps to Activity (last tab)', await page.evaluate(() => document.activeElement?.textContent) === 'Activity');
await page.keyboard.press('Home');
await sleep(150);
log('A. Home jumps to Overview (first tab)', await page.evaluate(() => document.activeElement?.textContent) === 'Overview');

// ============================================================
// B. Overview — Shared tasks list-region (SET: Invite code stays a card)
// ============================================================
const overviewStructure = await page.evaluate(() => {
  const region = document.querySelector('.list-region');
  const inviteCard = [...document.querySelectorAll('.card')].find((c) => c.textContent.includes('Invite code'));
  return {
    regionExists: !!region,
    regionHasShadow: region ? getComputedStyle(region).boxShadow !== 'none' : null,
    inviteStillCard: !!inviteCard,
  };
});
log('B. "Shared tasks" is a .list-region, zero shadow', overviewStructure.regionExists && overviewStructure.regionHasShadow === false, JSON.stringify(overviewStructure));
log('B. "Invite code" remains a .card (SET, unchanged)', overviewStructure.inviteStillCard);
const sharedTasksHeadingColor = await page.locator('.list-region-heading').first().evaluate((e) => getComputedStyle(e).color);
log('B. "Shared tasks" heading uses the Warmth accent', rgbToHex(sharedTasksHeadingColor).toLowerCase() === '#96502a', rgbToHex(sharedTasksHeadingColor));
const taskCount = await page.locator('.list-region-heading').first().locator('xpath=following-sibling::span').textContent().catch(() => null);
log('B. shared-task count is shown', /\d+/.test(taskCount || ''), taskCount);

// ============================================================
// C. Members — SET, cards preserved, role badge, actions reachable
// ============================================================
await page.click('[role="tab"]:has-text("Members")');
await sleep(300);
const membersStructure = await page.evaluate(() => {
  const grid = document.querySelector('.member-grid');
  const cards = [...document.querySelectorAll('.member-card')];
  return {
    gridExists: !!grid,
    cardCount: cards.length,
    allCards: cards.every((c) => c.classList.contains('card')),
    roleBadgeText: document.querySelector('.member-role')?.textContent,
  };
});
log('C. Members roster remains a .member-grid of .card elements (SET, unchanged)', membersStructure.gridExists && membersStructure.allCards, JSON.stringify(membersStructure));
log('C. role is shown as a distinct badge', !!membersStructure.roleBadgeText, membersStructure.roleBadgeText);
const removeBtnReachable = await page.locator('.member-card button[aria-label*="Remove"]').count();
log('C. remove-member action independently reachable (owner)', removeBtnReachable > 0);
await page.screenshot({ path: `${OUT}/light-1280-members.png`, fullPage: true });

// ============================================================
// D. Activity — CONTINUUM, list-region, per-event accent, link fix
// ============================================================
await page.click('[role="tab"]:has-text("Activity")');
await sleep(400);
const activityEvents = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.row-item')];
  return items.map((el) => ({
    tag: el.tagName,
    hasHref: el.tagName === 'A' ? !!el.getAttribute('href') : null,
    text: el.querySelector('.row-title')?.textContent,
    iconColor: el.querySelector('.timeline-icon') ? getComputedStyle(el.querySelector('.timeline-icon')).color : null,
  }));
});
console.log('activity events:', JSON.stringify(activityEvents, null, 1));
const inviteEvt = activityEvents.find((e) => e.text?.includes('invite code'));
log('D. invite_code_changed activity renders as a plain <div> (no dead "#" link)', inviteEvt && inviteEvt.tag === 'DIV', inviteEvt && inviteEvt.tag);
log('D. invite_code_changed activity icon uses the Warmth accent', inviteEvt && rgbToHex(inviteEvt.iconColor).toLowerCase() === '#96502a', inviteEvt && rgbToHex(inviteEvt.iconColor));
const taskEvt = activityEvents.find((e) => e.text?.includes('created') && e.text?.includes('grocery'));
log('D. task_created activity renders as a real <a href> with unaccented icon', taskEvt && taskEvt.tag === 'A' && taskEvt.hasHref && rgbToHex(taskEvt.iconColor).toLowerCase() === '#2f4d82', JSON.stringify(taskEvt));
const activityRegionExists = await page.evaluate(() => !!document.querySelector('.list-region.module-accent--warmth'));
log('D. Activity tab uses .list-region (not .card)', activityRegionExists);
await page.screenshot({ path: `${OUT}/light-1280-activity.png`, fullPage: true });

// ============================================================
// E. Chat — deliberately unchanged (bounded, conversational surface)
// ============================================================
await page.click('[role="tab"]:has-text("Chat")');
await sleep(400);
const chatStructure = await page.evaluate(() => {
  const card = document.querySelector('.chat-window')?.closest('.card');
  return { stillCard: !!card, hasBoxShadow: card ? getComputedStyle(card).boxShadow !== 'none' : null };
});
log('E. Chat window remains a bounded .card (deliberately unchanged)', chatStructure.stillCard && chatStructure.hasBoxShadow, JSON.stringify(chatStructure));
await page.fill('.chat-input-row input', 'Batch 5 verification message');
await page.click('.chat-input-row button[type="submit"]');
await page.waitForFunction(() => document.querySelector('.chat-bubble')?.textContent.includes('Batch 5 verification'), { timeout: 4000 });
log('E. chat send still works, unaffected', true);
await page.screenshot({ path: `${OUT}/light-1280-chat.png`, fullPage: true });

// ============================================================
// F. Shopping — deliberately unchanged
// ============================================================
await page.click('[role="tab"]:has-text("Shopping")');
await sleep(300);
const shoppingStillCard = await page.evaluate(() => !!document.querySelector('.shopping-item')?.closest('.card'));
log('F. Shopping list remains a .card (deliberately unchanged)', shoppingStillCard);

// ============================================================
// G. Keyboard re-test on the restructured rows (Overview + Activity)
// ============================================================
await page.click('[role="tab"]:has-text("Overview")');
await sleep(300);
const sharedTaskLink = page.locator('.list-region a.row-item').first();
if (await sharedTaskLink.count()) {
  await sharedTaskLink.focus();
  log('G. shared-task row is keyboard-focusable', await page.evaluate(() => document.activeElement?.classList.contains('row-item')));
}
await page.click('[role="tab"]:has-text("Activity")');
await sleep(300);
const linkedActivityRow = page.locator('a.row-item').first();
await linkedActivityRow.focus();
log('G. linked activity row is keyboard-focusable', await page.evaluate(() => document.activeElement?.tagName === 'A'));
const nonLinkedFocusable = await page.evaluate(() => [...document.querySelectorAll('div.row-item')].some((d) => d.hasAttribute('tabindex')));
log('G. non-linked activity row has no artificial tabindex', !nonLinkedFocusable);

// ============================================================
// H. Responsive sweep — 7 required widths, light, on Activity (longest
// realistic content) and Members (grid reflow)
// ============================================================
const VIEWPORTS = [320, 360, 390, 430, 768, 1024, 1280];
for (const w of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`H. light ${w}px (Activity tab): no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/light-${w}-activity.png`, fullPage: w >= 768 });
}
await page.click('[role="tab"]:has-text("Members")');
await sleep(300);
for (const w of [320, 768]) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`H. light ${w}px (Members tab): no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
}

// ============================================================
// I. Mobile bottom-nav re-check on Activity (measured)
// ============================================================
await page.click('[role="tab"]:has-text("Activity")');
await page.setViewportSize({ width: 390, height: 844 });
await sleep(300);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(200);
const bottomCheck = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.row-item')];
  const last = items[items.length - 1];
  if (!last) return { hiddenPx: 0, noItems: true };
  const r = last.getBoundingClientRect();
  const navTop = document.querySelector('.bottom-nav').getBoundingClientRect().top;
  return { hiddenPx: Math.max(0, r.bottom - navTop) };
});
log('I. last activity row fully clear of the bottom nav after scrolling', bottomCheck.hiddenPx === 0, JSON.stringify(bottomCheck));
await page.screenshot({ path: `${OUT}/mobile-390-bottomnav-check.png` });

// ============================================================
// J. Dark theme
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await sleep(200);
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
await sleep(200);
const activeTabColorDark = await page.locator('.tab.active').evaluate((e) => getComputedStyle(e).color);
log('J. dark: active tab uses the dark Warmth accent value', rgbToHex(activeTabColorDark).toLowerCase() === '#d99a6c', rgbToHex(activeTabColorDark));
await page.screenshot({ path: `${OUT}/dark-1280-activity.png`, fullPage: true });
await page.click('[role="tab"]:has-text("Overview")');
await sleep(300);
await page.screenshot({ path: `${OUT}/dark-1280-overview.png`, fullPage: true });
await page.click('[role="tab"]:has-text("Members")');
await sleep(300);
await page.screenshot({ path: `${OUT}/dark-1280-members.png`, fullPage: true });
for (const w of [320, 390, 768]) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`J. dark ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
}

// ============================================================
// K. Regression: Tasks + BillSense + Timeline unaffected
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { location.hash = '#/tasks'; });
await sleep(400);
const tasksHeadingColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('K. Tasks heading unaffected (no Warmth bleed)', !rgbToHex(tasksHeadingColor).toLowerCase().includes('96502a'), rgbToHex(tasksHeadingColor));
await page.evaluate(() => { location.hash = '#/billsense'; });
await sleep(400);
const billsenseColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('K. BillSense Money accent unaffected', rgbToHex(billsenseColor).toLowerCase() === '#5fb3a3', rgbToHex(billsenseColor));
await page.evaluate(() => { location.hash = '#/timeline'; });
await sleep(400);
const timelineDayFont = await page.locator('.timeline-day-label').first().evaluate((e) => getComputedStyle(e).fontFamily);
log('K. Timeline date-group typography unaffected', timelineDayFont.toLowerCase().includes('fraunces'), timelineDayFont);
await page.screenshot({ path: `${OUT}/dark-1280-timeline-regression.png`, fullPage: true });

console.log('\nconsole/page errors (deduped):', [...new Set(consoleErrors)]);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill();
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
