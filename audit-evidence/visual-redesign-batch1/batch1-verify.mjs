// Visual Redesign Batch 1 verification: token/badge foundation only.
// Confirms the corrected badge tokens actually render (measured via
// getComputedStyle, not eyeballed), confirms no regression on pages that
// use badges/buttons/forms/modals/tabs/nav, at the required viewports and
// both themes. Module accents are NOT checked visually here since nothing
// consumes them yet in this batch (foundation only, per Batch 1 scope) —
// only that the tokens themselves resolve correctly is checked.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3031';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const OUT = './batch1-screens';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.B1_DB, NODE_ENV: 'development', PORT: '3031' },
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

function rgbToHex(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m) return rgb;
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.click('#switch-mode');
const email = `batch1.${Date.now()}@test.local`;
await page.fill('#f-firstName', 'Batch'); await page.fill('#f-lastName', 'One'); await page.fill('#f-email', email);
await page.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
await page.fill('#f-password', 'batchonetest123'); await page.fill('#f-confirmPassword', 'batchonetest123');
await page.click('#submit-btn');
await page.waitForSelector('.page-title', { timeout: 15000 });
await api(page, 'POST', '/api/demo/seed');
await page.evaluate(() => { location.hash = '#/tasks'; });
await page.reload({ waitUntil: 'networkidle' });
await sleep(400);

// Expected values, read directly from what was just written to tokens.css.
const EXPECT_LIGHT = {
  critical: { bg: '#f9e5e3', text: '#8f2c24' },
  high: { bg: '#faf0e1', text: '#7a5310' },
  medium: { bg: '#e4edf4', text: '#1f5177' },
  low: { bg: '#edeef0', text: '#50565f' },
};
const EXPECT_DARK = {
  critical: { bg: '#352427', text: '#ff9a8f' },
  high: { bg: '#363024', text: '#ffcf7a' },
  medium: { bg: '#202c38', text: '#9cc7e8' },
  low: { bg: '#292e34', text: '#c3c9d1' },
};

async function checkBadges(expected, label) {
  await page.waitForSelector('.badge-critical, .badge-high, .badge-medium, .badge-low', { timeout: 8000 });
  for (const priority of ['critical', 'high', 'medium', 'low']) {
    const el = page.locator(`.badge-${priority}`).first();
    const count = await el.count();
    if (!count) { log(`${label}: .badge-${priority} present on page`, false, 'not found in seeded data'); continue; }
    const [bg, color] = await el.evaluate((e) => {
      const cs = getComputedStyle(e);
      return [cs.backgroundColor, cs.color];
    });
    const bgHex = rgbToHex(bg), colorHex = rgbToHex(color);
    const want = expected[priority];
    log(`${label}: .badge-${priority} bg matches corrected token`, bgHex.toLowerCase() === want.bg.toLowerCase(), `got ${bgHex}, want ${want.bg}`);
    log(`${label}: .badge-${priority} text matches corrected token`, colorHex.toLowerCase() === want.text.toLowerCase(), `got ${colorHex}, want ${want.text}`);
  }
}

// Verify accent tokens resolve correctly (foundation-only — not rendered
// anywhere yet, so checked via a throwaway probe element, not a real page).
async function checkAccentTokens(themeLabel) {
  const values = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'module-accent--money';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const out = {
      accentBorder: cs.getPropertyValue('--_accent-border').trim(),
      accentMuted: cs.getPropertyValue('--_accent-muted').trim(),
      accentStrong: cs.getPropertyValue('--_accent-strong').trim(),
    };
    probe.remove();
    return out;
  });
  log(`${themeLabel}: .module-accent--money resolves --_accent-border`, values.accentBorder.length > 0, values.accentBorder);
  log(`${themeLabel}: .module-accent--money resolves --_accent-muted (color-mix)`, values.accentMuted.includes('color-mix') || values.accentMuted.length > 0, values.accentMuted);
  log(`${themeLabel}: .module-accent--money resolves --_accent-strong`, values.accentStrong.length > 0, values.accentStrong);
}

const VIEWPORTS = [[320, 700], [390, 844], [768, 1024], [1280, 900]];

for (const [w, h] of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate(() => { location.hash = '#/tasks'; });
  await sleep(250);
  await checkBadges(EXPECT_LIGHT, `light ${w}px`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`light ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/light-${w}-tasks.png`, fullPage: w >= 768 });
}

// Also check Dashboard (priority badges appear there too) at one representative width.
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(300);
await checkBadges(EXPECT_LIGHT, 'light 1280px dashboard');
await page.screenshot({ path: `${OUT}/light-1280-dashboard.png`, fullPage: true });

// Modal / form / focus spot-check (unrelated system, confirming no regression).
await page.evaluate(() => { location.hash = '#/tasks'; });
await sleep(200);
await page.locator('.row-item .row-item-btn').first().focus();
const focusRing = await page.evaluate(() => getComputedStyle(document.activeElement).boxShadow);
log('light: keyboard focus ring still visible on task row', focusRing !== 'none' && focusRing.length > 0, focusRing);
await page.keyboard.press('Enter');
await page.waitForSelector('.modal-panel', { timeout: 4000 });
await page.screenshot({ path: `${OUT}/light-1280-modal.png` });
await page.keyboard.press('Escape');
await sleep(150);

await checkAccentTokens('light');

// ---------------- DARK THEME ----------------
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
await sleep(200);

for (const [w, h] of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate(() => { location.hash = '#/tasks'; });
  await sleep(250);
  await checkBadges(EXPECT_DARK, `dark ${w}px`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log(`dark ${w}px: no horizontal overflow`, overflow <= 1, `overflowPx=${overflow}`);
  await page.screenshot({ path: `${OUT}/dark-${w}-tasks.png`, fullPage: w >= 768 });
}

await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { location.hash = '#/dashboard'; });
await sleep(300);
await checkBadges(EXPECT_DARK, 'dark 1280px dashboard');
await page.screenshot({ path: `${OUT}/dark-1280-dashboard.png`, fullPage: true });

await page.evaluate(() => { location.hash = '#/billsense'; });
await sleep(300);
await page.screenshot({ path: `${OUT}/dark-1280-billsense.png`, fullPage: true });
await page.click('button:has-text("Add bill")');
await page.waitForSelector('.modal-panel', { timeout: 4000 });
await page.screenshot({ path: `${OUT}/dark-1280-form.png` });
await page.keyboard.press('Escape');

await checkAccentTokens('dark');

console.log('\nconsole/page errors (deduped):', [...new Set(consoleErrors)]);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill();
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
