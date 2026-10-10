// Phase 8.2 browser verification: account-recovery matrix (desktop + mobile).
import { chromium } from 'playwright';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const BASE = 'http://localhost:3001';
const LOG = './server-h1.log';
const DB = 'C:/Users/PROMOT~1/AppData/Local/Temp/claude/c--Users-Promotech-OneDrive-Desktop-claude-projects/4d032e2c-eafd-4984-bdd5-6d5f1898139d/scratchpad/pw-verify/h1db3/x.db';
const SHOT = './screenshots-phase83-recovery';
fs.mkdirSync(SHOT, { recursive: true });

const results = [];
const consoleErrors = [];
const pageErrors = [];
const log = (label, ok, detail = '') => {
  results.push({ label, ok });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`);
};
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mailsFor(email) {
  const text = fs.readFileSync(LOG, 'utf8');
  const parts = text.split('[LifeAdmin mail:outbox]').slice(1).filter((p) => p.includes(`To: ${email}`));
  return parts.map((p) => (/#\/reset-password\/([A-Za-z0-9_-]+)/.exec(p) || [])[1]);
}
function lastLink(email) {
  const t = mailsFor(email).filter(Boolean);
  return t.length ? `${BASE}/#/reset-password/${t[t.length - 1]}` : null;
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ts = Date.now();
const email = `p82.${ts}@test.local`;
const phone = `+3834455${String(Math.floor(1000 + Math.random() * 8999))}`;
const oldPw = 'oldpassword123';
const newPw = 'brandnewpass456';

async function newPage(w = 1280, h = 900, ctx) {
  const context = ctx || (await browser.newContext({ viewport: { width: w, height: h } }));
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  return page;
}
async function signup(page, em, ph, pw) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#switch-mode');
  await page.fill('#f-firstName', 'Rec');
  await page.fill('#f-lastName', 'Overy');
  await page.fill('#f-email', em);
  await page.fill('#f-phone', ph);
  await page.fill('#f-password', pw);
  await page.fill('#f-confirmPassword', pw);
  await page.click('#submit-btn');
  await page.waitForSelector('.page-title', { timeout: 15000 });
}
async function requestReset(em, w = 1280, h = 900) {
  const page = await newPage(w, h);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#forgot-link');
  await page.fill('#f-email', em);
  await page.click('#submit-btn');
  await page.waitForSelector('text=Check your email', { timeout: 8000 });
  const msg = await page.locator('[role=status]').first().textContent();
  await page.context().close();
  return msg.trim();
}

try {
  // ---- setup: account + a live session in context A --------------------------
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pageA = await newPage(1280, 900, ctxA);
  await signup(pageA, email, phone, oldPw);
  log('setup: account registered and signed in (context A)', true);

  // ---- 1-2: forgot entry from a logged-out login screen ----------------------
  const p1 = await newPage();
  await p1.goto(BASE, { waitUntil: 'networkidle' });
  const linkVisible = await p1.locator('#forgot-link').isVisible();
  log('1. login screen exposes a "Forgot your password?" entry point', linkVisible);
  await p1.click('#forgot-link');
  await p1.waitForSelector('#f-email');
  log('2. forgot-password form opens (email field + submit)', (await p1.locator('h2').textContent()).includes('Reset your password'));
  await p1.screenshot({ path: `${SHOT}/01-forgot-desktop.png` });
  await p1.context().close();

  // ---- 3-5: existing vs unknown email -----------------------------------------
  const msgExisting = await requestReset(email);
  const msgUnknown = await requestReset(`nobody.${ts}@test.local`);
  log('3-5. existing and unknown emails show the identical generic message', msgExisting === msgUnknown, msgExisting);
  await sleep(300);
  const tokens1 = mailsFor(email).filter(Boolean);
  log('5b. exactly one reset email generated for the existing account', tokens1.length === 1, `mails=${tokens1.length}`);
  log('5c. no email generated for the unknown address', mailsFor(`nobody.${ts}@test.local`).length === 0);

  const link1 = lastLink(email);
  log('6. reset token/link generated (local outbox path — NOT real delivery)', !!link1);

  // ---- 7,22: open reset link, refresh -----------------------------------------
  const p2 = await newPage();
  await p2.goto(link1, { waitUntil: 'networkidle' });
  await p2.waitForSelector('#f-password', { timeout: 8000 });
  log('7. valid reset link opens the "Choose a new password" form', (await p2.locator('h2').textContent()).includes('Choose a new password'));
  await p2.reload({ waitUntil: 'networkidle' });
  await p2.waitForSelector('#f-password', { timeout: 8000 });
  log('22. refreshing the reset page keeps the form (token in URL fragment)', true);
  const noExtraHashErr = pageErrors.length === 0;
  log('   no uncaught error on the auth screen', noExtraHashErr);

  // ---- 15-16: validation --------------------------------------------------------
  await p2.fill('#f-password', 'short');
  await p2.fill('#f-confirmPassword', 'short');
  await p2.click('#submit-btn');
  await p2.waitForSelector('[data-error-for=password]:not([style*="none"])', { timeout: 5000 });
  log('15. too-short password is rejected with a field error', (await p2.locator('[data-error-for=password]').textContent()).includes('8 characters'));
  await p2.fill('#f-password', newPw);
  await p2.fill('#f-confirmPassword', newPw + 'x');
  await p2.click('#submit-btn');
  await p2.waitForSelector('[data-error-for=confirmPassword]:not([style*="none"])', { timeout: 5000 });
  log('16. mismatched confirmation is rejected', (await p2.locator('[data-error-for=confirmPassword]').textContent()).includes('do not match'));
  const errRole = await p2.locator('#form-error').getAttribute('role');
  log('   form errors are exposed as role="alert"', errRole === 'alert');
  await p2.screenshot({ path: `${SHOT}/02-reset-errors.png` });

  // ---- 8-10: successful reset ---------------------------------------------------
  await p2.fill('#f-password', newPw);
  await p2.fill('#f-confirmPassword', newPw);
  await p2.click('#submit-btn');
  await p2.waitForSelector('[role=status]:has-text("password has been updated")', { timeout: 8000 });
  log('8-10. successful reset returns to sign-in with a confirmation notice', true);
  log('   the token is removed from the address bar', !(await p2.evaluate(() => location.hash.includes('reset-password'))));
  await p2.screenshot({ path: `${SHOT}/03-reset-success.png` });

  // ---- 11-12: reuse ---------------------------------------------------------------
  const p3 = await newPage();
  await p3.goto(link1, { waitUntil: 'networkidle' });
  await p3.waitForSelector('#request-new', { timeout: 8000 });
  log('11-12. re-using the same link shows the "can\'t be used" state', (await p3.locator('h2').textContent()).includes("can't be used"));
  await p3.screenshot({ path: `${SHOT}/04-reused.png` });
  await p3.context().close();

  // ---- 13-14: expired + invalid ---------------------------------------------------
  await requestReset(email);
  await sleep(300);
  const link2 = lastLink(email);
  const db = new DatabaseSync(DB);
  db.prepare('UPDATE password_reset_tokens SET expires_at = ?').run(Date.now() - 1000);
  db.close();
  const p4 = await newPage();
  await p4.goto(link2, { waitUntil: 'networkidle' });
  await p4.waitForSelector('#request-new', { timeout: 8000 });
  log('13. an expired link shows the "can\'t be used" state', true);
  await p4.goto(`${BASE}/#/reset-password/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`, { waitUntil: 'networkidle' });
  await p4.reload({ waitUntil: 'networkidle' });
  await p4.waitForSelector('#request-new', { timeout: 8000 });
  log('14. an unknown/invalid token shows the same state', true);
  // "Request a new link" leads back to the forgot form
  await p4.click('#request-new');
  await p4.waitForSelector('#f-email', { timeout: 5000 });
  log('   "Request a new link" opens the forgot-password form', true);
  await p4.context().close();

  // ---- 17-20: login old/new, protected page, logout, login -----------------------------
  const p5 = await newPage();
  await p5.goto(BASE, { waitUntil: 'networkidle' });
  await p5.fill('#f-identifier', email);
  await p5.fill('#f-password', oldPw);
  await p5.click('#submit-btn');
  await p5.waitForSelector('#form-error:not([style*="none"])', { timeout: 8000 });
  log('17. login with the OLD password is rejected', (await p5.locator('#form-error').textContent()).includes('Invalid credentials'));
  await p5.fill('#f-password', newPw);
  await p5.click('#submit-btn');
  await p5.waitForSelector('.page-title', { timeout: 15000 });
  log('18-19. login with the NEW password succeeds and reaches the protected app', true);
  // Create in-app history entries first: with none, goBack() would leave the
  // site for about:blank, which proves nothing about the app (original
  // false negative — see report).
  await p5.click('#sidebar-nav a[href="#/tasks"]');
  await p5.waitForSelector('.page-title:has-text("Tasks")', { timeout: 10000 });
  await p5.click('#logout-link');
  await p5.waitForSelector('#f-identifier', { timeout: 10000 });
  log('20. logout returns to the login screen', true);
  await p5.goBack().catch(() => {});
  await sleep(500);
  const stillLoggedOutAfterBack = await p5.locator('#f-identifier').count();
  log('   browser Back after logout does not restore the authenticated app', stillLoggedOutAfterBack === 1);
  await p5.context().close();

  // ---- session invalidation: context A (signed in before the reset) ---------------------
  const stale = await pageA.evaluate(async () => (await (await fetch('/api/auth/me')).json()).user);
  log('session opened BEFORE the reset is signed out by it', stale === null);
  await pageA.reload({ waitUntil: 'networkidle' });
  log('   reloading that browser shows the login screen', (await pageA.locator('#f-identifier').count()) === 1);
  await ctxA.close();

  // ---- 21: repeat recovery / supersede (separate email keeps the per-email budget) ----
  const emailS = `p82s.${ts}@test.local`;
  { const c = await browser.newContext({ viewport:{width:1280,height:900} }); const pp = await newPage(1280,900,c); await signup(pp, emailS, `+3834458${String(Math.floor(1000+Math.random()*8999))}`, oldPw); await c.close(); }
  await requestReset(emailS); await sleep(300);
  const linkA = lastLink(emailS);
  await requestReset(emailS); await sleep(300);
  const linkB = lastLink(emailS);
  const pS = await newPage();
  await pS.goto(linkA, { waitUntil: 'networkidle' });
  await pS.waitForSelector('#request-new', { timeout: 8000 });
  log('21. repeating recovery works; the older link is superseded', linkA !== linkB);
  await pS.goto(linkB, { waitUntil: 'networkidle' }); await pS.reload({ waitUntil: 'networkidle' });
  await pS.waitForSelector('#f-password', { timeout: 8000 });
  log('   ...while the newest link still opens the reset form', true);
  await pS.context().close();
  // third request for the main email, so the next one (4th) must be throttled
  await requestReset(email);

  // ---- server-side rate limiting through the UI --------------------------------------------
  const pRL = await newPage();
  await pRL.goto(BASE, { waitUntil: 'networkidle' });
  await pRL.click('#forgot-link');
  await pRL.fill('#f-email', email);
  await pRL.click('#submit-btn');
  await pRL.waitForSelector('#form-error:not([style*="none"])', { timeout: 8000 });
  log('   4th forgot-password request for the same email is throttled with a clear message', (await pRL.locator('#form-error').textContent()).includes('Too many'));
  await pRL.context().close();

  // ---- keyboard / accessibility of the changed screens --------------------------------------------
  {
    const pk = await newPage();
    await pk.goto(BASE, { waitUntil: 'networkidle' });
    let reached = false;
    for (let i = 0; i < 8; i++) {
      await pk.keyboard.press('Tab');
      if (await pk.evaluate(() => document.activeElement.id === 'forgot-link')) { reached = true; break; }
    }
    log('a11y: "Forgot your password?" is reachable by keyboard Tab', reached);
    await pk.keyboard.press('Enter');
    await pk.waitForSelector('#f-email');
    const labelFor = await pk.locator('label[for=f-email]').count();
    log('a11y: forgot form input has an associated <label>', labelFor === 1);
    await pk.fill('#f-email', `kbd.${ts}@test.local`);
    await pk.keyboard.press('Enter');
    await pk.waitForSelector('[role=status]', { timeout: 8000 });
    log('a11y: the confirmation is a role="status" live region and submit works via Enter', true);
    await pk.context().close();
  }

  // ---- regression: login/settings/deletion copy/all pages ----------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pr = await newPage(1280, 900, ctx);
    const e3 = `p82c.${ts}@test.local`;
    await signup(pr, e3, `+3834457${String(Math.floor(1000 + Math.random() * 8999))}`, oldPw);
    // owner-deletion copy
    await pr.click('#sidebar-nav a[href="#/family"]');
    await pr.waitForSelector('button:has-text("Create a family")', { timeout: 10000 });
    await pr.click('button:has-text("Create a family")');
    await pr.waitForSelector('#family-form');
    await pr.fill('#family-form [name=name]', 'Reg Family');
    await pr.click('#create-family-save');
    await pr.waitForSelector('.family-tabs-wrap', { timeout: 10000 });
    await pr.click('#sidebar-nav a[href="#/settings"]');
    await pr.waitForSelector('.page-title:has-text("Settings")', { timeout: 10000 });
    await pr.click('#settings-tab-data');
    await pr.click('button:has-text("Delete my account")');
    await pr.waitForSelector('#delete-account-form');
    await pr.fill('#delete-account-form [name=password]', oldPw);
    const n0 = await pr.locator('.toast').count();
    await pr.click('#delete-account-confirm-btn');
    await pr.waitForFunction((n) => document.querySelectorAll('.toast').length > n, n0, { timeout: 5000 });
    const txt = await pr.locator('.toast').last().textContent();
    log('regression: family-owner deletion still blocked, with accurate (non-misleading) copy', /can't be deleted yet/.test(txt) && !/Transfer ownership or delete the family before/.test(txt), txt);
    await pr.keyboard.press('Escape');
    // settings password change keeps this session
    await pr.click('#settings-tab-security');
    await pr.fill('[name=currentPassword]', oldPw);
    await pr.fill('[name=newPassword]', 'changedagain789');
    await pr.click('button:has-text("Update password")');
    await pr.waitForSelector('.toast:has-text("Password updated")', { timeout: 5000 });
    const stillIn = await pr.evaluate(async () => (await (await fetch('/api/auth/me')).json()).user);
    log('regression: changing password in Settings keeps the current session signed in', !!stillIn);
    // every page loads
    let allOk = true;
    for (const r of ['dashboard', 'tasks', 'family', 'billsense', 'decisionflow', 'ecolife', 'goals', 'timeline', 'assistant', 'settings']) {
      await pr.click(`#sidebar-nav a[href="#/${r}"]`);
      await pr.waitForSelector('.page-title', { timeout: 10000 }).catch(() => { allOk = false; });
      if (await overflow(pr)) allOk = false;
    }
    log('regression: all 10 pages load with no page overflow', allOk);
    await ctx.close();
  }
} catch (e) {
  console.error('DRIVER ERROR:', e.message);
  results.push({ label: 'driver error', ok: false });
} finally {
  console.log('\n--- Console errors ---');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
  console.log('--- Uncaught page errors ---');
  console.log(pageErrors.length ? pageErrors.join('\n') : '(none)');
  const fails = results.filter((r) => !r.ok);
  console.log(`\nTOTAL: ${results.length - fails.length}/${results.length} checks passed`);
  if (fails.length) console.log('FAILED:', fails.map((f) => f.label).join(' | '));
  await browser.close();
}
