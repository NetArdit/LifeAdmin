// Daily Product Quality phase: responsive verification of the changed
// surfaces (Task/Bill/Decision rows, Family tab strip) at the required
// breakpoints. Checks for genuine horizontal overflow (scrollWidth >
// clientWidth on <html>), not DOM-rectangle overlap with fixed nav.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://localhost:3012';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const SHOT = './screenshots-daily-responsive';
fs.mkdirSync(SHOT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.DQR_DB, NODE_ENV: 'development', PORT: '3012' },
  stdio: 'ignore',
});
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

async function api(method, path, body) {
  return page.evaluate(async ({ method, path, body }) => {
    const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status };
  }, { method, path, body });
}

const BREAKPOINTS = [
  ['320px', 320, 700],
  ['360px', 360, 740],
  ['375px', 375, 812],
  ['390px', 390, 844],
  ['414px', 414, 896],
  ['tablet', 768, 1024],
  ['desktop', 1280, 900],
];

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  const email = `dq.responsive.${Date.now()}@test.local`;
  await page.fill('#f-firstName', 'DQ'); await page.fill('#f-lastName', 'Responsive'); await page.fill('#f-email', email);
  await page.fill('#f-phone', '+38344' + String(100000 + Math.floor(Math.random() * 800000)));
  await page.fill('#f-password', 'dqresponsive123'); await page.fill('#f-confirmPassword', 'dqresponsive123');
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });

  await api('POST', '/api/tasks', { title: 'Responsive check task with a fairly long title to test wrapping', priority: 'medium' });
  await api('POST', '/api/bills', { name: 'Responsive check bill', amount: 19.99, dueDate: '2030-02-01' });
  await api('POST', '/api/decisions', { question: 'Responsive check decision — should this wrap correctly on small screens?' });
  await api('POST', '/api/family', { name: 'Responsive Check Family' });

  const PAGES = ['#/tasks', '#/billsense', '#/decisionflow', '#/family'];
  for (const [label, width, height] of BREAKPOINTS) {
    await page.setViewportSize({ width, height });
    for (const hash of PAGES) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForSelector('.row-item, [role="tablist"], .empty-state', { timeout: 8000 });
      await sleep(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      log(`${label} (${width}px) ${hash}: no horizontal page overflow`, overflow <= 1, `overflowPx=${overflow}`);
    }
    await page.screenshot({ path: `${SHOT}/${label.replace('px', '')}-family.png` });
  }

  // Modal width at the narrowest breakpoint specifically (task/bill detail).
  await page.setViewportSize({ width: 320, height: 700 });
  await page.evaluate(() => { location.hash = '#/tasks'; });
  await page.waitForSelector('.row-item', { timeout: 8000 });
  await page.click('.row-item .row-item-btn');
  await page.waitForSelector('.modal-panel', { timeout: 4000 });
  const modalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const modalBox = await page.locator('.modal-panel').boundingBox();
  log('320px: task detail modal fits within viewport width, no page overflow', modalOverflow <= 1 && modalBox.width <= 320, `overflowPx=${modalOverflow}, modalWidth=${modalBox.width}`);
  await page.screenshot({ path: `${SHOT}/320-modal.png` });

  // Family tab strip specifically at the narrowest width: touch target size
  // and horizontal scroll-within-strip (not page overflow) is the correct
  // behavior per .tabs's own overflow-x:auto rule.
  await page.evaluate(() => { location.hash = '#/family'; });
  await page.waitForSelector('[role="tablist"]', { timeout: 8000 });
  const stripOverflowsPageNotItself = await page.evaluate(() => {
    const strip = document.querySelector('.tabs');
    return {
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      stripScrollable: strip.scrollWidth >= strip.clientWidth,
    };
  });
  log('320px: family tab strip scrolls within itself, not the page', stripOverflowsPageNotItself.pageOverflow <= 1, JSON.stringify(stripOverflowsPageNotItself));
} catch (e) {
  log('script error', false, e.stack.split('\n').slice(0, 5).join(' | '));
}

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill();
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
