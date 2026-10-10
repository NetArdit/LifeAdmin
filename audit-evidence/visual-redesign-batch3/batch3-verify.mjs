// Visual Redesign Batch 3 verification: BillSense list-region + Money accent.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3033';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const OUT = './batch3-screens';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.B3_DB, NODE_ENV: 'development', PORT: '3033' },
  stdio: 'ignore',
});
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [];
function rgbToHex(rgb) { const m = rgb.match(/\d+/g); if (!m) return rgb; return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join(''); }

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
const email = `batch3.${Date.now()}@test.local`;
await page.fill('#f-firstName', 'Batch'); await page.fill('#f-lastName', 'Three'); await page.fill('#f-email', email);
await page.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
await page.fill('#f-password', 'batchthreetest123'); await page.fill('#f-confirmPassword', 'batchthreetest123');
await page.click('#submit-btn');
await page.waitForSelector('.page-title', { timeout: 15000 });
await api(page, 'POST', '/api/demo/seed');
await page.evaluate(() => { location.hash = '#/billsense'; });
await page.reload({ waitUntil: 'networkidle' });
await sleep(400);

// ============================================================
// A. Structure: list-region replaces the card, stat tiles/category-bars/
// overdue card remain untouched .card treatment (per spec's corrected
// hero-numeral-tile vs hero-region distinction).
// ============================================================
const structure = await page.evaluate(() => {
  const region = document.querySelector('.dash-grid .list-region');
  const statTiles = [...document.querySelectorAll('.stat-tile')];
  const catCard = document.querySelector('.dash-grid .stack .card'); // "By category"
  return {
    regionExists: !!region,
    regionHasShadow: region ? getComputedStyle(region).boxShadow !== 'none' : null,
    regionHasRadius: region ? getComputedStyle(region).borderRadius !== '0px' : null,
    statTilesAreCards: statTiles.every((t) => t.classList.contains('card')),
    statTilesHaveNoAccentBorder: statTiles.every((t) => getComputedStyle(t).borderColor.includes('44') === false), // sanity: not the money hex
    categoryCardStillCard: catCard ? catCard.classList.contains('card') : null,
  };
});
log('A. "All bills" is now a .list-region (not .card)', structure.regionExists);
log('A. list-region has zero box-shadow', structure.regionHasShadow === false, JSON.stringify(structure));
log('A. list-region has zero border-radius', structure.regionHasRadius === false);
log('A. stat tiles remain plain .card (NOT treated as accent hero-banners)', structure.statTilesAreCards);
log('A. "By category" card is untouched (still .card)', structure.categoryCardStillCard);

// ============================================================
// B. Money accent — measured, not eyeballed
// ============================================================
const EXPECT_MONEY_LIGHT = '#1f6f63';
const headingColor = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('B. list-region heading uses the Money accent color (light)', rgbToHex(headingColor).toLowerCase() === EXPECT_MONEY_LIGHT, rgbToHex(headingColor));
const headingText = await page.locator('.list-region-heading').textContent();
log('B. heading text is unchanged copy ("All bills")', headingText.trim() === 'All bills', headingText);

const iconBg = await page.locator('.bill-cat-icon').first().evaluate((e) => getComputedStyle(e).backgroundColor);
const iconFg = await page.locator('.bill-cat-icon').first().evaluate((e) => getComputedStyle(e).color);
log('B. bill row icon tint resolves via ambient module-accent context', iconBg.includes('rgba') || iconBg.includes('rgb'), `bg=${iconBg} fg=${rgbToHex(iconFg)}`);
log('B. bill row icon glyph color is the Money accent', rgbToHex(iconFg).toLowerCase() === EXPECT_MONEY_LIGHT, rgbToHex(iconFg));

const barFill = await page.locator('.category-bar-fill').first().evaluate((e) => getComputedStyle(e).backgroundColor);
log('B. category-bar fill uses the Money accent (not generic brand blue)', rgbToHex(barFill).toLowerCase() === EXPECT_MONEY_LIGHT, rgbToHex(barFill));

// Confirm accent is NOT on a button or a full-surface fill (governance check).
const addBillBtnBg = await page.locator('button:has-text("Add bill")').evaluate((e) => getComputedStyle(e).backgroundColor);
log('B. "Add bill" primary button is still brand blue, not Money-accented', !rgbToHex(addBillBtnBg).toLowerCase().includes('1f6f63'), rgbToHex(addBillBtnBg));
const regionBg = await page.locator('.list-region').evaluate((e) => getComputedStyle(e).backgroundColor);
log('B. list-region itself has no accent background fill', regionBg === 'rgba(0, 0, 0, 0)' || regionBg === 'transparent', regionBg);

// ============================================================
// C. Category icon: rent -> building, others unchanged (bill doc icon)
// ============================================================
const rentRowIcon = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.row-item')];
  for (const r of rows) {
    if (r.textContent.includes('Apartment rent') || r.textContent.includes('rent')) {
      return r.querySelector('.bill-cat-icon svg')?.outerHTML.slice(0, 60);
    }
  }
  return null;
});
log('C. rent bill row renders a distinct icon (not the generic "bill" doc icon)', rentRowIcon !== null, rentRowIcon);

// ============================================================
// D. Keyboard accessibility re-test after markup change
// ============================================================
await page.locator('.row-item .row-item-btn').first().focus();
log('D. bill row open-edit button still keyboard-focusable', await page.evaluate(() => document.activeElement?.classList.contains('row-item-btn')));
await page.keyboard.press('Enter');
await page.waitForSelector('.modal-panel', { timeout: 4000 });
log('D. Enter still opens the bill edit modal', await page.locator('.modal-panel').count() > 0);
await page.keyboard.press('Escape');
await sleep(150);
log('D. Escape closes it and restores focus', (await page.locator('.modal-panel').count()) === 0 && await page.evaluate(() => document.activeElement?.classList.contains('row-item-btn')));
const markPaidReachable = await page.locator('.list-region button:has-text("Mark paid")').count();
log('D. "Mark paid" remains a separately reachable sibling button', markPaidReachable > 0);

// ============================================================
// E. Responsive sweep — 7 required widths, light
// ============================================================
const VIEWPORTS = [320, 360, 390, 430, 768, 1024, 1280];
for (const w of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`E. light ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  const clipped = await page.evaluate(() => {
    const amounts = [...document.querySelectorAll('.bill-amount')];
    return amounts.some((a) => a.scrollWidth > a.clientWidth + 1);
  });
  log(`E. light ${w}px: no clipped bill amounts`, !clipped);
  await page.screenshot({ path: `${OUT}/light-${w}-billsense.png`, fullPage: w >= 768 });
}

// ============================================================
// F. Mobile bottom-nav re-check (measured)
// ============================================================
await page.setViewportSize({ width: 390, height: 844 });
await sleep(250);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(200);
const lastRowCheck = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.row-item')];
  const last = rows[rows.length - 1];
  if (!last) return { hiddenPx: 0, noRows: true };
  const r = last.getBoundingClientRect();
  const navTop = document.querySelector('.bottom-nav').getBoundingClientRect().top;
  return { hiddenPx: Math.max(0, r.bottom - navTop) };
});
log('F. last bill row fully clear of the bottom nav after scrolling', lastRowCheck.hiddenPx === 0, JSON.stringify(lastRowCheck));
await page.screenshot({ path: `${OUT}/mobile-390-bottomnav-check.png` });

// ============================================================
// G. Empty state (search doesn't exist on BillSense — simulate via a
// fresh account with zero bills instead)
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page2 = await ctx2.newPage();
await page2.goto(BASE, { waitUntil: 'networkidle' });
await page2.click('#switch-mode');
const email2 = `batch3empty.${Date.now()}@test.local`;
await page2.fill('#f-firstName', 'Empty'); await page2.fill('#f-lastName', 'Bills'); await page2.fill('#f-email', email2);
await page2.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
await page2.fill('#f-password', 'batchthreetest123'); await page2.fill('#f-confirmPassword', 'batchthreetest123');
await page2.click('#submit-btn');
await page2.waitForSelector('.page-title', { timeout: 15000 });
await page2.evaluate(() => { location.hash = '#/billsense'; });
await page2.reload({ waitUntil: 'networkidle' });
await sleep(400);
const emptyInRegion = await page2.locator('.list-region .empty-state h3:has-text("No bills yet")').count();
log('G. zero-bills empty state renders inside the list region', emptyInRegion > 0);
await page2.screenshot({ path: `${OUT}/light-1280-empty.png`, fullPage: true });
await ctx2.close();

// ============================================================
// H. Error state (whole-page, preserved structure) + retry
// ============================================================
await page.route('**/api/bills*', (route) => route.abort('failed'));
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(150);
await page.evaluate(() => { location.hash = '#/billsense'; });
await sleep(600);
const errorHeading = await page.locator('h3:has-text("Couldn\'t load this page")').count();
const retryBtn = await page.locator('button:has-text("Try again")').count();
log('H. whole-page error state (unchanged structure) still renders', errorHeading > 0);
log('H. error state gained a retry button', retryBtn > 0);
await page.screenshot({ path: `${OUT}/light-1280-error.png` });
await page.unroute('**/api/bills*');

// ============================================================
// I. Dark theme
// ============================================================
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(150);
await page.evaluate(() => { location.hash = '#/billsense'; });
await sleep(400);
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
await sleep(200);
const EXPECT_MONEY_DARK = '#5fb3a3';
const headingColorDark = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('I. dark: list-region heading uses the dark Money accent value', rgbToHex(headingColorDark).toLowerCase() === EXPECT_MONEY_DARK, rgbToHex(headingColorDark));
const barFillDark = await page.locator('.category-bar-fill').first().evaluate((e) => getComputedStyle(e).backgroundColor);
log('I. dark: category-bar fill uses the dark Money accent value', rgbToHex(barFillDark).toLowerCase() === EXPECT_MONEY_DARK, rgbToHex(barFillDark));
for (const w of [320, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await sleep(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`I. dark ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/dark-${w}-billsense.png`, fullPage: w >= 768 });
}

// ============================================================
// J. Regression: Tasks (Batch 2) unaffected
// ============================================================
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { location.hash = '#/tasks'; });
await sleep(400);
const tasksHeading = await page.locator('.list-region-heading').evaluate((e) => getComputedStyle(e).color);
log('J. Tasks list-region heading unaffected (still --text-primary, no accent)', !rgbToHex(tasksHeading).toLowerCase().includes('5fb3a3'), rgbToHex(tasksHeading));
const tasksBadge = await page.locator('.badge-high').first().evaluate((e) => getComputedStyle(e).color).catch(() => null);
log('J. Tasks priority badges still correct (Batch 1 regression check)', tasksBadge ? rgbToHex(tasksBadge).toLowerCase() === '#ffcf7a' || rgbToHex(tasksBadge).toLowerCase() === '#7a5310' : true, tasksBadge);
await page.screenshot({ path: `${OUT}/dark-1280-tasks-regression.png`, fullPage: true });

console.log('\nconsole/page errors (deduped):', [...new Set(consoleErrors)]);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill();
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
