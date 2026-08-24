import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirm.js';
import { fmtRelative, ECO_CATEGORY_LABEL } from '../format.js';

const CATEGORIES = ['transport', 'energy', 'food', 'shopping', 'waste', 'water'];
const CATEGORY_ICON = { transport: 'refresh', energy: 'sun', food: 'cart', shopping: 'cart', waste: 'trash', water: 'refresh' };
let ctxRef, rootRef;

export async function mount(root, ctx) {
  ctxRef = ctx;
  rootRef = root;
  root.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading EcoLife…</div></div>`;
  await renderAll();
}

async function renderAll() {
  const { api } = ctxRef;
  const [{ summary, totalLogs }, { logs }] = await Promise.all([api.get('/api/ecolife/summary'), api.get('/api/ecolife')]);

  rootRef.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">EcoLife</h1><p class="page-subtitle">Track habits and get practical, honest sustainability suggestions.</p></div>
        <div class="page-actions">
          <button class="btn" id="tips-btn">${icon('sparkle', 'icon-sm')} Get tips</button>
          <button class="btn btn-primary" id="log-btn">${icon('plus', 'icon-sm')} Log an action</button>
        </div>
      </div>

      <div id="tips-card"></div>

      <div class="grid-3" style="margin-bottom:var(--sp-6)">
        ${CATEGORIES.map((cat) => categoryTile(cat, summary[cat])).join('')}
      </div>

      <div class="card card-pad">
        <div class="card-header"><span class="card-title">Recent activity</span><span class="muted text-xs">${totalLogs} logged in last 30 days</span></div>
        ${logs.length ? `<div class="row-list">${logs.slice(0, 15).map(logRow).join('')}</div>` : `<div class="empty-state">${icon('eco', 'icon-lg')}<h3>No logs yet</h3><p>Log small everyday actions — taking the bus, recycling, a meatless meal — to see patterns and get tips.</p></div>`}
      </div>
    </div>
  `;

  document.getElementById('log-btn').addEventListener('click', openLogForm);
  document.getElementById('tips-btn').addEventListener('click', loadTips);
  rootRef.querySelectorAll('[data-delete-log]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Delete this log?', message: 'This entry will be permanently removed.', confirmLabel: 'Delete' });
      if (!ok) return;
      await ctxRef.api.del(`/api/ecolife/${btn.dataset.deleteLog}`);
      renderAll();
    })
  );
}

function categoryTile(cat, data) {
  return `
    <div class="card eco-cat-card">
      <div class="eco-cat-icon">${icon(CATEGORY_ICON[cat], 'icon')}</div>
      <div style="font-weight:700;font-size:var(--fs-lg)">${data.count}</div>
      <div class="muted text-xs">${ECO_CATEGORY_LABEL[cat]} logs</div>
    </div>
  `;
}

function logRow(l) {
  return `
    <div class="row-item">
      <div class="eco-cat-icon" style="width:32px;height:32px">${icon(CATEGORY_ICON[l.category] || 'eco', 'icon-sm')}</div>
      <div class="row-main">
        <div class="row-title">${escapeHtml(l.action)}</div>
        <div class="row-meta"><span style="text-transform:capitalize">${l.category}</span>${l.quantity ? `<span>${l.quantity}${l.unit ? ' ' + l.unit : ''}</span>` : ''}<span>${fmtRelative(l.logged_at)}</span></div>
      </div>
      <button class="icon-btn" data-delete-log="${l.id}" aria-label="Delete">${icon('x', 'icon-sm')}</button>
    </div>
  `;
}

function openLogForm() {
  const { api, toast } = ctxRef;
  openModal({
    title: 'Log an eco action',
    bodyHtml: `
      <form id="eco-form" class="stack">
        <div class="field"><label class="field-label">Category</label><select class="select" name="category">${CATEGORIES.map((c) => `<option value="${c}">${ECO_CATEGORY_LABEL[c]}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">What did you do?</label><input class="input" name="action" placeholder="e.g. Took the bus instead of driving" required /></div>
        <div class="grid-2">
          <div class="field"><label class="field-label">Quantity (optional)</label><input class="input" type="number" step="0.1" name="quantity" /></div>
          <div class="field"><label class="field-label">Unit</label><input class="input" name="unit" placeholder="km, kg, kWh…" /></div>
        </div>
      </form>
    `,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="eco-save">Log it</button>`,
    onMount: () => {
      document.getElementById('eco-save').addEventListener('click', async () => {
        const form = document.getElementById('eco-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.action.trim()) return toast('Describe the action.', 'error');
        const payload = { category: fd.category, action: fd.action.trim(), quantity: fd.quantity ? Number(fd.quantity) : null, unit: fd.unit || null };
        try {
          await api.post('/api/ecolife', payload);
          toast('Logged', 'success');
          closeModal();
          renderAll();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}

async function loadTips() {
  const { api, toast, state } = ctxRef;
  const card = document.getElementById('tips-card');
  if (!state.aiConfigured) {
    card.innerHTML = `<div class="card card-pad" style="margin-bottom:var(--sp-5)"><p class="text-sm muted">${icon('info', 'icon-sm')} AI tips require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo.</p></div>`;
    return;
  }
  card.innerHTML = `<div class="card card-pad" style="margin-bottom:var(--sp-5)"><div class="loading-line"><span class="spinner"></span> Finding practical suggestions for you…</div></div>`;
  try {
    const result = await api.post('/api/ecolife/tips', {});
    if (!result.ok) {
      card.innerHTML = `<div class="card card-pad" style="margin-bottom:var(--sp-5)"><p class="field-error">${escapeHtml(result.error)}</p></div>`;
      return;
    }
    card.innerHTML = `
      <div class="card card-pad" style="margin-bottom:var(--sp-5);border-color:var(--brand-soft-border)">
        <div class="card-header"><span class="card-title">${icon('sparkle', 'icon-sm')} Suggestions for you</span></div>
        <div class="stack">${result.data.tips.map((t) => `<div><strong class="text-sm" style="text-transform:capitalize">${escapeHtml(t.area)}</strong><p class="text-sm muted">${escapeHtml(t.tip)}</p></div>`).join('')}</div>
      </div>
    `;
  } catch (err) {
    card.innerHTML = `<div class="card card-pad" style="margin-bottom:var(--sp-5)"><p class="field-error">${escapeHtml(err.message)}</p></div>`;
  }
}
