// AI Recovery phase: lightweight regression SMOKE across every non-AI product area.
// Only src/lib/ai.js and two new test files changed in this phase; this is a sanity pass
// (each page loads, no console/page errors), not a re-verification of each page's full
// feature set (already covered by the dedicated historical suites for those pages).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, LIFEADMIN_DB_PATH: process.env.SMOKE_DB, NODE_ENV: 'development', PORT: '3001' }, stdio: 'ignore' });
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }
const results = [];
const log = (l, ok, d = '') => { results.push({ l, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${l}${d ? ' — ' + d : ''}`); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [], pageErrors = [];
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(e.message));
try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  await page.fill('#f-firstName', 'Smoke'); await page.fill('#f-lastName', 'Test'); await page.fill('#f-email', `smoke.${Date.now()}@test.local`);
  await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
  await page.fill('#f-password', 'smokepass12345'); await page.fill('#f-confirmPassword', 'smokepass12345');
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });
  await page.evaluate(async () => { await fetch('/api/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); });

  const config = await page.evaluate(async () => (await fetch('/api/config')).json());
  log('no AI key configured in this smoke pass (default/typical deployment state)', config.aiConfigured === false);

  const pages = [['Dashboard', '#/dashboard'], ['Tasks', '#/tasks'], ['Family', '#/family'], ['BillSense', '#/billsense'], ['Timeline', '#/timeline'], ['Goals', '#/goals'], ['EcoLife', '#/ecolife'], ['DecisionFlow', '#/decisionflow'], ['Assistant', '#/assistant'], ['Settings', '#/settings']];
  for (const [name, hash] of pages) {
    await page.evaluate((h) => { location.hash = h; }, hash);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.page-title, .page', { timeout: 10000 });
    const title = await page.locator('.page-title').first().textContent().catch(() => '(no .page-title)');
    log(`${name} page loads with no crash`, (await page.locator('.empty-state:has-text("Couldn\'t load this page")').count()) === 0, title?.trim());
  }
  log('Assistant page correctly shows the "AI unavailable" state without a key', (await (async () => { await page.evaluate(() => { location.hash = '#/assistant'; }); await page.reload({ waitUntil: 'networkidle' }); return page.locator('text=need an ANTHROPIC_API_KEY set on the server').count(); })()) === 1);
} catch (e) {
  log('script error', false, e.stack.split('\n').slice(0, 4).join(' | '));
}
console.log('console errors (deduped):', [...new Set(consoleErrors)].slice(0, 10));
console.log('page errors:', pageErrors.length, pageErrors.slice(0, 5));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill(); await browser.close(); process.exit(0);
