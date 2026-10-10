// Visual Redesign Batch 6 verification: Dashboard priority/synthesis redesign.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3036';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const OUT = './batch6-screens';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function rgbToHex(rgb) { const m = rgb.match(/\d+/g); if (!m) return rgb; return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join(''); }

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.B6_DB, NODE_ENV: 'development', PORT: '3036' },
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
async function signUpFresh(page, first, last) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  const email = `${first.toLowerCase()}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@test.local`;
  await page.fill('#f-firstName', first); await page.fill('#f-lastName', last); await page.fill('#f-email', email);
  await page.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
  await page.fill('#f-password', 'batchsixtest123'); await page.fill('#f-confirmPassword', 'batchsixtest123');
  await page.click('#submit-btn');
  await page.waitForSelector('.page-title', { timeout: 15000 });
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await signUpFresh(page, 'Batch', 'Six');
await api(page, 'POST', '/api/demo/seed');
const fam = await api(page, 'POST', '/api/family', { name: 'Batch Six Family' });
const familyId = fam.data.family.id;
await api(page, 'POST', `/api/family/${familyId}/invite-code/regenerate`);

await page.evaluate(() => { location.hash = '#/dashboard'; });
await page.reload({ waitUntil: 'networkidle' });
await sleep(500);

// ============================================================
// A. Dominant bucket structure — demo data has overdue/critical items,
// so "Needs attention" should be dominant here.
// ============================================================
const structureA = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.dash-grid .stack')[0].children];
  return cards.map((c) => ({
    isDominant: getComputedStyle(c).borderLeftWidth === '3px',
    hasToggleButton: !!c.querySelector('.bucket-toggle'),
    hasFullList: !!c.querySelector('.row-list'),
    text: c.textContent.slice(0, 40),
  }));
});
console.log('bucket structure (demo data):', JSON.stringify(structureA, null, 1));
const dominantCount = structureA.filter((c) => c.isDominant).length;
log('A. exactly one dominant bucket rendered (demo data: Needs attention)', dominantCount === 1, JSON.stringify(structureA.map((c) => c.isDominant)));
const compactCount = structureA.filter((c) => c.hasToggleButton && !c.hasFullList).length;
log('A. the other buckets render compact (collapsed) by default', compactCount === 2, JSON.stringify(structureA));

// ============================================================
// B. Severity-ordered dominance is real, not hardcoded to index 0 —
// fresh account with ONLY a "coming soon"-scored task (score 10: 3 days
// out, medium priority), nothing in Needs attention.
// ============================================================
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page2 = await ctx2.newPage();
await signUpFresh(page2, 'Dominance', 'Test');
const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
await api(page2, 'POST', '/api/tasks', { title: 'Coming-soon-only task', dueDate: in3Days, priority: 'medium' });
await page2.evaluate(() => { location.hash = '#/dashboard'; });
await page2.reload({ waitUntil: 'networkidle' });
await sleep(400);
const structureB = await page2.evaluate(() => {
  const cards = [...document.querySelectorAll('.dash-grid .stack')[0].children];
  return cards.map((c) => ({ text: c.textContent.slice(0, 30), dominant: getComputedStyle(c).borderLeftWidth === '3px' }));
});
console.log('bucket structure (coming-soon-only data):', JSON.stringify(structureB));
const comingSoonDominant = structureB[1]?.dominant && !structureB[0]?.dominant;
log('B. dominance correctly shifts to "Coming soon" when "Needs attention" is empty (not hardcoded)', comingSoonDominant, JSON.stringify(structureB));
await page2.screenshot({ path: `${OUT}/light-1280-dominance-shift.png`, fullPage: true });
await ctx2.close();

// ============================================================
// C. All-buckets-empty state
// ============================================================
const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page3 = await ctx3.newPage();
await signUpFresh(page3, 'Empty', 'Buckets');
await page3.evaluate(() => { location.hash = '#/dashboard'; });
await page3.reload({ waitUntil: 'networkidle' });
await sleep(400);
const caughtUp = await page3.locator('h3:has-text("You\'re all caught up")').count();
log('C. zero-item scenario shows one calm "caught up" message, not three empty compact cards', caughtUp > 0);
await page3.screenshot({ path: `${OUT}/light-1280-all-empty.png`, fullPage: true });
await ctx3.close();

// ============================================================
// D. Disclosure toggle — keyboard behavior on a compact bucket
// ============================================================
const toggle = page.locator('.bucket-toggle').first();
await toggle.focus();
log('D. compact bucket toggle is keyboard-focusable', await page.evaluate(() => document.activeElement?.classList.contains('bucket-toggle')));
const expandedBefore = await toggle.getAttribute('aria-expanded');
await page.keyboard.press('Enter');
await sleep(200);
const expandedAfter = await toggle.getAttribute('aria-expanded');
log('D. Enter toggles aria-expanded and reveals the full list', expandedBefore === 'false' && expandedAfter === 'true', `${expandedBefore} -> ${expandedAfter}`);
const chevronRotated = await page.locator('.bucket-toggle[aria-expanded="true"] .bucket-chevron').evaluate((e) => getComputedStyle(e).transform !== 'none');
log('D. chevron visibly rotates on expand', chevronRotated);
await page.keyboard.press('Enter');
await sleep(200);
log('D. Enter again collapses it back', await toggle.getAttribute('aria-expanded') === 'false');

// ============================================================
// E. ItemRow — fixed nested-interactive-control bug, re-tested
// ============================================================
await page.keyboard.press('Enter'); // expand it again for the check
await sleep(200);
const itemRowStructure = await page.evaluate(() => {
  const row = document.querySelector('.dash-grid .row-item');
  if (!row) return null;
  return { hasNestedButtonInAnchor: row.tagName === 'A' && !!row.querySelector('button') };
});
log('E. ItemRow no longer nests a <button> inside an <a> (fixed)', itemRowStructure && !itemRowStructure.hasNestedButtonInAnchor, JSON.stringify(itemRowStructure));
const checkBtn = page.locator('.dash-grid .row-item .row-check').first();
await checkBtn.focus();
log('E. the checkbox is independently keyboard-focusable', await page.evaluate(() => document.activeElement?.classList.contains('row-check')));
const rowLink = page.locator('.dash-grid .row-item a.row-item-btn, .dash-grid .row-item .row-main').first();
await rowLink.focus();
log('E. the title/link area is independently keyboard-focusable', await page.evaluate(() => document.activeElement?.tagName === 'A'));

// ============================================================
// F. ActivityCard — link fix + accent mapping, measured
// ============================================================
const activityEvents = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.dash-grid .card')];
  const activityCard = cards.find((c) => c.textContent.includes('Family activity'));
  if (!activityCard) return [];
  return [...activityCard.querySelectorAll('.row-item')].map((el) => ({
    tag: el.tagName,
    text: el.querySelector('.row-title')?.textContent,
    iconColor: el.querySelector('.timeline-icon') ? getComputedStyle(el.querySelector('.timeline-icon')).color : null,
  }));
});
console.log('dashboard activity events:', JSON.stringify(activityEvents, null, 1));
const inviteEvt = activityEvents.find((e) => e.text?.includes('invite code'));
log('F. invite_code_changed renders as a plain <div> (no dead "#" link)', inviteEvt && inviteEvt.tag === 'DIV', inviteEvt && inviteEvt.tag);
log('F. invite_code_changed icon uses the Warmth accent', inviteEvt && rgbToHex(inviteEvt.iconColor).toLowerCase() === '#96502a', inviteEvt && rgbToHex(inviteEvt.iconColor));
const taskEvt = activityEvents.find((e) => e.text?.includes('demo-seed') || e.tag === 'A');
log('F. a linked event (task) renders as a real <a> with unaccented icon', taskEvt && taskEvt.tag === 'A' && rgbToHex(taskEvt.iconColor).toLowerCase() === '#2f4d82', JSON.stringify(taskEvt));

// GoalsCard progress-fill deliberately unchanged (still the original green,
// not Warmth) — confirmed, not assumed, since Goals hasn't had its own
// batch yet.
const goalsFillColor = await page.evaluate(() => {
  const fill = document.querySelector('.progress-fill');
  return fill ? getComputedStyle(fill).backgroundColor : null;
});
log('F. GoalsCard progress-fill deliberately still the original accent-500 green (Goals not yet batched)', goalsFillColor && rgbToHex(goalsFillColor).toLowerCase() === '#2f8f6f', goalsFillColor);

await page.screenshot({ path: `${OUT}/light-1280-dashboard.png`, fullPage: true });

// ============================================================
// G. Responsive sweep — 7 required widths, light
// ============================================================
const VIEWPORTS = [320, 360, 390, 430, 768, 1024, 1280];
for (const w of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`G. light ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/light-${w}-dashboard.png`, fullPage: w >= 768 });
}

// ============================================================
// H. Mobile bottom-nav — the original motivating measurement
// ============================================================
await page.setViewportSize({ width: 390, height: 844 });
await sleep(300);
const firstViewportCheck = await page.evaluate(() => {
  const navTop = document.querySelector('.bottom-nav').getBoundingClientRect().top;
  const rows = [...document.querySelectorAll('.dash-grid .row-item')];
  // Which rows (if any) are naturally within the first, unscrolled viewport?
  const inFirstView = rows.filter((r) => r.getBoundingClientRect().top < navTop);
  const clipped = inFirstView.filter((r) => r.getBoundingClientRect().bottom > navTop);
  return { rowsInFirstView: inFirstView.length, clippedInFirstView: clipped.length };
});
log('H. mobile first paint: no row is clipped by the bottom nav before any scrolling', firstViewportCheck.clippedInFirstView === 0, JSON.stringify(firstViewportCheck));
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(200);
const trueEndCheck = await page.evaluate(() => {
  const navTop = document.querySelector('.bottom-nav').getBoundingClientRect().top;
  const all = [...document.querySelectorAll('.dash-grid .card, .today-banner')];
  const last = all[all.length - 1];
  const r = last.getBoundingClientRect();
  return { hiddenPx: Math.max(0, r.bottom - navTop) };
});
log('H. after scrolling to the true end, last content is fully clear of the bottom nav', trueEndCheck.hiddenPx === 0, JSON.stringify(trueEndCheck));
await page.screenshot({ path: `${OUT}/mobile-390-bottomnav-check.png` });

// ============================================================
// I. Dark theme
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await sleep(200);
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
await sleep(200);
const inviteEvtDark = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.dash-grid .card')];
  const activityCard = cards.find((c) => c.textContent.includes('Family activity'));
  const row = activityCard ? [...activityCard.querySelectorAll('.row-item')].find((r) => r.textContent.includes('invite code')) : null;
  return row ? getComputedStyle(row.querySelector('.timeline-icon')).color : null;
});
log('I. dark: invite_code_changed icon uses the dark Warmth value', inviteEvtDark && rgbToHex(inviteEvtDark).toLowerCase() === '#d99a6c', inviteEvtDark && rgbToHex(inviteEvtDark));
for (const w of [320, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`I. dark ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/dark-${w}-dashboard.png`, fullPage: w >= 768 });
}

// ============================================================
// J. Regression: Tasks + BillSense + Timeline + Family unaffected
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { location.hash = '#/tasks'; });
await sleep(400);
const tasksHeadingColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('J. Tasks unaffected', !rgbToHex(tasksHeadingColor).toLowerCase().includes('96502a'), rgbToHex(tasksHeadingColor));
await page.evaluate(() => { location.hash = '#/billsense'; });
await sleep(400);
const billsenseColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('J. BillSense Money accent unaffected', rgbToHex(billsenseColor).toLowerCase() === '#5fb3a3', rgbToHex(billsenseColor));
await page.evaluate(() => { location.hash = '#/timeline'; });
await sleep(400);
const timelineFont = await page.locator('.timeline-day-label').first().evaluate((e) => getComputedStyle(e).fontFamily);
log('J. Timeline unaffected', timelineFont.toLowerCase().includes('fraunces'), timelineFont);
await page.evaluate(() => { location.hash = '#/family'; });
await sleep(400);
const familyTabColor = await page.locator('.tab.active').evaluate((e) => getComputedStyle(e).color);
log('J. Family unaffected', rgbToHex(familyTabColor).toLowerCase() === '#d99a6c', rgbToHex(familyTabColor));

console.log('\nconsole/page errors (deduped):', [...new Set(consoleErrors)]);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill();
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
