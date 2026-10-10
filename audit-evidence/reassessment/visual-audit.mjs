import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const SHOT = './screenshots-visual';
fs.mkdirSync(SHOT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, LIFEADMIN_DB_PATH: process.env.VDB, NODE_ENV: 'development', PORT: '3001' }, stdio: 'ignore' });
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }
const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function run(scheme, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 900 : 1000 }, colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  await page.fill('#f-firstName', 'Design'); await page.fill('#f-lastName', 'Audit'); await page.fill('#f-email', `visual.${scheme}.${width}.${Date.now()}@test.local`);
  await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
  await page.fill('#f-password', 'visualaudit123'); await page.fill('#f-confirmPassword', 'visualaudit123');
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });
  await page.evaluate(async () => { await fetch('/api/demo/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); });
  const pages = [['dashboard', '#/dashboard'], ['tasks', '#/tasks'], ['family', '#/family'], ['billsense', '#/billsense'], ['goals', '#/goals'], ['ecolife', '#/ecolife'], ['timeline', '#/timeline'], ['decisionflow', '#/decisionflow'], ['assistant', '#/assistant'], ['settings', '#/settings']];
  for (const [name, hash] of pages) {
    await page.evaluate((h) => { location.hash = h; }, hash);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOT}/${scheme}-${width}-${name}.png`, fullPage: width >= 768 ? false : true });
  }
  // a modal, an empty state (new demo-free account not needed, reuse existing) and the login screen
  await page.evaluate(() => { location.hash = '#/tasks'; });
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('button:has-text("New task")');
  await page.waitForSelector('#task-form');
  await page.screenshot({ path: `${SHOT}/${scheme}-${width}-modal-task.png` });
  await ctx.close();
}
await run('light', 1280);
await run('dark', 1280);
await run('light', 375);
await run('dark', 375);
// login screen alone
for (const [scheme, width] of [['light', 375], ['dark', 1280]]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${SHOT}/${scheme}-${width}-login.png`, fullPage: true });
  await ctx.close();
}
console.log('done');
srv.kill(); await browser.close(); process.exit(0);
