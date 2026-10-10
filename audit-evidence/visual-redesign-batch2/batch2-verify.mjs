// Visual Redesign Batch 2 verification: Tasks list-region proof-of-concept.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3032';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const OUT = './batch2-screens';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.B2_DB, NODE_ENV: 'development', PORT: '3032' },
  stdio: 'ignore',
});
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [];

async function api(page, method, path, body) {
  return page.evaluate(async ({ method, path, body }) => {
    const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status };
  }, { method, path, body });
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.click('#switch-mode');
const email = `batch2.${Date.now()}@test.local`;
await page.fill('#f-firstName', 'Batch'); await page.fill('#f-lastName', 'Two'); await page.fill('#f-email', email);
await page.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
await page.fill('#f-password', 'batchtwotest123'); await page.fill('#f-confirmPassword', 'batchtwotest123');
await page.click('#submit-btn');
await page.waitForSelector('.page-title', { timeout: 15000 });
await api(page, 'POST', '/api/demo/seed');

// ============================================================
// A. list-region-heading font shorthand actually resolves correctly
// ============================================================
await page.evaluate(() => { location.hash = '#/tasks'; });
await page.reload({ waitUntil: 'networkidle' });
await sleep(300);
const headingStyle = await page.evaluate(() => {
  const el = document.querySelector('.list-region-heading');
  const cs = getComputedStyle(el);
  return { fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, fontSize: cs.fontSize, text: el.textContent };
});
log('A. .list-region-heading uses Fraunces (the --type-section-label token resolves)', headingStyle.fontFamily.toLowerCase().includes('fraunces'), JSON.stringify(headingStyle));
log('A. heading weight resolves to 560 (variable-weight font shorthand works)', headingStyle.fontWeight === '560', `got ${headingStyle.fontWeight}`);
log('A. heading text shows the live, filter-aware count', /^\d+ tasks?$/.test(headingStyle.text), `got "${headingStyle.text}"`);

// ============================================================
// B. Visual structure: no .card wrapper left around the list
// ============================================================
const structure = await page.evaluate(() => {
  const region = document.querySelector('.list-region');
  return {
    regionExists: !!region,
    regionIsCard: region ? region.classList.contains('card') : null,
    regionHasBoxShadow: region ? getComputedStyle(region).boxShadow !== 'none' : null,
    regionBorderRadius: region ? getComputedStyle(region).borderRadius : null,
  };
});
log('B. .list-region exists and replaces the old .card wrapper', structure.regionExists && !structure.regionIsCard);
log('B. .list-region has zero box-shadow (per spec)', structure.regionHasBoxShadow === false, JSON.stringify(structure));
log('B. .list-region has zero border-radius (per spec)', structure.regionBorderRadius === '0px', structure.regionBorderRadius);

// ============================================================
// C. Filter-aware count updates correctly (functional, not just visual)
// ============================================================
const allCount = await page.locator('.list-region-heading').textContent();
await page.click('.pill:has-text("Overdue")');
await sleep(400);
const overdueCount = await page.locator('.list-region-heading').textContent();
log('C. heading count changes when a filter pill is applied', allCount !== overdueCount, `all="${allCount}" overdue="${overdueCount}"`);
await page.click('.pill:has-text("Overdue")'); // toggle back off
await sleep(400);

// ============================================================
// D. Keyboard accessibility re-verified after markup change
// ============================================================
await page.locator('.row-item .row-item-btn').first().focus();
log('D. task row open-button still keyboard-focusable', await page.evaluate(() => document.activeElement?.classList.contains('row-item-btn')));
await page.keyboard.press('Enter');
await page.waitForSelector('.modal-panel', { timeout: 4000 });
log('D. Enter still opens the task detail modal', await page.locator('.modal-panel').count() > 0);
await page.keyboard.press('Escape');
await sleep(150);
log('D. Escape closes it and restores focus', (await page.locator('.modal-panel').count()) === 0 && await page.evaluate(() => document.activeElement?.classList.contains('row-item-btn')));
await page.keyboard.press('Shift+Tab');
log('D. Shift+Tab from the row button still reaches the sibling checkbox', await page.evaluate(() => document.activeElement?.classList.contains('row-check')));
await page.keyboard.press(' ');
await sleep(250);
const checkedAfterSpace = await page.evaluate(() => document.querySelector('.row-check')?.classList.contains('checked'));
log('D. Space on checkbox still toggles complete without opening the modal', checkedAfterSpace && (await page.locator('.modal-panel').count()) === 0);
// revert the toggle so seeded data stays consistent for later checks
await page.keyboard.press(' ');
await sleep(250);

// ============================================================
// E. Regression: priority badges still use Batch-1 corrected tokens
// ============================================================
const badgeColor = await page.locator('.badge-critical').first().evaluate((e) => getComputedStyle(e).color);
function rgbToHex(rgb) { const m = rgb.match(/\d+/g); return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join(''); }
log('E. CRITICAL badge still renders the Batch 1 corrected text color', rgbToHex(badgeColor).toLowerCase() === '#8f2c24', rgbToHex(badgeColor));

// ============================================================
// F. Responsive sweep — 7 required viewports, light theme
// ============================================================
const VIEWPORTS = [320, 360, 390, 430, 768, 1024, 1280];
for (const w of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`F. light ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  const clipped = await page.evaluate(() => {
    const titles = [...document.querySelectorAll('.row-title')];
    return titles.some((t) => t.scrollWidth > t.clientWidth + 1 && t.textContent.length < 40); // a short title still overflowing its own box would be a real clip, not intentional ellipsis on a long one
  });
  log(`F. light ${w}px: no unexpectedly clipped short task titles`, !clipped);
  await page.screenshot({ path: `${OUT}/light-${w}-tasks.png`, fullPage: w >= 768 });
}

// ============================================================
// G. Mobile bottom-nav occlusion re-check (measured, not eyeballed) —
// the exact methodology from the pre-redesign visual audit, re-run against
// the new list-region layout specifically because removing the card's
// padding changes how much content fits in the first viewport.
// ============================================================
await page.setViewportSize({ width: 390, height: 844 });
await sleep(250);
const navBox = await page.locator('.bottom-nav').boundingBox();
const lastRow = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.row-item')];
  const last = rows[rows.length - 1];
  if (!last) return null;
  const r = last.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom };
});
console.log('nav box:', JSON.stringify(navBox), 'last visible row (pre-scroll) bottom:', lastRow?.bottom);
const pagePaddingBottom = await page.evaluate(() => getComputedStyle(document.querySelector('.page')).paddingBottom);
log('G. .page still reserves bottom padding for the fixed nav (unchanged mechanism)', pagePaddingBottom !== '0px', pagePaddingBottom);
// Scroll to the true end and confirm every row is fully reachable.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(200);
const lastRowAfterScroll = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.row-item')];
  const last = rows[rows.length - 1];
  const r = last.getBoundingClientRect();
  const navEl = document.querySelector('.bottom-nav');
  const navTop = navEl.getBoundingClientRect().top;
  return { bottom: r.bottom, navTop, hiddenPx: Math.max(0, r.bottom - navTop) };
});
log('G. after scrolling to the end, the last task row is fully clear of the bottom nav', lastRowAfterScroll.hiddenPx === 0, JSON.stringify(lastRowAfterScroll));
await page.screenshot({ path: `${OUT}/mobile-390-bottomnav-check.png` });

// ============================================================
// H. Empty state (filtered to something with zero matches) — light
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await page.fill('.filter-bar input', 'zzz-no-such-task-zzz');
await sleep(500);
const emptyVisible = await page.locator('.list-region .empty-state h3:has-text("No tasks here")').count();
log('H. filtered-to-nothing shows the empty state inside the list region', emptyVisible > 0);
await page.screenshot({ path: `${OUT}/light-1280-empty.png` });
await page.fill('.filter-bar input', '');
await sleep(500);

// ============================================================
// I. Error state (abort the API) — light
// ============================================================
await page.route('**/api/tasks*', (route) => route.abort('failed'));
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(150);
await page.evaluate(() => { location.hash = '#/tasks'; });
await sleep(600);
const errorVisible = await page.locator('.list-region .empty-state h3:has-text("Couldn\'t load your tasks")').count();
const retryVisible = await page.locator('.list-region button:has-text("Try again")').count();
log('I. error state renders inside the list region with a retry button', errorVisible > 0 && retryVisible > 0);
await page.screenshot({ path: `${OUT}/light-1280-error.png` });
await page.unroute('**/api/tasks*');
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(150);
await page.evaluate(() => { location.hash = '#/tasks'; });
await sleep(500);

// ============================================================
// J. Dark theme — same responsive sweep + populated screenshot
// ============================================================
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
await sleep(200);
for (const w of [320, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`J. dark ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/dark-${w}-tasks.png`, fullPage: w >= 768 });
}
const darkHeadingColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('J. dark: list-region heading text uses the theme text color (not hardcoded)', darkHeadingColor.includes('241') || darkHeadingColor.includes('240'), darkHeadingColor);

// ============================================================
// K. Regression: an untouched page (BillSense) still uses .card unchanged
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { location.hash = '#/billsense'; });
await sleep(300);
const billsenseStillCard = await page.evaluate(() => !!document.querySelector('.dash-grid .card'));
log('K. BillSense untouched — still uses .card, no list-region bleed-through', billsenseStillCard);
await page.screenshot({ path: `${OUT}/dark-1280-billsense-untouched.png`, fullPage: true });

console.log('\nconsole/page errors (deduped):', [...new Set(consoleErrors)]);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill();
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
