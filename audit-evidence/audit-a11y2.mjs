// FINAL AUDIT follow-up: axe contrast details, keyboard-inoperable clickable elements, label association, tab key order.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, LIFEADMIN_DB_PATH: process.env.AUDIT_DB, NODE_ENV: 'development', PORT: '3001' }, stdio: 'ignore' });
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const axeSrc = await (await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js')).text();
const api = (page, path, method = 'GET', body) => page.evaluate(async ([p, m, b]) => {
  const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}, [path, method, body]);

try {
  const pagesList = [['dashboard', '#/dashboard'], ['tasks', '#/tasks'], ['family', '#/family'], ['billsense', '#/billsense'], ['goals', '#/goals'], ['ecolife', '#/ecolife'], ['timeline', '#/timeline'], ['decisionflow', '#/decisionflow'], ['assistant', '#/assistant'], ['settings', '#/settings']];
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.click('#switch-mode');
    await page.fill('#f-firstName', 'A11y'); await page.fill('#f-lastName', 'Probe'); await page.fill('#f-email', `a11y.${scheme}.${Date.now()}@test.local`);
    await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
    await page.fill('#f-password', 'auditpass12345'); await page.fill('#f-confirmPassword', 'auditpass12345');
    await page.click('#submit-btn'); await page.waitForSelector('.page-title');
    await api(page, '/api/demo/seed', 'POST', {});
    const contrast = new Map();
    const clickable = new Map();
    for (const [name, hash] of pagesList) {
      await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(800);
      await page.evaluate(axeSrc);
      const res = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: ['color-contrast'] });
        return r.violations.flatMap((v) => v.nodes.map((n) => { const d = n.any[0] && n.any[0].data || {}; return { sel: n.target.join(' ').slice(0, 70), fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, size: d.fontSize, text: (n.html || '').replace(/<[^>]+>/g, '').slice(0, 30) || (n.html || '').slice(0, 60) }; }));
      });
      for (const v of res) { const k = `${v.sel}|${v.fg}|${v.bg}|${v.ratio}`; if (!contrast.has(k)) contrast.set(k, { ...v, pages: [] }); contrast.get(k).pages.push(name); }
      const clk = await page.evaluate(() => {
        const bad = [];
        const focusable = (el) => el.matches('a[href],button,input,select,textarea,summary,[tabindex],[role=button],[role=tab],[role=link]') || el.closest('a[href],button,label') || el.querySelector('a[href],button,input,select,textarea');
        for (const el of document.querySelectorAll('#page-root *, #modal-root *')) {
          const cs = getComputedStyle(el);
          if (cs.cursor === 'pointer' && el.offsetParent !== null && !focusable(el)) bad.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.')}`);
        }
        return [...new Set(bad)];
      });
      for (const c of clk) { const k = c; if (!clickable.has(k)) clickable.set(k, []); clickable.get(k).push(name); }
    }
    console.log(`\n===== ${scheme.toUpperCase()}: distinct contrast failures (${contrast.size}) =====`);
    for (const v of [...contrast.values()].slice(0, 30)) console.log(`  ratio ${v.ratio} fg ${v.fg} on bg ${v.bg} size ${v.size} — ${v.sel} "${v.text}" [${[...new Set(v.pages)].join(',')}]`);
    console.log(`===== ${scheme.toUpperCase()}: mouse-clickable elements that are NOT keyboard-focusable =====`);
    for (const [k, v] of clickable) console.log(`  ${k}  on: ${[...new Set(v)].join(',')}`);
    if (scheme === 'light') {
      // real keyboard test on Family tabs
      await page.evaluate(() => { location.hash = '#/family'; }); await page.waitForSelector('.tab');
      await page.focus('body'); await page.evaluate(() => document.activeElement && document.activeElement.blur());
      const seq = [];
      for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); seq.push(await page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}${a.className ? '.' + a.className.toString().split(' ')[0] : ''}:${(a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 14)}` : 'none'; })); }
      console.log('Tab order on Family page (25 presses):', seq.join(' > '));
      const tabFocused = seq.some((s) => s.startsWith('div.tab'));
      console.log('Family tab strip reachable by keyboard:', tabFocused);
      // labels
      const labels = await page.evaluate(async () => { const out = []; document.querySelectorAll('.field-label').forEach((l) => out.push(!!l.htmlFor || !!l.querySelector('input,select,textarea'))); return { total: out.length, associated: out.filter(Boolean).length }; });
      console.log('Family page labels associated:', JSON.stringify(labels));
      await page.evaluate(() => { location.hash = '#/tasks'; }); await page.waitForTimeout(500);
      await page.click('button:has-text("New task")'); await page.waitForSelector('#task-form');
      const tl = await page.evaluate(() => { const out = []; document.querySelectorAll('#task-form .field-label').forEach((l) => out.push({ text: l.textContent.trim().slice(0, 18), associated: !!l.htmlFor || !!l.querySelector('input,select,textarea') })); return out; });
      console.log('Task form labels:', JSON.stringify(tl));
      await page.keyboard.press('Escape');
    }
    await ctx.close();
  }
} catch (e) { console.log('ERROR', e.stack.split('\n').slice(0, 4).join(' | ')); }
srv.kill(); await browser.close(); process.exit(0);
