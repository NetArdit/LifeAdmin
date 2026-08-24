import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';
import { applyTheme } from '../app.js';

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: 'family' },
  { key: 'security', label: 'Security', icon: 'settings' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'appearance', label: 'Appearance', icon: 'sun' },
  { key: 'ai', label: 'AI preferences', icon: 'sparkle' },
  { key: 'data', label: 'Data', icon: 'download' },
  { key: 'demo', label: 'Demo mode', icon: 'star' },
];

let ctxRef, rootRef, activeSection = 'profile';

export async function mount(root, ctx) {
  ctxRef = ctx;
  rootRef = root;

  root.innerHTML = `
    <div class="page">
      <div class="page-header"><div><h1 class="page-title">Settings</h1><p class="page-subtitle">Manage your profile, security, and preferences.</p></div></div>
      <div class="settings-layout">
        <nav class="settings-nav" id="settings-nav">
          ${SECTIONS.map((s) => `<a class="nav-link ${activeSection === s.key ? 'active' : ''}" href="#" data-section="${s.key}">${icon(s.icon)}<span>${s.label}</span></a>`).join('')}
        </nav>
        <div id="settings-content"></div>
      </div>
    </div>
  `;

  document.querySelectorAll('#settings-nav [data-section]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      activeSection = a.dataset.section;
      mount(root, ctx);
    })
  );

  renderSection();
}

function renderSection() {
  const content = document.getElementById('settings-content');
  const renderers = { profile: renderProfile, security: renderSecurity, notifications: renderNotifications, appearance: renderAppearance, ai: renderAi, data: renderData, demo: renderDemo };
  renderers[activeSection](content);
}

// -----------------------------------------------------------------------
function renderProfile(content) {
  const { state } = ctxRef;
  content.innerHTML = `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Profile</span></div>
      <form id="profile-form" class="stack" style="max-width:360px">
        <div class="grid-2">
          <div class="field"><label class="field-label">First name</label><input class="input" name="firstName" value="${escapeHtml(state.user.firstName)}" /></div>
          <div class="field"><label class="field-label">Last name</label><input class="input" name="lastName" value="${escapeHtml(state.user.lastName)}" /></div>
        </div>
        <div class="field"><label class="field-label">Email</label><input class="input" value="${escapeHtml(state.user.email)}" disabled /><span class="field-hint">${state.user.emailVerified ? 'Verified' : 'Not verified'}</span></div>
        <div class="field"><label class="field-label">Phone</label><input class="input" value="${escapeHtml(state.user.phone)}" disabled /><span class="field-hint">${state.user.phoneVerified ? 'Verified' : 'Not verified'}</span></div>
        <button class="btn btn-primary" type="submit" style="align-self:flex-start">Save changes</button>
      </form>
    </div>
  `;
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    try {
      const { user } = await ctxRef.api.patch('/api/settings/profile', fd);
      state.user = user;
      ctxRef.toast('Profile updated', 'success');
    } catch (err) {
      ctxRef.toast(err.message, 'error');
    }
  });
}

// -----------------------------------------------------------------------
function renderSecurity(content) {
  const { state } = ctxRef;
  content.innerHTML = `
    <div class="stack">
      <div class="card card-pad">
        <div class="card-header"><span class="card-title">Change password</span></div>
        <form id="password-form" class="stack" style="max-width:340px">
          <div class="field"><label class="field-label">Current password</label><input class="input" type="password" name="currentPassword" required /></div>
          <div class="field"><label class="field-label">New password</label><input class="input" type="password" name="newPassword" required /></div>
          <button class="btn btn-primary" type="submit" style="align-self:flex-start">Update password</button>
        </form>
      </div>
      <div class="card card-pad">
        <div class="card-header"><span class="card-title">Verification</span></div>
        <p class="text-sm muted" style="margin-bottom:var(--sp-3)">Real SMS/email delivery requires an external provider — this is not configured in the local demo. You can still test the verification flow: a code is generated and shown to you directly (demo mode).</p>
        <div class="row" style="gap:var(--sp-4)">
          ${verifyRow('phone', state.user.phoneVerified)}
          ${verifyRow('email', state.user.emailVerified)}
        </div>
      </div>
    </div>
  `;
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    try {
      await ctxRef.api.post('/api/settings/password', fd);
      ctxRef.toast('Password updated', 'success');
      e.target.reset();
    } catch (err) {
      ctxRef.toast(err.message, 'error');
    }
  });
  content.querySelectorAll('[data-verify]').forEach((btn) => btn.addEventListener('click', () => openVerifyFlow(btn.dataset.verify)));
}

function verifyRow(channel, verified) {
  return `
    <div class="row" style="gap:var(--sp-2)">
      <span class="badge ${verified ? 'badge-success' : 'badge-neutral'}">${channel} ${verified ? 'verified' : 'unverified'}</span>
      ${!verified ? `<button class="btn btn-sm" data-verify="${channel}">Verify now</button>` : ''}
    </div>
  `;
}

function openVerifyFlow(channel) {
  const { api, toast, state } = ctxRef;
  import('../components/modal.js').then(async ({ openModal, closeModal }) => {
    openModal({ title: `Verify your ${channel}`, bodyHtml: `<div class="loading-line"><span class="spinner"></span> Requesting code…</div>` });
    const result = await api.post(`/api/auth/verify/${channel}/request`, {});
    const body = document.querySelector('#modal-root .modal-body');
    body.innerHTML = `
      <div style="background:var(--bg-sunken);border-radius:var(--radius-md);padding:var(--sp-3);margin-bottom:var(--sp-4)">
        <p class="text-xs muted" style="margin-bottom:4px">${escapeHtml(result.message)}</p>
        <p class="text-sm">Demo code: <strong style="letter-spacing:0.1em;font-size:var(--fs-md)">${result.demoCode}</strong></p>
      </div>
      <form id="verify-form" class="stack">
        <div class="field"><label class="field-label">Enter the code</label><input class="input" name="code" maxlength="6" required /></div>
      </form>
    `;
    document.querySelector('#modal-root .modal-footer')?.remove();
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="verify-confirm-btn">Confirm</button>`;
    document.querySelector('#modal-root .modal-panel').appendChild(footer);
    footer.querySelector('[data-close]').addEventListener('click', closeModal);
    footer.querySelector('#verify-confirm-btn').addEventListener('click', async () => {
      const code = document.querySelector('#verify-form [name=code]').value.trim();
      try {
        const r = await api.post(`/api/auth/verify/${channel}/confirm`, { code });
        state.user = r.user;
        toast(`${channel} verified`, 'success');
        closeModal();
        mount(rootRef, ctxRef);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

// -----------------------------------------------------------------------
function renderNotifications(content) {
  const { state } = ctxRef;
  const prefs = state.user.notifPrefs || {};
  const items = [
    { key: 'task', label: 'Task reminders & deadlines' },
    { key: 'comment', label: 'Comments on shared items' },
    { key: 'chat', label: 'Family chat messages' },
    { key: 'bill', label: 'Bill due dates' },
    { key: 'decision', label: 'Decisions pending' },
    { key: 'ai', label: 'AI suggestions' },
  ];
  content.innerHTML = `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Notification preferences</span></div>
      <div class="stack" id="notif-prefs-list">
        ${items.map((i) => `<label class="checkbox-row"><input type="checkbox" data-pref="${i.key}" ${prefs[i.key] !== false ? 'checked' : ''} /> ${i.label}</label>`).join('')}
      </div>
      <p class="text-xs muted" style="margin-top:var(--sp-3)">Browser notifications are used when your browser allows it. No paid push service is required.</p>
      <button class="btn" id="enable-browser-notif" style="margin-top:var(--sp-2)">Enable browser notifications</button>
    </div>
  `;
  content.querySelectorAll('[data-pref]').forEach((cb) =>
    cb.addEventListener('change', async () => {
      const notifPrefs = { ...prefs };
      content.querySelectorAll('[data-pref]').forEach((c) => (notifPrefs[c.dataset.pref] = c.checked));
      await ctxRef.api.patch('/api/settings/preferences', { notifPrefs });
      state.user.notifPrefs = notifPrefs;
      ctxRef.toast('Preferences saved', 'success');
    })
  );
  document.getElementById('enable-browser-notif').addEventListener('click', async () => {
    if (!('Notification' in window)) return ctxRef.toast('Browser notifications are not supported here.', 'error');
    const perm = await Notification.requestPermission();
    ctxRef.toast(perm === 'granted' ? 'Browser notifications enabled' : 'Permission not granted', perm === 'granted' ? 'success' : 'info');
  });
}

// -----------------------------------------------------------------------
function renderAppearance(content) {
  const { state } = ctxRef;
  content.innerHTML = `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Appearance</span></div>
      <div class="row" style="gap:var(--sp-2)">
        ${['system', 'light', 'dark'].map((t) => `<button class="pill ${state.user.theme === t ? 'active' : ''}" data-theme="${t}" style="text-transform:capitalize">${t}</button>`).join('')}
      </div>
    </div>
  `;
  content.querySelectorAll('[data-theme]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const theme = btn.dataset.theme;
      const { user } = await ctxRef.api.patch('/api/settings/preferences', { theme });
      state.user = user;
      applyTheme(theme);
      renderSection();
    })
  );
}

// -----------------------------------------------------------------------
function renderAi(content) {
  const { state } = ctxRef;
  content.innerHTML = `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">AI preferences</span></div>
      <p class="text-sm muted" style="margin-bottom:var(--sp-3)">Server status: <strong>${state.aiConfigured ? 'AI enabled' : 'AI not configured (needs ANTHROPIC_API_KEY)'}</strong></p>
      <label class="checkbox-row"><input type="checkbox" id="ai-enabled-toggle" ${state.user.aiEnabled ? 'checked' : ''} /> Use AI features (assistant, DecisionFlow analysis, planning, insights)</label>
      <p class="text-xs muted" style="margin-top:var(--sp-3)">LifeAdmin only sends the minimum context needed for each request — never your whole database — to control cost and protect privacy.</p>
    </div>
  `;
  document.getElementById('ai-enabled-toggle').addEventListener('change', async (e) => {
    const { user } = await ctxRef.api.patch('/api/settings/preferences', { aiEnabled: e.target.checked });
    state.user = user;
    ctxRef.toast('Preference saved', 'success');
  });
}

// -----------------------------------------------------------------------
function renderData(content) {
  content.innerHTML = `
    <div class="stack">
      <div class="card card-pad">
        <div class="card-header"><span class="card-title">Export your data</span></div>
        <p class="text-sm muted" style="margin-bottom:var(--sp-3)">Download everything you own as a JSON file.</p>
        <button class="btn" id="export-btn">${icon('download', 'icon-sm')} Export as JSON</button>
      </div>
      <div class="card card-pad" style="border-color:var(--danger-400)">
        <div class="card-header"><span class="card-title" style="color:var(--danger-500)">Delete account</span></div>
        <p class="text-sm muted" style="margin-bottom:var(--sp-3)">Permanently deletes your account and all associated data on this machine. This cannot be undone.</p>
        <button class="btn btn-danger" id="delete-account-btn">Delete my account</button>
      </div>
    </div>
  `;
  document.getElementById('export-btn').addEventListener('click', async () => {
    const res = await fetch('/api/settings/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifeadmin-export.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('delete-account-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Delete your account?', message: 'This permanently deletes your account and everything you own. This cannot be undone.', confirmLabel: 'Delete everything' });
    if (!ok) return;
    const password = prompt('Enter your password to confirm:');
    if (!password) return;
    try {
      await ctxRef.api.del('/api/settings/account', { password });
      location.reload();
    } catch (err) {
      ctxRef.toast(err.message, 'error');
    }
  });
}

// -----------------------------------------------------------------------
function renderDemo(content) {
  content.innerHTML = `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Demo mode</span></div>
      <p class="text-sm muted" style="margin-bottom:var(--sp-3)">Load sample tasks, bills, a family, decisions, goals and eco logs to explore LifeAdmin quickly. You can clear demo-tagged tasks/bills at any time.</p>
      <div class="row" style="gap:var(--sp-2)">
        <button class="btn btn-primary" id="seed-btn">Load demo data</button>
        <button class="btn" id="clear-btn">Clear demo data</button>
      </div>
    </div>
  `;
  document.getElementById('seed-btn').addEventListener('click', async () => {
    await ctxRef.api.post('/api/demo/seed');
    ctxRef.toast('Demo data loaded — check the Dashboard', 'success');
  });
  document.getElementById('clear-btn').addEventListener('click', async () => {
    await ctxRef.api.post('/api/demo/clear');
    ctxRef.toast('Demo-tagged tasks and bills cleared', 'success');
  });
}
