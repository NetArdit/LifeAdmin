import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirm.js';
import { fmtDate } from '../format.js';

const CATEGORIES = ['learning', 'fitness', 'financial', 'career', 'habit', 'personal'];
let ctxRef, rootRef;

export async function mount(root, ctx) {
  ctxRef = ctx;
  rootRef = root;
  root.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading goals…</div></div>`;
  await renderAll();
}

async function renderAll() {
  const { api } = ctxRef;
  const { goals } = await api.get('/api/goals');
  const active = goals.filter((g) => g.status === 'active');
  const done = goals.filter((g) => g.status !== 'active');

  rootRef.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">Goals</h1><p class="page-subtitle">Learning, fitness, financial and personal goals — broken into real steps.</p></div>
        <div class="page-actions"><button class="btn btn-primary" id="new-goal-btn">${icon('plus', 'icon-sm')} New goal</button></div>
      </div>
      ${
        active.length
          ? `<div class="grid-2" style="margin-bottom:var(--sp-6)">${active.map(goalCard).join('')}</div>`
          : `<div class="card"><div class="empty-state">${icon('goal', 'icon-lg')}<h3>No goals yet</h3><p>Set a learning, fitness, financial or personal goal and break it into milestones.</p><button class="btn btn-primary" style="margin-top:var(--sp-2)" id="empty-new-goal">Add a goal</button></div></div>`
      }
      ${done.length ? `<div class="section-title" style="margin-top:var(--sp-6)">Completed / inactive</div><div class="grid-2">${done.map(goalCard).join('')}</div>` : ''}
    </div>
  `;

  const btn = document.getElementById('new-goal-btn') || document.getElementById('empty-new-goal');
  if (btn) btn.addEventListener('click', openGoalForm);

  rootRef.querySelectorAll('[data-toggle-milestone]').forEach((cb) =>
    cb.addEventListener('click', async () => {
      const [goalId, msId] = cb.dataset.toggleMilestone.split(':');
      const done = cb.classList.contains('checked');
      await api.patch(`/api/goals/${goalId}/milestones/${msId}`, { done: !done });
      renderAll();
    })
  );
  rootRef.querySelectorAll('[data-suggest-milestones]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!ctxRef.state.aiConfigured) return ctxRef.toast('AI is not configured on this server.', 'error');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span>`;
      const result = await api.post(`/api/goals/${btn.dataset.suggestMilestones}/suggest-milestones`, {});
      if (!result.ok) {
        ctxRef.toast(result.error, 'error');
      }
      renderAll();
    })
  );
  rootRef.querySelectorAll('[data-add-milestone]').forEach((btn) => btn.addEventListener('click', () => addMilestone(btn.dataset.addMilestone)));
  rootRef.querySelectorAll('[data-delete-goal]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Delete goal?', message: 'This cannot be undone.', confirmLabel: 'Delete' });
      if (!ok) return;
      await api.del(`/api/goals/${btn.dataset.deleteGoal}`);
      renderAll();
    })
  );
}

function goalCard(g) {
  return `
    <div class="card card-pad goal-card">
      <div class="row-between">
        <div>
          <span class="badge badge-neutral" style="text-transform:capitalize">${g.category}</span>
          <h3 style="margin-top:6px;font-size:var(--fs-md)">${escapeHtml(g.title)}</h3>
        </div>
        <button class="icon-btn" data-delete-goal="${g.id}" aria-label="Delete">${icon('trash', 'icon-sm')}</button>
      </div>
      ${g.description ? `<p class="text-sm muted">${escapeHtml(g.description)}</p>` : ''}
      <div>
        <div class="row-between text-xs muted" style="margin-bottom:4px"><span>${g.progress}% complete</span>${g.targetDate ? `<span>Target: ${fmtDate(g.targetDate)}</span>` : ''}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${g.progress}%"></div></div>
      </div>
      <div class="stack" style="gap:6px">
        ${g.milestones.map((m) => `
          <div class="milestone-row ${m.done ? 'done' : ''}">
            <button class="row-check ${m.done ? 'checked' : ''}" style="width:18px;height:18px" data-toggle-milestone="${g.id}:${m.id}">${icon('check', 'icon-sm')}</button>
            <span class="milestone-title">${escapeHtml(m.title)}</span>
          </div>`).join('')}
      </div>
      <div class="row" style="gap:6px">
        <button class="btn btn-sm" data-add-milestone="${g.id}">${icon('plus', 'icon-sm')} Milestone</button>
        ${!g.milestones.length ? `<button class="btn btn-sm" data-suggest-milestones="${g.id}">${icon('sparkle', 'icon-sm')} Suggest with AI</button>` : ''}
      </div>
    </div>
  `;
}

function openGoalForm() {
  const { api, toast } = ctxRef;
  openModal({
    title: 'New goal',
    bodyHtml: `
      <form id="goal-form" class="stack">
        <div class="field"><label class="field-label">Title</label><input class="input" name="title" required /></div>
        <div class="field"><label class="field-label">Description (optional)</label><textarea class="textarea" name="description"></textarea></div>
        <div class="grid-2">
          <div class="field"><label class="field-label">Category</label><select class="select" name="category">${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}</select></div>
          <div class="field"><label class="field-label">Target date</label><input class="input" type="date" name="targetDate" /></div>
        </div>
      </form>
    `,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="goal-save">Create goal</button>`,
    onMount: () => {
      document.getElementById('goal-save').addEventListener('click', async () => {
        const form = document.getElementById('goal-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.title.trim()) return toast('Title is required.', 'error');
        try {
          await api.post('/api/goals', { title: fd.title.trim(), description: fd.description || null, category: fd.category, targetDate: fd.targetDate || null });
          toast('Goal created', 'success');
          closeModal();
          renderAll();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}

function addMilestone(goalId) {
  const { api, toast } = ctxRef;
  openModal({
    title: 'Add a milestone',
    bodyHtml: `<form id="ms-form" class="stack"><div class="field"><label class="field-label">Title</label><input class="input" name="title" required /></div><div class="field"><label class="field-label">Due date (optional)</label><input class="input" type="date" name="dueDate" /></div></form>`,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="ms-save">Add</button>`,
    onMount: () => {
      document.getElementById('ms-save').addEventListener('click', async () => {
        const form = document.getElementById('ms-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.title.trim()) return toast('Title is required.', 'error');
        await api.post(`/api/goals/${goalId}/milestones`, { title: fd.title.trim(), dueDate: fd.dueDate || null });
        closeModal();
        renderAll();
      });
    },
  });
}
