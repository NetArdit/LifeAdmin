// Browser EMULATION of the phone/tablet/desktop layout (Chromium with touch + mobile metrics). It is not a real
// iPhone: auto-zoom and the real keyboard are listed for real-device testing. Run:  npm run test:e2e
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium, devices } from 'playwright';

const require = createRequire(import.meta.url);
const { startApp, makeClient, signUp } = require('../test/helpers.js');

const VIEWPORTS = [
  { name: 'phone 320 portrait', width: 320, height: 568, mobile: true },
  { name: 'phone 390 portrait', width: 390, height: 844, mobile: true },
  { name: 'phone 412 portrait', width: 412, height: 915, mobile: true },
  { name: 'phone landscape', width: 844, height: 390, mobile: true },
  { name: 'tablet portrait', width: 768, height: 1024, mobile: true },
  { name: 'tablet landscape', width: 1024, height: 768, mobile: true },
  { name: 'desktop', width: 1280, height: 800, mobile: false },
];
const PAGES = ['dashboard', 'tasks', 'family', 'billsense', 'documents', 'goals', 'decisionflow', 'ecolife', 'assistant', 'timeline', 'settings'];
const IOS_UA = devices['iPhone 13'].userAgent;

let app;
let browser;
let cookie;
test.before(async () => {
  app = await startApp();
  const c = makeClient(app.base);
  const { payload } = await signUp(c);
  cookie = c.cookie().split('=');
  // Long, unbroken text is what breaks layouts.
  const long = 'Averyveryveryveryveryverylongwordwithoutanyspacesthatwouldnormallyoverflowthecontainer';
  await c.post('/api/tasks', { title: long, priority: 'high', dueDate: '2030-01-10' });
  await c.post('/api/tasks', { title: 'Pay the rent and also call the electrician about the meter', dueDate: '2030-01-11' });
  await c.post('/api/bills', { name: long, amount: 123456.78, dueDate: '2030-02-01', category: 'rent' });
  await c.post('/api/goals', { title: long, category: 'learning' });
  const fam = await c.post('/api/family', { name: long });
  await c.post(`/api/chat/${fam.data.family.id}/messages`, { body: long + long });
  await c.post(`/api/family/${fam.data.family.id}/shopping`, { name: long });
  await c.post('/api/decisions', { question: 'Should I ' + long + '?' });
  assert.ok(payload);
  browser = await chromium.launch();
});
test.after(async () => {
  await browser?.close();
  await app?.close();
});

async function open(vp, { ua } = {}) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    deviceScaleFactor: vp.mobile ? 3 : 1,
    userAgent: ua,
  });
  await context.addCookies([{ name: cookie[0], value: cookie.slice(1).join('='), url: app.base }]);
  return { context, page: await context.newPage() };
}
const go = async (page, route) => {
  await page.goto(`${app.base}/#/${route}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(350);
};

test('the viewport meta allows pinch-zoom', async () => {
  const { context, page } = await open(VIEWPORTS[1]);
  await page.goto(app.base);
  const meta = await page.getAttribute('meta[name="viewport"]', 'content');
  assert.match(meta, /viewport-fit=cover/);
  assert.doesNotMatch(meta, /maximum-scale|user-scalable/i);
  await context.close();
});

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow, fields at 16px on touch: ${vp.name}`, async () => {
    const { context, page } = await open(vp, { ua: vp.mobile ? IOS_UA : undefined });
    const problems = [];
    for (const route of PAGES) {
      await go(page, route);
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const doc = document.documentElement;
        const offenders = [];
        if (doc.scrollWidth > vw + 1) {
          for (const el of document.querySelectorAll('body *')) {
            const b = el.getBoundingClientRect();
            if (b.width && b.right > vw + 1 && !el.closest('.tabs, .module-rail, #toast-root, .menu')) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} right=${Math.round(b.right)}`);
            if (offenders.length > 4) break;
          }
        }
        const small = [];
        for (const el of document.querySelectorAll('input, textarea, select')) {
          if (['checkbox', 'radio', 'range', 'file', 'color', 'hidden'].includes(el.type)) continue;
          const b = el.getBoundingClientRect();
          if (!b.width || getComputedStyle(el).visibility === 'hidden') continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 16) small.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}=${fs}px`);
        }
        return { scrollWidth: doc.scrollWidth, vw, offenders, small };
      });
      if (r.scrollWidth > r.vw + 1) problems.push(`${route}: scrollWidth ${r.scrollWidth} > ${r.vw}; ${r.offenders.join(', ')}`);
      if (vp.mobile && r.small.length) problems.push(`${route}: fields under 16px: ${r.small.join(', ')}`);
    }
    await context.close();
    assert.deepEqual(problems, []);
  });
}

test('touch targets on a phone are at least 44x44 (buttons, tabs, rail, fields)', async () => {
  const { context, page } = await open(VIEWPORTS[1], { ua: IOS_UA });
  const problems = [];
  for (const route of PAGES) {
    await go(page, route);
    const small = await page.evaluate(() => {
      const out = [];
      const sel = '.btn, .btn-sm, .icon-btn, .btn-icon, .tab, .rail-item, .input, .select, button, a[href]';
      for (const el of document.querySelectorAll(sel)) {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height || getComputedStyle(el).visibility === 'hidden') continue;
        if (el.closest('[hidden], .sr-only')) continue;
        // A link inside running text is allowed to be small (WCAG 2.5.8 inline exception).
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue;
        if (b.height < 43.5 || b.width < 43.5) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(b.width)}x${Math.round(b.height)} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 20)}"`);
      }
      return out;
    });
    for (const s of small) problems.push(`${route}: ${s}`);
  }
  await context.close();
  // Reported in full, then asserted: a short list is the goal, a growing one is a regression.
  if (problems.length) console.log(`touch targets under 44px (${problems.length}):\n  ` + problems.slice(0, 40).join('\n  '));
  assert.ok(problems.length <= Number(process.env.MAX_SMALL_TARGETS || 0), `${problems.length} touch targets are under 44x44`);
});

test('the Circle strip scrolls sideways only, keeps its last item reachable and the active one in view', async () => {
  const { context, page } = await open(VIEWPORTS[0], { ua: IOS_UA });
  await go(page, 'family');
  const css = await page.evaluate(() => {
    const strip = document.querySelector('.tabs[aria-label="Circle sections"]');
    const s = getComputedStyle(strip);
    const tabs = [...strip.querySelectorAll('[role="tab"]')];
    return {
      overflowX: s.overflowX,
      overflowY: s.overflowY,
      touchAction: s.touchAction,
      contain: s.overscrollBehaviorX,
      scrollable: strip.scrollWidth > strip.clientWidth,
      nowrapAll: tabs.every((t) => getComputedStyle(t).whiteSpace === 'nowrap' && getComputedStyle(t).flexShrink === '0'),
      count: tabs.length,
      roles: strip.getAttribute('role'),
      selected: tabs.filter((t) => t.getAttribute('aria-selected') === 'true').length,
    };
  });
  assert.equal(css.overflowX, 'auto');
  assert.equal(css.overflowY, 'hidden');
  assert.equal(css.touchAction, 'pan-x');
  assert.equal(css.contain, 'contain');
  assert.equal(css.scrollable, true, 'five labels do not fit in 320px, so the strip scrolls');
  assert.equal(css.nowrapAll, true);
  assert.equal(css.roles, 'tablist');
  assert.equal(css.selected, 1);

  // A real touch gesture, made with the browser's own input pipeline.
  const cdp = await context.newCDPSession(page);
  const box = await page.locator('.tabs[aria-label="Circle sections"]').boundingBox();
  const startX = box.x + box.width - 20;
  const y = box.y + box.height / 2;
  // A finger that goes down, moves in small steps and lifts: the browser decides what scrolls.
  async function swipe(dx, dy) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + (dx * i) / steps, y: y + (dy * i) / steps }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(250);
  }
  await swipe(-120, 0);
  const afterSide = await page.evaluate(() => ({ left: document.querySelector('.tabs[aria-label="Circle sections"]').scrollLeft, y: window.scrollY }));
  assert.ok(afterSide.left > 0, 'a sideways swipe moves the strip');
  await swipe(0, -150);
  const afterUp = await page.evaluate(() => ({ top: document.querySelector('.tabs[aria-label="Circle sections"]').scrollTop, y: window.scrollY, left: document.querySelector('.tabs[aria-label="Circle sections"]').scrollLeft }));
  assert.equal(afterUp.top, 0, 'a vertical swipe on the strip does not move it up or down');
  assert.equal(afterUp.y, afterSide.y, 'and it does not scroll the page either');
  assert.equal(afterUp.left, afterSide.left);

  // The last tab can be reached completely.
  const reach = await page.evaluate(() => {
    const strip = document.querySelector('.tabs[aria-label="Circle sections"]');
    strip.scrollLeft = strip.scrollWidth;
    const last = strip.querySelector('[role="tab"]:last-of-type').getBoundingClientRect();
    const sb = strip.getBoundingClientRect();
    return { lastRight: last.right, stripRight: sb.right };
  });
  assert.ok(reach.lastRight <= reach.stripRight + 0.5, 'the last item is not cut off');

  // Choosing a far tab brings it into view; arrow keys, Home and End move between tabs.
  await page.evaluate(() => (document.querySelector('.tabs[aria-label="Circle sections"]').scrollLeft = 0));
  await page.click('#family-tab-activity');
  await page.waitForTimeout(150);
  const visible = await page.evaluate(() => {
    const t = document.getElementById('family-tab-activity').getBoundingClientRect();
    const s = document.querySelector('.tabs[aria-label="Circle sections"]').getBoundingClientRect();
    return t.left >= s.left - 1 && t.right <= s.right + 1;
  });
  assert.ok(visible, 'the selected tab is scrolled into view');
  await page.focus('#family-tab-activity');
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'family-tab-overview');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'family-tab-members');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'family-tab-activity');
  await context.close();
});

test('the module rail follows the same sideways-only rule', async () => {
  const { context, page } = await open(VIEWPORTS[0], { ua: IOS_UA });
  await go(page, 'ecolife');
  const s = await page.evaluate(() => {
    const rail = document.getElementById('module-rail');
    const cs = getComputedStyle(rail);
    const active = rail.querySelector('.rail-item.active').getBoundingClientRect();
    const rb = rail.getBoundingClientRect();
    return { y: cs.overflowY, ta: cs.touchAction, visible: active.left >= rb.left - 1 && active.right <= rb.right + 1 };
  });
  assert.equal(s.y, 'hidden');
  assert.equal(s.ta, 'pan-x');
  assert.ok(s.visible, 'the current section is in view in the rail');
  await context.close();
});

test('the chat composer stays above the keyboard (the inset the visual viewport reports is subtracted)', async () => {
  const { context, page } = await open(VIEWPORTS[1], { ua: IOS_UA });
  await go(page, 'family');
  await page.click('#family-tab-chat');
  await page.waitForSelector('.chat-input-row');
  const before = await page.evaluate(() => document.querySelector('.chat-input-row').getBoundingClientRect().bottom);
  await page.evaluate(() => document.documentElement.style.setProperty('--kb-inset', '300px'));
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({ bottom: document.querySelector('.chat-input-row').getBoundingClientRect().bottom, h: window.innerHeight }));
  assert.ok(after.bottom <= after.h - 300 + 2 || after.bottom < before, `composer bottom ${after.bottom} must clear a 300px keyboard in a ${after.h}px window`);
  await context.close();
});

test('reduced motion is respected', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.addCookies([{ name: cookie[0], value: cookie.slice(1).join('='), url: app.base }]);
  const page = await context.newPage();
  await go(page, 'dashboard');
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('.page')).animationDuration);
  assert.ok(parseFloat(d) < 0.001, `animation-duration ${d} is effectively none`);
  await context.close();
});
