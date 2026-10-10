import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirm.js';
import { fmtMoney, fmtDate, daysUntilLabel } from '../format.js';

const CATEGORIES = ['electricity', 'water', 'internet', 'phone', 'rent', 'subscription', 'insurance', 'loan', 'other'];
let ctxRef, rootRef;

export async function mount(root, ctx) {
  ctxRef = ctx;
  rootRef = root;
  root.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading BillSense…</div></div>`;
  await renderAll();
}

async function renderAll() {
  const { api } = ctxRef;
  const [{ bills }, { stats, overdue }] = await Promise.all([api.get('/api/bills'), api.get('/api/bills/stats')]);

  rootRef.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">BillSense</h1><p class="page-subtitle">Understand and stay ahead of recurring expenses.</p></div>
        <div class="page-actions">
          <button class="btn" id="ai-insights-btn">${icon('sparkle', 'icon-sm')} AI insights</button>
          <button class="btn btn-primary" id="add-bill-btn">${icon('plus', 'icon-sm')} Add bill</button>
        </div>
      </div>

      <div class="stat-row">
        ${statTile('Monthly total', fmtMoney(stats.monthlyTotal))}
        ${statTile('Overdue', stats.overdueCount)}
        ${statTile('Due in 14 days', stats.upcomingCount)}
        ${statTile('Tracked bills', bills.length)}
      </div>

      <div id="ai-insights-card"></div>

      <div class="dash-grid">
        <div class="card card-pad">
          <div class="card-header"><span class="card-title">All bills</span></div>
          ${bills.length ? `<div class="row-list">${bills.map(billRow).join('')}</div>` : emptyBills()}
        </div>
        <div class="stack">
          <div class="card card-pad">
            <div class="card-header"><span class="card-title">By category</span></div>
            ${categoryBars(stats.byCategory)}
          </div>
          ${overdue.length ? warnCard('Overdue bills', overdue) : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('add-bill-btn').addEventListener('click', () => openBillForm());
  document.getElementById('ai-insights-btn').addEventListener('click', loadInsights);
  rootRef.querySelectorAll('[data-pay]').forEach((btn) =>
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await ctxRef.api.post(`/api/bills/${btn.dataset.pay}/pay`, {});
        ctxRef.toast('Marked as paid', 'success');
        renderAll();
      } catch (err) {
        ctxRef.toast(err.message, 'error');
      }
    })
  );
  rootRef.querySelectorAll('[data-edit-bill]').forEach((el) =>
    el.addEventListener('click', () => {
      const bill = bills.find((b) => b.id === Number(el.dataset.editBill));
      if (bill) openBillForm(bill);
    })
  );
}

function statTile(label, value) {
  return `<div class="card card-pad stat-tile"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
}

function emptyBills() {
  return `<div class="empty-state">${icon('bill', 'icon-lg')}<h3>No bills yet</h3><p>Add your first recurring bill to start understanding your monthly obligations.</p></div>`;
}

function billRow(b) {
  const overdue = b.status === 'unpaid' && b.daysUntilDue < 0;
  return `
    <div class="row-item" data-edit-bill="${b.id}" style="cursor:pointer">
      <div class="bill-cat-icon">${icon('bill', 'icon-sm')}</div>
      <div class="row-main">
        <div class="row-title">${escapeHtml(b.name)}</div>
        <div class="row-meta">
          <span style="text-transform:capitalize">${b.category}</span>
          <span>${fmtDate(b.dueDate)}</span>
          ${b.status === 'unpaid' ? `<span class="badge ${overdue ? 'badge-critical' : 'badge-neutral'}">${daysUntilLabel(b.daysUntilDue)}</span>` : `<span class="badge badge-success">Paid</span>`}
        </div>
      </div>
      <div class="bill-amount">${fmtMoney(b.amount, b.currency)}</div>
      ${b.status === 'unpaid' ? `<button class="btn btn-sm" data-pay="${b.id}">Mark paid</button>` : ''}
    </div>
  `;
}

function categoryBars(byCategory) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<p class="muted text-sm">No data yet.</p>`;
  const max = Math.max(...entries.map((e) => e[1]));
  return entries
    .map(
      ([cat, amt]) => `
    <div class="category-bar-row">
      <span class="cat-label">${cat}</span>
      <div class="category-bar-track"><div class="category-bar-fill" style="width:${(amt / max) * 100}%"></div></div>
      <span class="cat-amount">${fmtMoney(amt)}</span>
    </div>`
    )
    .join('');
}

function warnCard(title, bills) {
  return `
    <div class="card card-pad" style="border-color:var(--danger-400)">
      <div class="card-header"><span class="card-title">${title}</span></div>
      <div class="row-list">${bills.map((b) => `<div class="row-item"><div class="row-main"><div class="row-title">${escapeHtml(b.name)}</div><div class="row-meta">${daysUntilLabel(b.daysUntilDue)}</div></div><div class="bill-amount">${fmtMoney(b.amount, b.currency)}</div></div>`).join('')}</div>
    </div>
  `;
}

async function loadInsights() {
  const { api, state } = ctxRef;
  if (!state.aiConfigured) {
    document.getElementById('ai-insights-card').innerHTML = aiUnavailableHtml();
    return;
  }
  const card = document.getElementById('ai-insights-card');
  card.innerHTML = `<div class="card card-pad"><div class="loading-line"><span class="spinner"></span> Analyzing your spending…</div></div>`;
  try {
    const result = await api.post('/api/bills/insights', {});
    if (!result.ok) {
      card.innerHTML = `<div class="card card-pad"><p class="field-error">${escapeHtml(result.error)}</p></div>`;
      return;
    }
    card.innerHTML = `
      <div class="card card-pad" style="margin-bottom:var(--sp-5);border-color:var(--brand-soft-border)">
        <div class="card-header"><span class="card-title">${icon('sparkle', 'icon-sm')} AI insights</span></div>
        <ul class="stack" style="gap:6px">${result.data.insights.map((i) => `<li class="text-sm">${escapeHtml(i)}</li>`).join('')}</ul>
      </div>
    `;
  } catch (err) {
    card.innerHTML = `<div class="card card-pad"><p class="field-error">${escapeHtml(err.message)}</p></div>`;
  }
}

function aiUnavailableHtml() {
  return `<div class="card card-pad" style="margin-bottom:var(--sp-5)"><p class="text-sm muted">${icon('info', 'icon-sm')} AI insights require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo.</p></div>`;
}

function openBillForm(existing = null) {
  const { api, toast } = ctxRef;
  const bodyHtml = `
    <form id="bill-form" class="stack">
      <div class="field"><label class="field-label">Name</label><input class="input" name="name" required value="${existing ? escapeHtml(existing.name) : ''}" /></div>
      <div class="grid-2">
        <div class="field"><label class="field-label">Amount</label><input class="input" type="number" step="0.01" min="0.01" name="amount" required value="${existing ? existing.amount : ''}" /></div>
        <div class="field"><label class="field-label">Currency</label><input class="input" name="currency" value="${existing ? existing.currency : 'EUR'}" /></div>
      </div>
      <div class="grid-2">
        <div class="field"><label class="field-label">Category</label><select class="select" name="category">${CATEGORIES.map((c) => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">Recurrence</label><select class="select" name="recurrence">${['none', 'weekly', 'monthly', 'yearly'].map((r) => `<option value="${r}" ${existing?.recurrence === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label class="field-label">Due date</label><input class="input" type="date" name="dueDate" required value="${existing?.dueDate || ''}" /></div>
      <div class="field"><label class="field-label">Notes</label><textarea class="textarea" name="notes">${existing ? escapeHtml(existing.notes || '') : ''}</textarea></div>
    </form>
  `;
  const footerHtml = `
    ${existing ? `<button class="btn btn-danger" id="delete-bill-btn" style="margin-right:auto">Delete</button>` : ''}
    <button class="btn" data-close>Cancel</button>
    <button class="btn btn-primary" id="save-bill-btn">${existing ? 'Save changes' : 'Add bill'}</button>
  `;
  openModal({
    title: existing ? 'Edit bill' : 'Add a bill',
    bodyHtml,
    footerHtml,
    onMount: () => {
      document.getElementById('save-bill-btn').addEventListener('click', async () => {
        const form = document.getElementById('bill-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        const payload = { name: fd.name.trim(), amount: Number(fd.amount), currency: fd.currency || 'EUR', category: fd.category, recurrence: fd.recurrence, dueDate: fd.dueDate, notes: fd.notes || null };
        try {
          if (existing) await api.patch(`/api/bills/${existing.id}`, payload);
          else await api.post('/api/bills', payload);
          toast(existing ? 'Bill updated' : 'Bill added', 'success');
          closeModal();
          renderAll();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
      const delBtn = document.getElementById('delete-bill-btn');
      if (delBtn)
        delBtn.addEventListener('click', async () => {
          const ok = await confirmDialog({ title: 'Delete bill?', message: `"${existing.name}" will be permanently deleted.`, confirmLabel: 'Delete' });
          if (!ok) return;
          await api.del(`/api/bills/${existing.id}`);
          toast('Bill deleted', 'success');
          renderAll();
        });
    },
  });
}
