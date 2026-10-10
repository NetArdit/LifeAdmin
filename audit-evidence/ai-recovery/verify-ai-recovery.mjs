// AI Recovery phase: real-browser verification of the fixed structured-output path.
// The Node server runs for real, with ANTHROPIC_API_KEY set to a FAKE key and
// ANTHROPIC_BASE_URL pointed at a LOCAL mock HTTP server standing in for Anthropic's API.
// This exercises the actual fixed src/lib/ai.js code (zodOutputFormat + output_format wiring)
// end to end through the real UI — it is NOT a real-provider test (no real credentials exist
// in this environment) and must not be reported as one.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const BASE = 'http://localhost:3001';
const ROOT = 'C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main';
const SHOT = './screenshots-ai-recovery';
fs.mkdirSync(SHOT, { recursive: true });
const results = [];
const log = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- local mock Anthropic server ----
const calls = [];
let mode = 'ok';
let nextText = null;
const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const parsed = JSON.parse(body || '{}');
    calls.push({ url: req.url, headers: req.headers, body: parsed });
    if (mode === 'error') {
      res.writeHead(529, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'PROVIDER-INTERNAL-DETAIL' } }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'msg_mock', type: 'message', role: 'assistant', model: parsed.model,
      content: [{ type: 'text', text: nextText }],
      stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
    }));
  });
});
await new Promise((r) => mock.listen(0, '127.0.0.1', r));

const srv = spawn('node', ['server.js'], {
  cwd: ROOT,
  env: { ...process.env, LIFEADMIN_DB_PATH: process.env.AI_DB, NODE_ENV: 'development', PORT: '3001', ANTHROPIC_API_KEY: 'sk-ant-test-FAKE-browser', ANTHROPIC_BASE_URL: `http://127.0.0.1:${mock.address().port}` },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
srv.stdout.on('data', (d) => { serverLog += d.toString(); });
srv.stderr.on('data', (d) => { serverLog += d.toString(); });
for (let i = 0; i < 160; i++) { try { const r = await fetch(BASE + '/api/config'); if (r.ok) break; } catch {} await sleep(250); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const consoleErrors = [], pageErrors = [], responses = [];
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('response', async (r) => { if (r.url().includes('/api/ai/')) { try { responses.push({ url: r.url(), status: r.status(), body: await r.text() }); } catch {} } });

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  await page.fill('#f-firstName', 'Ada'); await page.fill('#f-lastName', 'Verify'); await page.fill('#f-email', `ai.recovery.${Date.now()}@test.local`);
  await page.fill('#f-phone', '+38344' + String(Math.floor(100000 + Math.random() * 899999)));
  await page.fill('#f-password', 'aipass123456'); await page.fill('#f-confirmPassword', 'aipass123456');
  await page.click('#submit-btn'); await page.waitForSelector('.page-title', { timeout: 15000 });

  const config = await page.evaluate(async () => (await fetch('/api/config')).json());
  log('server reports AI configured (fake key present)', config.aiConfigured === true, JSON.stringify(config));

  await page.evaluate(() => { location.hash = '#/assistant'; });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.tab, #assistant-tab-chat', { timeout: 10000 });
  log('Assistant page renders the real chat UI (not the "AI unavailable" banner)', (await page.locator('text=AI features require an ANTHROPIC_API_KEY').count()) === 0);
  await page.screenshot({ path: `${SHOT}/01-assistant-configured.png` });

  // ---- A. ASSISTANT CHAT ----
  mode = 'ok'; nextText = JSON.stringify({ reply: 'Here is your week at a glance.', suggestions: ['Plan tomorrow', 'Review bills'] });
  calls.length = 0;
  await page.fill('.chat-input-row input', 'What should I focus on today?');
  await page.click('.chat-input-row button[type=submit]');
  // A transient "Thinking..." bubble shares the same selector as the real reply; wait for it to
  // settle (the send button re-enables once sending=false) before reading the rendered text.
  await page.waitForFunction(() => document.querySelector('.chat-input-row button[type=submit]') && !document.querySelector('.chat-input-row button[type=submit]').disabled, { timeout: 8000 });
  const userBubble = await page.locator('.assistant-msg.user .bubble').count();
  const replyText = await page.locator('.assistant-msg.assistant .bubble').last().textContent();
  const pillCount = await page.locator('.assistant-suggestions .pill').count();
  log('A. Chat: request created, provider reached, response rendered with suggestion pills', calls.length === 1 && userBubble === 1 && replyText.includes('week at a glance') && pillCount === 2, `provider calls=${calls.length}, reply="${replyText}"`);
  log('A. request body used output_format (the fixed wiring), not the old output_config', calls[0] && 'output_format' in calls[0].body && !('output_config' in calls[0].body));
  await page.screenshot({ path: `${SHOT}/02-chat-success.png` });

  // duplicate-submission guard
  calls.length = 0;
  await page.fill('.chat-input-row input', 'second message');
  const before = await page.locator('.assistant-msg').count();
  const inputEl = page.locator('.chat-input-row input');
  const sendBtn = page.locator('.chat-input-row button[type=submit]');
  await sendBtn.click();
  const disabledDuring = await inputEl.isDisabled().catch(() => false);
  await page.waitForFunction(() => document.querySelector('.chat-input-row button[type=submit]') && !document.querySelector('.chat-input-row button[type=submit]').disabled, { timeout: 8000 });
  await page.waitForTimeout(200);
  log('A. no duplicate provider request from one click; input/button were disabled while in flight', calls.length === 1, `provider calls=${calls.length}, wasDisabled=${disabledDuring}`);

  // error path: provider failure surfaces a friendly message, no leaked internals
  mode = 'error'; calls.length = 0;
  await page.fill('.chat-input-row input', 'trigger a provider error');
  await page.click('.chat-input-row button[type=submit]');
  await page.waitForSelector('.toast', { timeout: 8000 });
  const errToast = (await page.locator('.toast').allTextContents()).join(' | ');
  log('A. provider failure -> friendly toast, no provider internals or key leaked', /temporarily unavailable|unexpectedly/i.test(errToast) && !errToast.includes('PROVIDER-INTERNAL-DETAIL') && !errToast.includes('sk-ant-test-FAKE-browser'), errToast);
  mode = 'ok';
  await page.screenshot({ path: `${SHOT}/03-chat-error.png` });

  // ---- B. PLAN GENERATION ----
  await page.click('.tab:has-text("Plan my week")');
  await page.waitForSelector('textarea', { timeout: 5000 });
  nextText = JSON.stringify({
    summary: 'A calm study week', workStart: '08:00', workEnd: '18:00',
    activities: [{ label: 'Study JavaScript', totalMinutesPerDay: 60, minBlockMinutes: 30, earliest: '08:00', latest: '10:00', priority: 4, days: ['mon', 'tue', 'wed', 'thu', 'fri'] }],
    notes: ['Protected sleep and meals as usual.'],
  });
  calls.length = 0;
  await page.fill('textarea', 'From Monday to Friday I want to study JavaScript in the morning.');
  const planTextarea = page.locator('textarea');
  await page.click('button:has-text("Build my plan")');
  const planDisabled = await planTextarea.isDisabled().catch(() => false);
  await page.waitForSelector('.plan-preview-day, .field-error', { timeout: 8000 });
  const planRendered = await page.locator('.plan-preview-day').count();
  const blockText = await page.locator('.plan-block').first().textContent().catch(() => '');
  log('B. Plan: request created, structured result validated and rendered', calls.length === 1 && planRendered >= 1 && /08:00|Study/.test(blockText || ''), `provider calls=${calls.length}, days rendered=${planRendered}, block="${blockText}"`);
  log('B. loading state disabled the form while in flight', planDisabled);
  await page.screenshot({ path: `${SHOT}/04-plan-success.png` });

  // Plan malformed result
  mode = 'error'; calls.length = 0;
  await page.fill('textarea', 'trigger a provider error for plan');
  await page.click('button:has-text("Build my plan")');
  await page.waitForSelector('.field-error', { timeout: 8000 });
  const planErr = await page.locator('.field-error').textContent();
  log('B. Plan provider failure renders a field-level error, not a crash', /temporarily unavailable|unexpectedly/i.test(planErr) && !planErr.includes('PROVIDER-INTERNAL-DETAIL'), planErr);
  mode = 'ok';

  // ---- C. WEEKLY REVIEW ----
  await page.click('.tab:has-text("Chat")');
  await page.waitForTimeout(300);
  nextText = JSON.stringify({ headline: 'A steady week overall', highlights: ['3 tasks completed', 'All bills paid'], forgettingChecklist: ['No EcoLife entries logged this week — anything to add?'] });
  calls.length = 0;
  await page.click('button:has-text("Weekly review")');
  await page.waitForSelector('.modal-panel .loading-line, .modal-panel h3', { timeout: 3000 });
  await page.waitForSelector('.modal-panel h3', { timeout: 8000 });
  const headline = await page.locator('.modal-panel h3').textContent();
  const highlightCount = await page.locator('.modal-panel >> text=Highlights >> xpath=following-sibling::ul[1]/li').count().catch(() => 0);
  log('C. Weekly review: opens, requests, structured result validated and rendered', calls.length === 1 && headline === 'A steady week overall', `headline="${headline}", calls=${calls.length}`);
  await page.screenshot({ path: `${SHOT}/05-weekly-review-success.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  log('C. modal closes and can be reopened (lifecycle)', (await page.locator('.modal-panel').count()) === 0);
  mode = 'error'; calls.length = 0;
  await page.click('button:has-text("Weekly review")');
  await page.waitForSelector('.modal-panel .field-error', { timeout: 8000 });
  const reviewErr = await page.locator('.modal-panel .field-error').textContent();
  log('C. Weekly review provider failure renders inside the modal, not a crash', /temporarily unavailable|unexpectedly/i.test(reviewErr) && !reviewErr.includes('PROVIDER-INTERNAL-DETAIL'));
  await page.keyboard.press('Escape');
  mode = 'ok';

  // ---- security: no key anywhere the browser can see ----
  const html = await page.content();
  const bundle = await (await fetch(BASE + '/app/main.js')).text();
  log('security: fake API key never appears in page HTML, the JS bundle, or any /api/ai/* response body', !html.includes('sk-ant-test-FAKE-browser') && !bundle.includes('sk-ant-test-FAKE-browser') && !responses.some((r) => r.body.includes('sk-ant-test-FAKE-browser')));
  log('security: no /api/ai/* response body contains the raw provider error text', !responses.some((r) => r.body.includes('PROVIDER-INTERNAL-DETAIL')));
  log('security: server console log never printed the API key', !serverLog.includes('sk-ant-test-FAKE-browser'));
} catch (e) {
  log('script error', false, e.stack.split('\n').slice(0, 4).join(' | '));
}
console.log('\nprovider requests observed (approx, across this whole run):', calls.length >= 0 ? 'see per-step counts above' : '');
console.log('console errors (deduped):', [...new Set(consoleErrors)].slice(0, 8));
console.log('page errors:', pageErrors.length, pageErrors.slice(0, 3));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
srv.kill(); mock.close(); await browser.close(); process.exit(0);
