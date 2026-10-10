import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirm.js';
import { fmtRelative, initials } from '../format.js';

let ctxRef;
let activeFamilyId = null;
let activeTab = 'overview';
let chatPollTimer = null;

export async function mount(root, ctx) {
  ctxRef = ctx;
  clearInterval(chatPollTimer);
  const { api, state } = ctx;

  const { families } = await api.get('/api/family');
  state.families = families;

  if (!families.length) {
    root.innerHTML = noFamilyHtml();
    document.getElementById('create-family-btn').addEventListener('click', () => openCreateFamily(root, ctx));
    document.getElementById('join-family-btn').addEventListener('click', () => openJoinFamily(root, ctx));
    return;
  }

  if (!activeFamilyId || !families.find((f) => f.id === activeFamilyId)) activeFamilyId = families[0].id;

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Family</h1>
          <p class="page-subtitle">Shared responsibilities, chat, and activity.</p>
        </div>
        <div class="page-actions">
          ${families.length > 1 ? `<select class="select" id="family-switcher" style="width:auto">${families.map((f) => `<option value="${f.id}" ${f.id === activeFamilyId ? 'selected' : ''}>${escapeHtml(f.name)}</option>`).join('')}</select>` : ''}
          <button class="btn" id="join-family-btn2">Join with a code</button>
          <button class="btn" id="create-family-btn2">${icon('plus', 'icon-sm')} New family</button>
        </div>
      </div>
      <div class="tabs family-tabs-wrap" id="family-tabs">
        ${tab('overview', 'Overview')}${tab('members', 'Members')}${tab('chat', 'Chat')}${tab('shopping', 'Shopping list')}${tab('activity', 'Activity')}
      </div>
      <div id="family-tab-content"></div>
    </div>
  `;

  const switcher = document.getElementById('family-switcher');
  if (switcher) switcher.addEventListener('change', (e) => { activeFamilyId = Number(e.target.value); mount(root, ctx); });
  document.getElementById('create-family-btn2').addEventListener('click', () => openCreateFamily(root, ctx));
  document.getElementById('join-family-btn2').addEventListener('click', () => openJoinFamily(root, ctx));

  document.querySelectorAll('#family-tabs .tab').forEach((t) =>
    t.addEventListener('click', () => {
      activeTab = t.dataset.tab;
      renderTabs();
      renderTabContent();
    })
  );

  renderTabContent();
}

function tab(key, label) {
  return `<div class="tab ${activeTab === key ? 'active' : ''}" data-tab="${key}">${label}</div>`;
}
function renderTabs() {
  document.querySelectorAll('#family-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === activeTab));
}

function currentFamily() {
  return ctxRef.state.families.find((f) => f.id === activeFamilyId);
}

async function renderTabContent() {
  const el = document.getElementById('family-tab-content');
  clearInterval(chatPollTimer);
  if (activeTab === 'overview') return renderOverview(el);
  if (activeTab === 'members') return renderMembers(el);
  if (activeTab === 'chat') return renderChat(el);
  if (activeTab === 'shopping') return renderShopping(el);
  if (activeTab === 'activity') return renderActivity(el);
}

// ---------------------------------------------------------------------
function noFamilyHtml() {
  return `
    <div class="page">
      <div class="page-header"><div><h1 class="page-title">Family</h1><p class="page-subtitle">Shared responsibilities, chat, and activity.</p></div></div>
      <div class="card">
        <div class="empty-state">
          ${icon('family', 'icon-lg')}
          <h3>No family yet</h3>
          <p>Create a family to share tasks, bills, a chat and a shopping list with the people you live with.</p>
          <div class="row" style="margin-top:var(--sp-2);gap:var(--sp-2)">
            <button class="btn btn-primary" id="create-family-btn">Create a family</button>
            <button class="btn" id="join-family-btn">Join with a code</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openCreateFamily(root, ctx) {
  openModal({
    title: 'Create a family',
    bodyHtml: `
      <form id="family-form" class="stack">
        <div class="field"><label class="field-label">Family name</label><input class="input" name="name" placeholder="The Smiths" required /></div>
      </form>
    `,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="create-family-save">Create</button>`,
    onMount: () => {
      document.getElementById('create-family-save').addEventListener('click', async () => {
        const name = document.querySelector('#family-form [name=name]').value.trim();
        if (!name) return ctx.toast('Family name is required.', 'error');
        try {
          const { family } = await ctx.api.post('/api/family', { name });
          activeFamilyId = family.id;
          closeModal();
          ctx.toast('Family created', 'success');
          mount(root, ctx);
        } catch (err) {
          ctx.toast(err.message, 'error');
        }
      });
    },
  });
}

function openJoinFamily(root, ctx) {
  openModal({
    title: 'Join a family',
    bodyHtml: `
      <form id="join-family-form" class="stack">
        <div class="field"><label class="field-label">Invite code</label><input class="input" name="code" placeholder="e.g. A1B2C3D4" style="text-transform:uppercase" required /></div>
      </form>
    `,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="join-family-save">Join</button>`,
    onMount: () => {
      document.getElementById('join-family-save').addEventListener('click', async () => {
        const code = document.querySelector('#join-family-form [name=code]').value.trim();
        if (!code) return ctx.toast('Enter an invite code.', 'error');
        try {
          const { family } = await ctx.api.post('/api/family/join', { code });
          activeFamilyId = family.id;
          closeModal();
          ctx.toast(`Joined ${family.name}`, 'success');
          mount(root, ctx);
        } catch (err) {
          ctx.toast(err.message, 'error');
        }
      });
    },
  });
}

// ---------------------------------------------------------------------
async function renderOverview(el) {
  const { api } = ctxRef;
  el.innerHTML = `<div class="loading-line"><span class="spinner"></span> Loading…</div>`;
  const { tasks } = await api.get(`/api/tasks?familyId=${activeFamilyId}`);
  const family = currentFamily();

  el.innerHTML = `
    <div class="dash-grid">
      <div class="card card-pad">
        <div class="card-header"><span class="card-title">Shared tasks</span><span class="muted text-xs">${tasks.length}</span></div>
        ${tasks.length ? `<div class="row-list">${tasks.slice(0, 10).map((t) => `
          <a class="row-item" href="#/tasks/${t.id}" style="text-decoration:none">
            <div class="row-check" style="pointer-events:none;${t.status === 'completed' ? 'background:var(--accent-500);border-color:var(--accent-500);color:#fff' : ''}">${t.status === 'completed' ? icon('check', 'icon-sm') : ''}</div>
            <div class="row-main"><div class="row-title ${t.status === 'completed' ? 'done' : ''}">${escapeHtml(t.title)}</div><div class="row-meta">${t.assigneeName ? `Assigned to ${escapeHtml(t.assigneeName)}` : 'Unassigned'}</div></div>
          </a>`).join('')}</div>` : `<p class="muted text-sm">No shared tasks yet. Create a task and set visibility to family.</p>`}
      </div>
      <div class="card card-pad">
        <div class="card-header"><span class="card-title">Invite code</span></div>
        <p class="text-sm muted">Share this code so someone can join manually, or add them directly by phone number in the Members tab.</p>
        <div class="row" style="margin-top:var(--sp-2)"><code style="background:var(--bg-sunken);padding:6px 10px;border-radius:var(--radius-sm);font-weight:700;letter-spacing:0.05em">${family.inviteCode}</code></div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
async function renderMembers(el) {
  const { api, toast, state } = ctxRef;
  const family = currentFamily();
  const myRole = family.members.find((m) => m.userId === state.user.id)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  el.innerHTML = `
    <div class="card card-pad">
      <div class="card-header">
        <span class="card-title">Members</span>
        ${canManage ? `<button class="btn btn-sm btn-primary" id="add-member-btn">${icon('plus', 'icon-sm')} Add by phone</button>` : ''}
      </div>
      <div class="member-grid">
        ${family.members.map((m) => memberCard(m, myRole, canManage)).join('')}
      </div>
    </div>
  `;

  const addBtn = document.getElementById('add-member-btn');
  if (addBtn) addBtn.addEventListener('click', () => openAddMember());

  el.querySelectorAll('[data-remove-member]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Remove member?', message: 'They will lose access to shared family data.', confirmLabel: 'Remove' });
      if (!ok) return;
      await api.del(`/api/family/${activeFamilyId}/members/${btn.dataset.removeMember}`);
      toast('Member removed', 'success');
      const { families } = await api.get('/api/family');
      state.families = families;
      renderMembers(el);
    })
  );
}

function memberCard(m, myRole, canManage) {
  return `
    <div class="card member-card">
      <div class="avatar">${initials(...(m.displayName || '').split(' '))}</div>
      <div style="flex:1;min-width:0">
        <div class="text-sm" style="font-weight:650">${escapeHtml(m.displayName)}</div>
        <div class="text-xs muted member-role">${m.role}${m.registered ? '' : ' · invited'}</div>
      </div>
      ${canManage && m.role !== 'owner' ? `<button class="icon-btn" data-remove-member="${m.id}" aria-label="Remove">${icon('x', 'icon-sm')}</button>` : ''}
    </div>
  `;
}

function openAddMember() {
  const { api, toast, state } = ctxRef;
  openModal({
    title: 'Add a family member',
    bodyHtml: `
      <form id="member-form" class="stack">
        <p class="text-sm muted">Members are identified by phone number (names can be identical).</p>
        <div class="field"><label class="field-label">Phone number</label><input class="input" name="phone" placeholder="+383 44 123 456" required /></div>
        <div class="field"><label class="field-label">Display name (optional)</label><input class="input" name="displayName" placeholder="e.g. Mom" /></div>
      </form>
    `,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="add-member-save">Add member</button>`,
    onMount: () => {
      document.getElementById('add-member-save').addEventListener('click', async () => {
        const form = document.getElementById('member-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.phone.trim()) return toast('Phone number is required.', 'error');
        try {
          await api.post(`/api/family/${activeFamilyId}/members`, fd);
          toast('Member added', 'success');
          closeModal();
          const { families } = await api.get('/api/family');
          state.families = families;
          renderMembers(document.getElementById('family-tab-content'));
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}

// ---------------------------------------------------------------------
async function renderChat(el) {
  const { api, toast, state } = ctxRef;
  el.innerHTML = `
    <div class="card card-pad">
      <div class="chat-window">
        <div class="chat-messages" id="chat-messages"><div class="loading-line"><span class="spinner"></span> Loading messages…</div></div>
        <form class="chat-input-row" id="chat-form">
          <input class="input" name="body" placeholder="Message the family…" style="flex:1" autocomplete="off" />
          <button class="btn btn-primary btn-icon" type="submit" aria-label="Send">${icon('send', 'icon-sm')}</button>
        </form>
      </div>
    </div>
  `;

  async function load() {
    const { messages } = await api.get(`/api/chat/${activeFamilyId}/messages`);
    const box = document.getElementById('chat-messages');
    if (!box) return;
    const wasAtBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 40;
    if (!messages.length) {
      box.innerHTML = `<div class="empty-state"><p>No messages yet. Say hello.</p></div>`;
      return;
    }
    box.innerHTML = messages.map((m) => chatBubble(m, state.user.id)).join('');
    if (wasAtBottom || box.dataset.first !== 'done') {
      box.scrollTop = box.scrollHeight;
      box.dataset.first = 'done';
    }
  }
  await load();
  chatPollTimer = setInterval(load, 6000);

  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.body;
    if (!input.value.trim()) return;
    const val = input.value.trim();
    input.value = '';
    try {
      await api.post(`/api/chat/${activeFamilyId}/messages`, { body: val });
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

function chatBubble(m, myId) {
  const self = m.authorId === myId;
  return `
    <div class="chat-bubble-row ${self ? 'self' : ''}">
      ${!self ? `<div class="avatar avatar-sm">${initials(...m.authorName.split(' '))}</div>` : ''}
      <div>
        <div class="chat-bubble">${escapeHtml(m.body)}</div>
        <div class="chat-meta">${!self ? escapeHtml(m.authorName) + ' · ' : ''}${fmtRelative(m.createdAt)}</div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
async function renderShopping(el) {
  const { api } = ctxRef;
  el.innerHTML = `<div class="card card-pad"><div class="loading-line"><span class="spinner"></span> Loading…</div></div>`;
  const { items } = await api.get(`/api/family/${activeFamilyId}/shopping`);

  el.innerHTML = `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Shopping list</span></div>
      <form class="row" id="shopping-form" style="margin-bottom:var(--sp-4)">
        <input class="input" name="name" placeholder="Add an item…" style="flex:1" />
        <input class="input" name="quantity" placeholder="Qty" style="width:90px" />
        <button class="btn btn-primary" type="submit">${icon('plus', 'icon-sm')}</button>
      </form>
      ${items.length ? `<div class="stack">${items.map(shoppingRow).join('')}</div>` : `<p class="muted text-sm">List is empty.</p>`}
    </div>
  `;

  document.getElementById('shopping-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    if (!fd.name.trim()) return;
    await api.post(`/api/family/${activeFamilyId}/shopping`, fd);
    renderShopping(el);
  });
  el.querySelectorAll('[data-toggle-item]').forEach((cb) =>
    cb.addEventListener('click', async () => {
      const done = cb.classList.contains('checked');
      await api.patch(`/api/family/${activeFamilyId}/shopping/${cb.dataset.toggleItem}`, { done: !done });
      renderShopping(el);
    })
  );
  el.querySelectorAll('[data-delete-item]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      await api.del(`/api/family/${activeFamilyId}/shopping/${btn.dataset.deleteItem}`);
      renderShopping(el);
    })
  );
}

function shoppingRow(item) {
  return `
    <div class="shopping-item ${item.done ? 'done' : ''}">
      <button class="row-check ${item.done ? 'checked' : ''}" data-toggle-item="${item.id}">${icon('check')}</button>
      <div class="shopping-name" style="flex:1">${escapeHtml(item.name)} ${item.quantity ? `<span class="muted text-xs">(${escapeHtml(item.quantity)})</span>` : ''}</div>
      <button class="icon-btn" data-delete-item="${item.id}" aria-label="Remove">${icon('x', 'icon-sm')}</button>
    </div>
  `;
}

// ---------------------------------------------------------------------
async function renderActivity(el) {
  const { api } = ctxRef;
  el.innerHTML = `<div class="card card-pad"><div class="loading-line"><span class="spinner"></span> Loading…</div></div>`;
  const { activity } = await api.get(`/api/family/${activeFamilyId}/activity`);
  el.innerHTML = `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Activity</span></div>
      ${activity.length ? `<div class="row-list">${activity.map((a) => `
        <a class="row-item" href="${a.link || '#'}" style="text-decoration:none">
          <div class="row-main"><div class="row-title" style="white-space:normal;font-weight:500">${escapeHtml(a.summary)}</div><div class="row-meta">${fmtRelative(a.createdAt)}</div></div>
        </a>`).join('')}</div>` : `<p class="muted text-sm">No activity yet.</p>`}
    </div>
  `;
}
