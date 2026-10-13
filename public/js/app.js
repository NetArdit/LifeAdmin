import { api, ApiError, setUnauthorizedHandler } from './api.js';
import { icon } from './components/icons.js';
import { toast, escapeHtml } from './components/toast.js';
import { closeModal } from './components/modal.js';
import { initials } from './format.js';
import { applyTheme } from './theme.js';
import * as push from './push.js';

// Re-exported for the (still-vanilla, untouched) public/js/pages/settings.js
// rollback path, which imports applyTheme from here — see theme.js for why
// the implementation itself moved out of this file.
export { applyTheme };

// ---------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------
export const state = {
  user: null,
  aiConfigured: false,
  families: [],
  notifications: [],
  unreadCount: 0,
  // Guards handleSessionExpired() below against firing more than once per
  // expiry (e.g. several requests in flight all getting 401 back-to-back).
  // Reset to false on every successful login.
  sessionExpiredHandled: false,
};

// C3 shell IA (LIFE ADMIN — C3 IMPLEMENTATION, Phase 1). Two tiers, plus
// two utility surfaces reached only through the account menu — matching
// the shape validated (real rendered prototype, measured, not just
// reasoned about) in the "C3 Shell Final Validation Gate" doc:
//   1. PRIMARY switch — Today / This Week / Ledger. Same three routes the
//      app already has (dashboard/tasks/timeline); Timeline is
//      conceptually absorbed into Ledger per this phase's own brief, so
//      its route key and page component are untouched, only its nav
//      label and page heading change. Tasks becomes This Week the same
//      way: same route, same data, same filters — only the label changes,
//      so the nav and the page it leads to agree with each other (a
//      mismatched label/heading pair is exactly the "unclear primary
//      hierarchy" failure the validation gate's Decision Rule rules out).
//   2. MODULE RAIL — Family / Bills / Goals / Decisions / EcoLife. Always
//      visible, always labeled (see .module-rail in layout.css for why it
//      never drops to icon-only the way the validated prototype's first
//      draft did — that was the gate's one unresolved "needs scoped
//      revision" item, resolved here instead of relitigated).
// Settings, the assistant and log-out are reached through the account
// menu (toggleAccountMenu below), not this tier — kept out of
// VIEW_SWITCH_ITEMS/RAIL_ITEMS entirely rather than duplicated into them.
const VIEW_SWITCH_ITEMS = [
  { key: 'dashboard', label: 'Today' },
  { key: 'tasks', label: 'This Week' },
  { key: 'timeline', label: 'Ledger' },
];
const RAIL_ITEMS = [
  { key: 'family', label: 'Circle', icon: 'family' },
  { key: 'billsense', label: 'Bills', icon: 'bill' },
  { key: 'documents', label: 'Documents', icon: 'document' },
  { key: 'goals', label: 'Goals', icon: 'goal' },
  { key: 'decisionflow', label: 'Decisions', icon: 'decision' },
  { key: 'ecolife', label: 'EcoLife', icon: 'eco' },
];
// Real notification `link` prefixes (src/routes/*.js — family.js, bills.js,
// chat.js, decisions.js, goals.js all confirmed to emit exactly these),
// used to give the rail an honest per-module unread dot computed from
// data already being polled, rather than inventing a signal the schema
// doesn't have. Tasks/Assistant notifications intentionally map to
// nothing here — they surface via the notifications panel itself, which
// stays fully intact (see toggleNotificationsPanel below).
const RAIL_LINK_PREFIX = {
  family: '#/family',
  billsense: '#/billsense',
  documents: '#/documents',
  goals: '#/goals',
  decisionflow: '#/decisionflow',
  ecolife: '#/ecolife',
};

const appEl = document.getElementById('app');

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
async function boot() {
  try {
    const cfg = await api.get('/api/config');
    state.aiConfigured = cfg.aiConfigured;
  } catch {}

  try {
    const { user } = await api.get('/api/auth/me');
    state.user = user;
  } catch {
    state.user = null;
  }

  // A password-reset link (#/reset-password/<token>) is always handled by the
  // auth screen, even if a session cookie happens to exist — completing a
  // reset signs every session out anyway.
  const isResetLink = /^#\/reset-password\//.test(location.hash);

  if (state.user && !isResetLink) {
    applyTheme(state.user.theme);
    await refreshFamilies();
    renderShell();
    startNotificationPolling();
    afterSignIn();
  } else {
    renderAuth();
  }

  window.addEventListener('hashchange', route);
  // A notification that was pressed while the app is open: go where it points, through the normal router.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data || {};
      if (data.type === 'la-open' && typeof data.path === 'string' && /^\/(#\/[A-Za-z0-9/_-]{0,80})?$/.test(data.path)) location.hash = data.path.slice(1) || '#/dashboard';
    });
  }

  // A failed action must never fail silently. Several handlers across the
  // pages await an API call with no try/catch of their own (delete a goal,
  // postpone a task, remove a member, tick a shopping item, ...); when the
  // request failed, nothing happened and nothing was said. Any API error that
  // no handler caught is reported here once, instead of adding the same
  // try/catch to every one of them. Errors that are not API errors are left
  // alone so real bugs still show up in the console.
  window.addEventListener('unhandledrejection', (event) => {
    if (!(event.reason instanceof ApiError)) return;
    event.preventDefault();
    if (event.reason.status === 401) return; // handled by the session-expiry path
    toast(event.reason.message || 'Something went wrong. Please try again.', 'error');
  });
}

async function refreshFamilies() {
  try {
    const { families } = await api.get('/api/family');
    state.families = families;
  } catch {}
}

// ---------------------------------------------------------------------
// Auth screen
// ---------------------------------------------------------------------
function renderAuth() {
  import('./pages/auth.js').then((m) => m.mount(appEl, onAuthed));
}

async function onAuthed(user) {
  state.user = user;
  state.sessionExpiredHandled = false;
  applyTheme(user.theme);
  await refreshFamilies();
  renderShell();
  startNotificationPolling();
  afterSignIn();
}

// Session-expiry fix (Daily Product Quality phase). Root cause: every API
// call's 401 was left for whichever page/hook happened to make it to
// notice — most of them just put the raw server message ("Not
// authenticated.") into a generic error state and rendered it, so an
// expired session looked like a broken page instead of a sign-out. There
// was also no single owner of "what does the app do when the session
// dies", so fixing it per-page would have meant duplicating the same
// redirect logic across every page/hook (exactly what §11 of this phase's
// brief rules out). Fixed once here instead, registered with api.js's
// setUnauthorizedHandler() so it runs for every 401 from anywhere in the
// app, page code included.
//
// - Only acts if `state.user` is currently set: a 401 while already logged
//   out (the initial /api/auth/me boot check, or the auth screen itself)
//   is completely normal and must not trigger anything — this is what
//   avoids "logging users out when the session is actually valid" and any
//   redirect loop through the auth screen.
// - `sessionExpiredHandled` makes it a one-shot per expiry: several
//   requests can fail with 401 in the same moment (e.g. a page's own fetch
//   plus the notification poller), and only the first should act.
// - Unmounts the current React page and stops the notification poller
//   before tearing down the shell, so neither keeps running (and neither
//   keeps re-hitting a 401) against DOM that's about to be replaced — the
//   same reason route() unmounts the outgoing page on an ordinary
//   navigation, applied here too.
// - Closes any open modal/panel, then hands off to the exact same
//   renderAuth() the initial boot path already uses — no second login
//   screen implementation, no redirect loop, just the normal "logged out"
//   state.
// What follows every sign-in on this device, in the background: the account learns this browser's time zone
// if it has none, and notifications that this same person had turned on here are connected again.
function afterSignIn() {
  if (!state.user) return;
  push.captureZone(api, state.user);
  push.resume(api, state.user);
}

function handleSessionExpired() {
  if (state.sessionExpiredHandled || !state.user) return;
  state.sessionExpiredHandled = true;
  state.user = null;
  if (notifTimer) {
    clearInterval(notifTimer);
    notifTimer = null;
  }
  if (currentPageModule && typeof currentPageModule.unmount === 'function') {
    currentPageModule.unmount();
  }
  currentPageModule = null;
  closeModal();
  closeFloatPanels();
  window.removeEventListener('resize', measureShellChromeHeight);
  toast('Your session has expired. Please log in again.', 'error');
  renderAuth();
}
setUnauthorizedHandler(handleSessionExpired);

// ---------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------
function renderShell() {
  appEl.innerHTML = `
    <div class="shell">
      <div class="shell-top" id="shell-top">
        <header class="shell-header">
          <div class="brand"><span class="brand-mark">L</span><span class="brand-text">LifeAdmin</span></div>
          <nav class="view-switch" id="view-switch" role="tablist" aria-label="View"></nav>
          <div class="header-spacer"></div>
          <div class="header-icons" id="header-icons">
            <button class="icon-btn" id="open-search" aria-label="Search LifeAdmin">${icon('search', 'icon icon-sm')}</button>
            <button class="icon-btn" id="open-notifications" aria-label="Notifications" aria-expanded="false">${icon('bell')}<span class="chip-count" id="notif-chip" style="display:none"></span></button>
            <a class="icon-btn" id="open-assistant" href="#/assistant" aria-label="Ask the assistant">${icon('assistant')}</a>
          </div>
          <button class="account-chip" id="account-chip" aria-haspopup="menu" aria-expanded="false">
            <span class="avatar">${initials(state.user.firstName, state.user.lastName)}</span>
            <span class="name">${escapeHtml(state.user.firstName)} ${escapeHtml(state.user.lastName)}</span>
            <span class="chip-count" id="notif-chip-compact" style="display:none"></span>
          </button>
        </header>
        <nav class="module-rail" id="module-rail" aria-label="Browse modules"></nav>
      </div>
      <main id="page-root"></main>
      <button class="fab" id="quick-add-fab" aria-label="Quick add a task">${icon('plus')}</button>
    </div>
  `;

  renderViewSwitch();
  renderModuleRail();
  document.getElementById('open-search').addEventListener('click', openCommandPalette);
  document.getElementById('open-notifications').addEventListener('click', () => toggleNotificationsPanel());
  document.getElementById('account-chip').addEventListener('click', () => toggleAccountMenu());
  document.getElementById('quick-add-fab').addEventListener('click', openQuickAddTask);
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !isTyping(e.target)) {
      e.preventDefault();
      openCommandPalette();
    }
  });

  measureShellChromeHeight();
  window.addEventListener('resize', measureShellChromeHeight);

  route();
}

// The C3 header is a two-row sticky area (.shell-header + .module-rail)
// whose combined height changes across breakpoints (wordmark/name hiding,
// switch padding tightening) rather than being one fixed constant — so it
// is measured off the real DOM, not guessed, and exposed as
// --shell-chrome-height for the one page (Assistant) whose layout needs to
// know how much vertical space the shell above it actually takes. Debounced
// on resize the same way a real orientation change or a responsive
// breakpoint crossing would otherwise fire this several times in a row.
let chromeHeightDebounce = null;
function measureShellChromeHeight() {
  clearTimeout(chromeHeightDebounce);
  chromeHeightDebounce = setTimeout(() => {
    const top = document.getElementById('shell-top');
    if (!top) return;
    document.documentElement.style.setProperty('--shell-chrome-height', `${Math.round(top.getBoundingClientRect().height)}px`);
  }, 80);
}

function isTyping(target) {
  return ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
}

function currentRouteKey() {
  const hash = location.hash || '#/dashboard';
  return hash.split('/')[1] || 'dashboard';
}

// Today / This Week / Ledger — a real role="tablist", not styled buttons
// standing in for one (see Section 6/9 of the validation gate: this was
// measured and confirmed against an actual tablist's semantics, not just
// visually).
function renderViewSwitch() {
  const current = currentRouteKey();
  document.getElementById('view-switch').innerHTML = VIEW_SWITCH_ITEMS.map(
    (item) => `<button role="tab" aria-selected="${current === item.key}" class="${current === item.key ? 'active' : ''}" data-nav="#/${item.key}">${escapeHtml(item.label)}</button>`
  ).join('');
  document.querySelectorAll('#view-switch [data-nav]').forEach((btn) => btn.addEventListener('click', () => (location.hash = btn.dataset.nav)));
}

// Family / Bills / Goals / Decisions / EcoLife — always visible, always
// labeled (see layout.css's .module-rail comment for why it deliberately
// never collapses to icon-only), with a real per-module unread dot
// computed from state.notifications (see updateRailBadges below).
function renderModuleRail() {
  const current = currentRouteKey();
  document.getElementById('module-rail').innerHTML = RAIL_ITEMS.map(
    (item) => `<a class="rail-item ${current === item.key ? 'active' : ''}" href="#/${item.key}" id="rail-${item.key}">${icon(item.icon, 'icon icon-sm')}<span>${escapeHtml(item.label)}</span></a>`
  ).join('');
  updateRailBadges();
}

function unreadCountsByModule() {
  const counts = {};
  for (const n of state.notifications) {
    if (n.read || !n.link) continue;
    const match = Object.entries(RAIL_LINK_PREFIX).find(([, prefix]) => n.link.startsWith(prefix));
    if (match) counts[match[0]] = (counts[match[0]] || 0) + 1;
  }
  return counts;
}

function updateRailBadges() {
  const counts = unreadCountsByModule();
  for (const item of RAIL_ITEMS) {
    const el = document.getElementById(`rail-${item.key}`);
    if (!el) continue;
    const n = counts[item.key] || 0;
    let dot = el.querySelector('.rail-badge');
    if (n > 0) {
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'rail-badge';
        dot.setAttribute('aria-hidden', 'true');
        el.prepend(dot);
      }
      el.setAttribute('aria-label', `${item.label}, ${n} unread`);
    } else {
      dot?.remove();
      el.setAttribute('aria-label', item.label);
    }
  }
}

// ---------------------------------------------------------------------
// Account menu — a real dropdown (role="menu"), built and rendered, not
// an aria-label standing in for one. Holds Settings and Log out on every
// width (utility tier, never duplicated into the header), plus Search /
// Notifications / Ask the assistant ONLY when their own header icon is
// hidden (see .header-icons/.compact-only in layout.css) — each action
// lives in exactly one place at any given width, never both.
// ---------------------------------------------------------------------
function toggleAccountMenu() {
  const chip = document.getElementById('account-chip');
  if (document.getElementById('account-menu')) return closeFloatPanels();
  closeFloatPanels();
  const root = document.getElementById('panel-root');
  const unread = state.unreadCount > 0 ? `<span class="chip-count">${state.unreadCount > 9 ? '9+' : state.unreadCount}</span>` : '';
  root.innerHTML = `
    <div class="account-menu" id="account-menu" role="menu" aria-label="Account">
      <div class="menu-identity">
        <span class="avatar">${initials(state.user.firstName, state.user.lastName)}</span>
        <div style="min-width:0">
          <div class="name">${escapeHtml(state.user.firstName)} ${escapeHtml(state.user.lastName)}</div>
          <div class="email">${escapeHtml(state.user.email || '')}</div>
        </div>
      </div>
      <button class="menu-item compact-only" role="menuitem" id="menu-search">${icon('search', 'icon icon-sm')}<span>Search</span></button>
      <button class="menu-item compact-only" role="menuitem" id="menu-notifications">${icon('bell', 'icon icon-sm')}<span>Notifications</span>${unread}</button>
      <a class="menu-item compact-only" role="menuitem" href="#/assistant">${icon('assistant', 'icon icon-sm')}<span>Ask the assistant</span></a>
      <a class="menu-item" role="menuitem" href="#/settings">${icon('settings', 'icon icon-sm')}<span>Settings</span></a>
      <button class="menu-item" role="menuitem" id="menu-logout">${icon('logout', 'icon icon-sm')}<span>Log out</span></button>
    </div>
  `;
  const panel = document.getElementById('account-menu');
  positionFloatPanel(panel, chip);
  chip.setAttribute('aria-expanded', 'true');
  // The first .menu-item in DOM order may be a .compact-only one, hidden
  // at >=860px (see layout.css) — focus the first actually-visible item,
  // same "skip hidden controls" check modal.js's own focus trap uses.
  [...panel.querySelectorAll('.menu-item')].find((el) => el.offsetParent !== null)?.focus();

  document.getElementById('menu-search').addEventListener('click', () => {
    closeFloatPanels();
    openCommandPalette();
  });
  document.getElementById('menu-notifications').addEventListener('click', () => {
    closeFloatPanels();
    toggleNotificationsPanel();
  });
  document.getElementById('menu-logout').addEventListener('click', async () => {
    // This browser stops receiving for the person who leaves; the server's half goes with the session.
    await push.forgetLocal();
    await api.post('/api/auth/logout');
    location.reload();
  });
  panel.querySelectorAll('a.menu-item').forEach((a) => a.addEventListener('click', closeFloatPanels));

  bindOutsideClose(panel, chip);
}

// Positions a fixed-position floating panel (account menu / notifications)
// below and right-aligned to its trigger, clamped so it can never render
// partly off-screen at any required width — re-verified by measurement in
// the validation gate for the account menu specifically; the clamp here
// generalizes that fix rather than hardcoding the one width it was found on.
function positionFloatPanel(panel, anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const width = panel.offsetWidth || 280;
  const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
  panel.style.top = `${Math.round(rect.bottom + 8)}px`;
  panel.style.left = `${Math.round(left)}px`;
}

// Shared outside-click/Escape-to-close for anchored dropdowns (account
// menu, notifications). The command palette keeps its own backdrop+Escape
// handling — a different, full-overlay interaction pattern, not this one.
let floatCloseHandlers = null;
function bindOutsideClose(panel, anchorEl) {
  const onDocClick = (e) => {
    if (panel.contains(e.target) || anchorEl.contains(e.target)) return;
    closeFloatPanels();
  };
  const onDocKey = (e) => {
    if (e.key === 'Escape') closeFloatPanels();
  };
  setTimeout(() => {
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onDocKey);
  }, 0);
  floatCloseHandlers = { onDocClick, onDocKey };
}

async function openQuickAddTask() {
  const { openTaskFormModal } = await import('/app/main.js');
  openTaskFormModal({ api, toast, state, existing: null, onSaved: () => route() });
}

// ---------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------
const PAGES = {
  // React + Vite (Phases 1-8): ALL TEN pages built from web/src into ONE
  // shared bundle, public/app/main.js (see web/vite.config.js), so
  // React/ReactDOM ships once rather than once per page. Each loader below
  // resolves a different named mount/unmount export from that same module
  // (see web/src/main.jsx) into the {mount, unmount} shape every page
  // module — vanilla or React — presents to the router; route() below
  // never needs to know which pages are which. The original vanilla
  // implementations are untouched at ./pages/dashboard.js, ./pages/tasks.js,
  // ./pages/family.js, ./pages/billsense.js, ./pages/goals.js,
  // ./pages/ecolife.js, ./pages/timeline.js, ./pages/decisionflow.js,
  // ./pages/assistant.js and ./pages/settings.js for rollback: swap the
  // relevant line back to restore any of them exactly as it was. The
  // migration is now complete — every page is React.
  dashboard: () => import('/app/main.js').then((m) => ({ mount: m.mountDashboard, unmount: m.unmountDashboard })),
  tasks: () => import('/app/main.js').then((m) => ({ mount: m.mountTasks, unmount: m.unmountTasks })),
  family: () => import('/app/main.js').then((m) => ({ mount: m.mountFamily, unmount: m.unmountFamily })),
  billsense: () => import('/app/main.js').then((m) => ({ mount: m.mountBillsense, unmount: m.unmountBillsense })),
  documents: () => import('/app/main.js').then((m) => ({ mount: m.mountDocuments, unmount: m.unmountDocuments })),
  goals: () => import('/app/main.js').then((m) => ({ mount: m.mountGoals, unmount: m.unmountGoals })),
  ecolife: () => import('/app/main.js').then((m) => ({ mount: m.mountEcolife, unmount: m.unmountEcolife })),
  timeline: () => import('/app/main.js').then((m) => ({ mount: m.mountTimeline, unmount: m.unmountTimeline })),
  decisionflow: () => import('/app/main.js').then((m) => ({ mount: m.mountDecisionflow, unmount: m.unmountDecisionflow })),
  assistant: () => import('/app/main.js').then((m) => ({ mount: m.mountAssistant, unmount: m.unmountAssistant })),
  settings: () => import('/app/main.js').then((m) => ({ mount: m.mountSettings, unmount: m.unmountSettings })),
};

// Tracks whichever page module is currently mounted so it can be told to
// unmount before the next page overwrites #page-root's innerHTML. Every
// still-vanilla page module has no unmount() export, so this is a no-op
// for all of them — only the React-backed pages (Dashboard, Tasks) need
// it, to let React detach its reconciler cleanly instead of having its DOM
// nodes yanked out from under it by the next page's innerHTML write.
let currentPageModule = null;

async function route() {
  // No app shell yet (logged out / auth screen): nothing to route. Without
  // this, any hash change on the auth screen threw on a missing #page-root.
  if (!document.getElementById('page-root')) return;
  closeFloatPanels();
  if (currentPageModule && typeof currentPageModule.unmount === 'function') {
    currentPageModule.unmount();
  }
  currentPageModule = null;

  const hash = (location.hash || '#/dashboard').slice(2); // strip '#/'
  const [key, ...rest] = hash.split('/');
  const pageKey = key || 'dashboard';
  renderViewSwitch();
  renderModuleRail();

  const pageRoot = document.getElementById('page-root');
  if (!PAGES[pageKey]) {
    pageRoot.innerHTML = notFoundHtml();
    return;
  }
  pageRoot.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading…</div></div>`;
  try {
    const mod = await PAGES[pageKey]();
    currentPageModule = mod;
    await mod.mount(pageRoot, { params: rest, api, toast, state });
  } catch (err) {
    console.error(err);
    pageRoot.innerHTML = errorHtml(err);
  }
}

function notFoundHtml() {
  return `<div class="page"><div class="empty-state"><h3>Page not found</h3><p>That view doesn't exist.</p></div></div>`;
}
function errorHtml(err) {
  const msg = err instanceof ApiError ? err.message : 'Something went wrong loading this page.';
  return `<div class="page"><div class="empty-state">${icon('alert', 'icon-lg')}<h3>Couldn't load this page</h3><p>${escapeHtml(msg)}</p></div></div>`;
}

// ---------------------------------------------------------------------
// Notifications panel + polling
// ---------------------------------------------------------------------
let notifTimer = null;
function startNotificationPolling() {
  refreshNotifications();
  if (notifTimer) clearInterval(notifTimer);
  notifTimer = setInterval(refreshNotifications, 20000);
}

async function refreshNotifications() {
  try {
    const data = await api.get('/api/notifications');
    state.notifications = data.notifications;
    state.unreadCount = data.unreadCount;
    updateNotifChip();
  } catch {}
}

// Updates every visible notification-count surface from the one real
// source (state.unreadCount): the header bell's badge (shown >=860px),
// the account chip's compact badge (shown <860px, where the bell itself
// is hidden — see .header-icons in layout.css), and the rail's per-module
// unread dots. Never two different numbers competing for truth.
function updateNotifChip() {
  const unread = state.unreadCount > 0;
  const text = state.unreadCount > 9 ? '9+' : String(state.unreadCount);
  for (const id of ['notif-chip', 'notif-chip-compact']) {
    const chip = document.getElementById(id);
    if (!chip) continue;
    chip.style.display = unread ? 'flex' : 'none';
    chip.textContent = unread ? text : '';
  }
  updateRailBadges();
}

function closeFloatPanels() {
  document.getElementById('panel-root').innerHTML = '';
  document.getElementById('open-notifications')?.setAttribute('aria-expanded', 'false');
  document.getElementById('account-chip')?.setAttribute('aria-expanded', 'false');
  if (floatCloseHandlers) {
    document.removeEventListener('click', floatCloseHandlers.onDocClick);
    document.removeEventListener('keydown', floatCloseHandlers.onDocKey);
    floatCloseHandlers = null;
  }
}

function toggleNotificationsPanel() {
  const bell = document.getElementById('open-notifications');
  if (document.getElementById('notif-panel')) return closeFloatPanels();
  closeFloatPanels();
  const root = document.getElementById('panel-root');
  root.innerHTML = `
    <div class="float-panel" id="notif-panel" role="dialog" aria-label="Notifications">
      <div class="float-panel-header">
        <strong style="font-size:var(--fs-sm)">Notifications</strong>
        <button class="btn btn-sm btn-ghost" id="mark-all-read">Mark all read</button>
      </div>
      <div id="notif-list"></div>
    </div>
  `;
  renderNotifList();
  const panel = document.getElementById('notif-panel');
  positionFloatPanel(panel, bell);
  bell.setAttribute('aria-expanded', 'true');
  document.getElementById('mark-all-read').addEventListener('click', async () => {
    await api.post('/api/notifications/read-all');
    await refreshNotifications();
    renderNotifList();
  });
  bindOutsideClose(panel, bell);
}

function renderNotifList() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!state.notifications.length) {
    list.innerHTML = `<div class="empty-state"><p>You're all caught up.</p></div>`;
    return;
  }
  list.innerHTML = state.notifications
    .map(
      (n) => `
    <a class="row-item" href="${n.link || '#'}" data-id="${n.id}" style="text-decoration:none;${n.read ? '' : 'background:var(--brand-soft)'}">
      <div style="width:8px;height:8px;border-radius:50%;background:${n.read ? 'transparent' : 'var(--brand)'};flex-shrink:0"></div>
      <div class="row-main">
        <div class="row-title" style="white-space:normal">${escapeHtml(n.title)}</div>
        ${n.body ? `<div class="row-meta">${escapeHtml(n.body)}</div>` : ''}
        <div class="row-meta">${new Date(n.createdAt.replace(' ', 'T') + 'Z').toLocaleString()}</div>
      </div>
    </a>`
    )
    .join('');
  list.querySelectorAll('[data-id]').forEach((a) =>
    a.addEventListener('click', async () => {
      await api.post(`/api/notifications/${a.dataset.id}/read`);
      closeFloatPanels();
    })
  );
}

// ---------------------------------------------------------------------
// Command palette / global search
// ---------------------------------------------------------------------
function commandEmptyHtml(message) {
  return `<div class="empty-state" style="padding:var(--sp-8) var(--sp-6)">${icon('search', 'icon-lg')}<p>${message}</p></div>`;
}

function openCommandPalette() {
  const root = document.getElementById('panel-root');
  root.innerHTML = `
    <div class="command-overlay">
      <div class="modal-backdrop" id="cmd-backdrop"></div>
      <div class="command-panel">
        <div class="command-input-wrap">
          ${icon('search', 'icon icon-sm')}
          <input class="command-input" id="cmd-input" placeholder="Search tasks, bills, decisions, goals, messages…" autofocus />
        </div>
        <div class="command-results" id="cmd-results">${commandEmptyHtml('Type at least 2 characters to search.')}</div>
        <div class="command-hint"><span><kbd>↵</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>
      </div>
    </div>
  `;
  const input = document.getElementById('cmd-input');
  input.focus();
  document.getElementById('cmd-backdrop').addEventListener('click', closeFloatPanels);
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') {
      closeFloatPanels();
      document.removeEventListener('keydown', onEsc);
    }
  });

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const q = input.value.trim();
      const resultsEl = document.getElementById('cmd-results');
      if (q.length < 2) {
        resultsEl.innerHTML = commandEmptyHtml('Type at least 2 characters to search.');
        return;
      }
      const { results } = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
      if (!results.length) {
        resultsEl.innerHTML = commandEmptyHtml(`No results for "${escapeHtml(q)}".`);
        return;
      }
      resultsEl.innerHTML = results
        .map(
          (r) => `<a class="command-result" href="${r.link}" data-nav>${icon(typeIcon(r.type), 'icon icon-sm')}<span>${escapeHtml(r.title)}</span><span class="muted text-xs" style="margin-left:auto">${r.type}</span></a>`
        )
        .join('');
      resultsEl.querySelectorAll('[data-nav]').forEach((a) => a.addEventListener('click', closeFloatPanels));
    }, 220);
  });
}

function typeIcon(type) {
  return { task: 'tasks', bill: 'bill', decision: 'decision', goal: 'goal', message: 'message', comment: 'message' }[type] || 'search';
}

boot();
