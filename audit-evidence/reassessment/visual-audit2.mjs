import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const SHOT = './screenshots-visual2';
fs.mkdirSync(SHOT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, LIFEADMIN_DB_PATH: process.env.VDB2, NODE_ENV: 'development', PORT: '3001' }, stdio: 'ignore' });
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.click('#switch-mode');
await page.fill('#f-firstName', 'Scroll'); await page.fill('#f-lastName', 'Check'); await page.fill('#f-email', `scroll.${Date.now()}@test.local`);
await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
await page.fill('#f-password', 'scrollcheck123'); await page.fill('#f-confirmPassword', 'scrollcheck123');
await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });
await page.evaluate(async () => { await fetch('/api/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); });
await page.reload({ waitUntil: 'networkidle' });
await page.screenshot({ path: `${SHOT}/viewport-top.png` });
// find the bottom nav's bounding box and the last visible task row before it
const navBox = await page.locator('.bottom-nav').boundingBox();
console.log('bottom nav box:', JSON.stringify(navBox));
await page.mouse.wheel(0, 400);
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT}/viewport-scrolled-mid.png` });
const overlap = await page.evaluate(() => {
  const nav = document.querySelector('.bottom-nav');
  const navRect = nav.getBoundingClientRect();
  const rows = [...document.querySelectorAll('.row-item, .card')];
  const covered = rows.filter((r) => {
    const rect = r.getBoundingClientRect();
    return rect.bottom > navRect.top && rect.top < navRect.bottom && rect.width > 0;
  }).map((r) => r.textContent.trim().slice(0, 40));
  const scroller = document.scrollingElement;
  return { navRect: { top: navRect.top, bottom: navRect.bottom, height: navRect.height }, coveredCount: covered.length, covered, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight, scrollTop: scroller.scrollTop, atBottom: scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2 };
});
console.log('overlap check mid-scroll:', JSON.stringify(overlap, null, 2));
await page.mouse.wheel(0, 5000);
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOT}/viewport-scrolled-bottom.png` });
const overlapBottom = await page.evaluate(() => {
  const nav = document.querySelector('.bottom-nav');
  const navRect = nav.getBoundingClientRect();
  const rows = [...document.querySelectorAll('.row-item, .card')];
  const covered = rows.filter((r) => {
    const rect = r.getBoundingClientRect();
    return rect.bottom > navRect.top && rect.top < navRect.bottom && rect.width > 0;
  }).map((r) => r.textContent.trim().slice(0, 60));
  const scroller = document.scrollingElement;
  return { coveredCount: covered.length, covered, atBottom: scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2, scrollTop: scroller.scrollTop, scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight };
});
console.log('overlap check at true bottom:', JSON.stringify(overlapBottom, null, 2));
srv.kill(); await browser.close(); process.exit(0);
