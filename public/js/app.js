import { api, ApiError } from './api.js';
import { icon } from './components/icons.js';
import { toast, escapeHtml } from './components/toast.js';
import { initials } from './format.js';

// ---------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------
export const state = {
  user: null,
  aiConfigured: false,
  families: [],
  notifications: [],
  unreadCount: 0,
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'tasks', label: 'Tasks', icon: 'tasks' },
  { key: 'family', label: 'Family', icon: 'family' },
  { key: 'billsense', label: 'BillSense', icon: 'bill' },
  { key: 'decisionflow', label: 'DecisionFlow', icon: 'decision' },
  { key: 'ecolife', label: 'EcoLife', icon: 'eco' },
  { key: 'goals', label: 'Goals', icon: 'goal' },
  { key: 'timeline', label: 'Timeline', icon: 'timeline' },
  { key: 'assistant', label: 'Assistant', icon: 'assistant' },
];
const BOTTOM_NAV_KEYS = ['dashboard', 'tasks', 'family', 'assistant', 'settings'];

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

  if (state.user) {
    applyTheme(state.user.theme);
    await refreshFamilies();
    renderShell();
    startNotificationPolling();
  } else {
    renderAuth();
  }

  window.addEventListener('hashchange', route);
}

export function applyTheme(theme) {
  if (theme && theme !== 'system') {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('la-theme', theme); } catch {}
  } else {
    document.documentElement.removeAttribute('data-theme');
    try { localStorage.removeItem('la-theme'); } catch {}
  }
  updateThemeToggleIcon();
}

function effectiveTheme() {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit) return explicit;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeToggleIcon() {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = icon(effectiveTheme() === 'dark' ? 'sun' : 'moon');
}

async function toggleTheme() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  if (state.user) {
    try {
      const { user } = await api.patch('/api/settings/preferences', { theme: next });
      state.user = user;
    } catch {}
  }
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
  applyTheme(user.theme);
  await refreshFamilies();
  renderShell();
  startNotificationPolling();
}

// ---------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------
function renderShell() {
  appEl.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark">L</span> LifeAdmin</div>
        <nav class="sidebar-nav" id="sidebar-nav"></nav>
        <div class="sidebar-footer">
          <div class="user-chip" id="user-chip">
            <div class="avatar">${initials(state.user.firstName, state.user.lastName)}</div>
            <div style="min-width:0">
              <div class="user-chip-name">${escapeHtml(state.user.firstName)} ${escapeHtml(state.user.lastName)}</div>
              <div class="user-chip-sub">View settings</div>
            </div>
          </div>
        </div>
      </aside>
      <div class="main-col">
        <header class="topbar">
          <button class="icon-btn" id="mobile-menu-btn" style="display:none">${icon('menu')}</button>
          <div class="topbar-search" id="open-search"><span>${icon('search', 'icon icon-sm')}</span><span>Search LifeAdmin…</span><kbd>/</kbd></div>
          <div class="topbar-actions">
            <button class="icon-btn" id="theme-toggle" aria-label="Toggle dark mode">${icon(effectiveTheme() === 'dark' ? 'sun' : 'moon')}</button>
            <button class="icon-btn" id="open-notifications" aria-label="Notifications">${icon('bell')}<span class="chip-count" id="notif-chip" style="display:none"></span></button>
          </div>
        </header>
        <main id="page-root"></main>
      </div>
      <nav class="bottom-nav" id="bottom-nav"></nav>
    </div>
  `;

  renderNav();
  document.getElementById('user-chip').addEventListener('click', () => (location.hash = '#/settings'));
  document.getElementById('open-search').addEventListener('click', openCommandPalette);
  document.getElementById('open-notifications').addEventListener('click', toggleNotificationsPanel);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !isTyping(e.target)) {
      e.preventDefault();
      openCommandPalette();
    }
  });

  route();
}

function isTyping(target) {
  return ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
}

function renderNav() {
  const hash = location.hash || '#/dashboard';
  const current = hash.split('/')[1] || 'dashboard';

  const navHtml = NAV_ITEMS.map((item) => navLinkHtml(item, current)).join('');
  document.getElementById('sidebar-nav').innerHTML = `
    ${navHtml}
    <div class="sidebar-section">
      <a class="nav-link ${current === 'settings' ? 'active' : ''}" href="#/settings">${icon('settings')}<span>Settings</span></a>
      <a class="nav-link" href="#" id="logout-link">${icon('logout')}<span>Log out</span></a>
    </div>
  `;
  document.getElementById('logout-link').addEventListener('click', async (e) => {
    e.preventDefault();
    await api.post('/api/auth/logout');
    location.reload();
  });

  document.getElementById('bottom-nav').innerHTML = NAV_ITEMS.filter((i) => BOTTOM_NAV_KEYS.includes(i.key))
    .concat([{ key: 'settings', label: 'Settings', icon: 'settings' }])
    .map((item) => `<a class="bottom-nav-item ${current === item.key ? 'active' : ''}" href="#/${item.key}">${icon(item.icon, 'icon icon-sm')}<span>${item.label}</span></a>`)
    .join('');
}

function navLinkHtml(item, current) {
  return `<a class="nav-link ${current === item.key ? 'active' : ''}" href="#/${item.key}">${icon(item.icon)}<span>${item.label}</span></a>`;
}

// ---------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------
const PAGES = {
  dashboard: () => import('./pages/dashboard.js'),
  tasks: () => import('./pages/tasks.js'),
  family: () => import('./pages/family.js'),
  billsense: () => import('./pages/billsense.js'),
  decisionflow: () => import('./pages/decisionflow.js'),
  ecolife: () => import('./pages/ecolife.js'),
  goals: () => import('./pages/goals.js'),
  timeline: () => import('./pages/timeline.js'),
  assistant: () => import('./pages/assistant.js'),
  settings: () => import('./pages/settings.js'),
};

async function route() {
  closeFloatPanels();
  const hash = (location.hash || '#/dashboard').slice(2); // strip '#/'
  const [key, ...rest] = hash.split('/');
  const pageKey = key || 'dashboard';
  renderNav();

  const pageRoot = document.getElementById('page-root');
  if (!PAGES[pageKey]) {
    pageRoot.innerHTML = notFoundHtml();
    return;
  }
  pageRoot.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading…</div></div>`;
  try {
    const mod = await PAGES[pageKey]();
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

function updateNotifChip() {
  const chip = document.getElementById('notif-chip');
  if (!chip) return;
  if (state.unreadCount > 0) {
    chip.style.display = 'flex';
    chip.textContent = state.unreadCount > 9 ? '9+' : state.unreadCount;
  } else {
    chip.style.display = 'none';
  }
}

function closeFloatPanels() {
  document.getElementById('panel-root').innerHTML = '';
}

function toggleNotificationsPanel() {
  const root = document.getElementById('panel-root');
  if (root.innerHTML) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = `
    <div class="float-panel" id="notif-panel">
      <div class="float-panel-header">
        <strong style="font-size:var(--fs-sm)">Notifications</strong>
        <button class="btn btn-sm btn-ghost" id="mark-all-read">Mark all read</button>
      </div>
      <div id="notif-list"></div>
    </div>
  `;
  renderNotifList();
  document.getElementById('mark-all-read').addEventListener('click', async () => {
    await api.post('/api/notifications/read-all');
    await refreshNotifications();
    renderNotifList();
  });
  setTimeout(() => document.addEventListener('click', outsideNotifClick), 0);
}

function outsideNotifClick(e) {
  const panel = document.getElementById('notif-panel');
  if (panel && !panel.contains(e.target) && e.target.id !== 'open-notifications' && !e.target.closest('#open-notifications')) {
    closeFloatPanels();
    document.removeEventListener('click', outsideNotifClick);
  }
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
function openCommandPalette() {
  const root = document.getElementById('panel-root');
  root.innerHTML = `
    <div class="command-overlay">
      <div class="modal-backdrop" id="cmd-backdrop"></div>
      <div class="command-panel">
        <input class="command-input" id="cmd-input" placeholder="Search tasks, bills, decisions, goals, messages…" autofocus />
        <div class="command-results" id="cmd-results"><div class="empty-state" style="padding:var(--sp-6)"><p>Type at least 2 characters to search.</p></div></div>
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
        resultsEl.innerHTML = `<div class="empty-state" style="padding:var(--sp-6)"><p>Type at least 2 characters to search.</p></div>`;
        return;
      }
      const { results } = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
      if (!results.length) {
        resultsEl.innerHTML = `<div class="empty-state" style="padding:var(--sp-6)"><p>No results for "${escapeHtml(q)}".</p></div>`;
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
