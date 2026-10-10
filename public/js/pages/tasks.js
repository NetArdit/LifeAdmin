import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirm.js';
import { fmtDate, fmtTime, fmtDuration, PRIORITY_LABEL, STATUS_LABEL } from '../format.js';

const PRIORITY_BADGE = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

let ctxRef;
let filters = { view: 'all', status: '', q: '' };

export async function mount(root, ctx) {
  ctxRef = ctx;

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="page-subtitle">Everything you need to do, prioritized.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="add-task-btn">${icon('plus', 'icon icon-sm')} New task</button>
        </div>
      </div>

      <div class="filter-bar">
        ${pill('view', 'all', 'All')}
        ${pill('view', 'today', 'Today')}
        ${pill('view', 'upcoming', 'Upcoming')}
        ${pill('view', 'overdue', 'Overdue')}
        <div style="width:1px;height:20px;background:var(--surface-border-strong);margin:0 4px"></div>
        ${pill('status', 'completed', 'Completed')}
        <div style="flex:1"></div>
        <input class="input" id="task-search" placeholder="Search tasks…" style="max-width:220px" />
      </div>

      <div class="card card-pad" id="task-list-card">
        <div class="loading-line"><span class="spinner"></span> Loading tasks…</div>
      </div>
    </div>
  `;

  document.getElementById('add-task-btn').addEventListener('click', () => openTaskForm());
  wireFilterBar();
  document.getElementById('task-search').addEventListener('input', debounce((e) => {
    filters.q = e.target.value.trim();
    loadTasks();
  }, 250));

  await loadTasks();
}

function localHm(isoStr) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function pill(group, value, label) {
  const active = filters[group] === value;
  return `<button class="pill ${active ? 'active' : ''}" data-group="${group}" data-value="${value}">${label}</button>`;
}

function wireFilterBar() {
  document.querySelectorAll('.pill').forEach((p) =>
    p.addEventListener('click', () => {
      const group = p.dataset.group;
      const value = p.dataset.value;
      filters[group] = filters[group] === value ? '' : value;
      if (group === 'view' && filters[group] !== value) filters.view = 'all';
      refreshPills();
      loadTasks();
    })
  );
}

function refreshPills() {
  document.querySelectorAll('.pill').forEach((p) => {
    p.classList.toggle('active', filters[p.dataset.group] === p.dataset.value);
  });
}

async function loadTasks() {
  const { api } = ctxRef;
  const listCard = document.getElementById('task-list-card');
  const params = new URLSearchParams();
  if (filters.view && filters.view !== 'all') params.set('view', filters.view);
  if (filters.status) params.set('status', filters.status);
  if (filters.q) params.set('q', filters.q);

  try {
    const { tasks } = await api.get(`/api/tasks?${params.toString()}`);
    renderList(tasks);
  } catch (err) {
    listCard.innerHTML = `<p class="field-error">${escapeHtml(err.message)}</p>`;
  }
}

function renderList(tasks) {
  const listCard = document.getElementById('task-list-card');
  if (!tasks.length) {
    listCard.innerHTML = `
      <div class="empty-state">
        ${icon('tasks', 'icon-lg')}
        <h3>No tasks here</h3>
        <p>Add your first task to start organizing your day.</p>
        <button class="btn btn-primary" style="margin-top:var(--sp-2)" id="empty-add-task">Add a task</button>
      </div>`;
    document.getElementById('empty-add-task').addEventListener('click', () => openTaskForm());
    return;
  }

  listCard.innerHTML = `<div class="row-list">${tasks.map(taskRow).join('')}</div>`;

  listCard.querySelectorAll('[data-open-task]').forEach((el) =>
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-check]')) return;
      openTaskDetail(Number(el.dataset.openTask));
    })
  );
  listCard.querySelectorAll('[data-check]').forEach((el) =>
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = el.dataset.check;
      const completed = el.classList.contains('checked');
      try {
        await ctxRef.api.patch(`/api/tasks/${id}`, { status: completed ? 'todo' : 'completed' });
        loadTasks();
      } catch (err) {
        ctxRef.toast(err.message, 'error');
      }
    })
  );
}

function taskRow(t) {
  const done = t.status === 'completed';
  const cancelled = t.status === 'cancelled';
  return `
    <div class="row-item" data-open-task="${t.id}" style="cursor:pointer">
      <button class="row-check ${done ? 'checked' : ''}" data-check="${t.id}" ${cancelled ? 'disabled' : ''} aria-label="Toggle complete">${icon('check')}</button>
      <div class="row-main">
        <div class="row-title ${done ? 'done' : ''}">${escapeHtml(t.title)}</div>
        <div class="row-meta">
          <span class="badge ${PRIORITY_BADGE[t.priority]}">${PRIORITY_LABEL[t.priority]}</span>
          ${t.dueDate ? `<span>${fmtDate(t.dueDate)}${t.startTime ? ' · ' + fmtTime(t.startTime) : ''}</span>` : ''}
          ${t.durationMinutes ? `<span>${fmtDuration(t.durationMinutes)}</span>` : ''}
          ${t.familyId ? `<span>${icon('family', 'icon-sm')}</span>` : ''}
          ${t.recurrence ? `<span>${icon('refresh', 'icon-sm')} ${t.recurrence}</span>` : ''}
          ${cancelled ? `<span class="badge badge-neutral">Cancelled</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------
// Create / edit form
// -----------------------------------------------------------------------
function openTaskForm(existing = null) {
  const { api, toast, state } = ctxRef;
  const families = state.families || [];

  const bodyHtml = `
    <form id="task-form" class="stack">
      <div class="field">
        <label class="field-label">Title</label>
        <input class="input" name="title" required value="${existing ? escapeHtml(existing.title) : ''}" />
      </div>
      <div class="field">
        <label class="field-label">Description</label>
        <textarea class="textarea" name="description">${existing ? escapeHtml(existing.description || '') : ''}</textarea>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">Priority</label>
          <select class="select" name="priority">
            ${['critical', 'high', 'medium', 'low'].map((p) => `<option value="${p}" ${existing?.priority === p ? 'selected' : ''}>${PRIORITY_LABEL[p]}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Category</label>
          <input class="input" name="category" value="${existing ? escapeHtml(existing.category || '') : 'general'}" />
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">Due date</label>
          <input class="input" type="date" name="dueDate" value="${existing?.dueDate || ''}" />
        </div>
        <div class="field">
          <label class="field-label">Start time (optional)</label>
          <input class="input" type="time" name="startTimeOnly" value="${existing?.startTime ? localHm(existing.startTime) : ''}" />
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">Duration (minutes)</label>
          <input class="input" type="number" min="5" step="5" name="durationMinutes" value="${existing?.durationMinutes || ''}" />
        </div>
        <div class="field">
          <label class="field-label">Recurrence</label>
          <select class="select" name="recurrence">
            <option value="">None</option>
            ${['daily', 'weekdays', 'weekly', 'monthly'].map((r) => `<option value="${r}" ${existing?.recurrence === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      ${
        families.length
          ? `<div class="field">
        <label class="field-label">Family</label>
        <select class="select" name="familyId">
          <option value="">Private (only me)</option>
          ${families.map((f) => `<option value="${f.id}" ${existing?.familyId === f.id ? 'selected' : ''}>${escapeHtml(f.name)} — visible to family</option>`).join('')}
        </select>
      </div>`
          : ''
      }
      <div class="field">
        <label class="field-label">Notes</label>
        <textarea class="textarea" name="notes">${existing ? escapeHtml(existing.notes || '') : ''}</textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn" data-close>Cancel</button>
    <button class="btn btn-primary" id="save-task-btn">${existing ? 'Save changes' : 'Create task'}</button>
  `;

  openModal({
    title: existing ? 'Edit task' : 'New task',
    bodyHtml,
    footerHtml,
    size: 'lg',
    onMount: () => {
      document.getElementById('save-task-btn').addEventListener('click', async () => {
        const form = document.getElementById('task-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.title.trim()) {
          toast('Title is required.', 'error');
          return;
        }
        const payload = {
          title: fd.title.trim(),
          description: fd.description || null,
          priority: fd.priority,
          category: fd.category || 'general',
          dueDate: fd.dueDate || null,
          durationMinutes: fd.durationMinutes ? Number(fd.durationMinutes) : null,
          recurrence: fd.recurrence || null,
          notes: fd.notes || null,
        };
        if (fd.dueDate && fd.startTimeOnly) {
          payload.startTime = new Date(`${fd.dueDate}T${fd.startTimeOnly}:00`).toISOString();
        }
        if (fd.familyId) {
          payload.familyId = Number(fd.familyId);
          payload.visibility = 'family';
        } else {
          payload.visibility = 'private';
        }

        try {
          if (existing) {
            await api.patch(`/api/tasks/${existing.id}`, payload);
            toast('Task updated', 'success');
          } else {
            await api.post('/api/tasks', payload);
            toast('Task created', 'success');
          }
          closeModal();
          loadTasks();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}

// -----------------------------------------------------------------------
// Detail modal (with comments)
// -----------------------------------------------------------------------
async function openTaskDetail(id) {
  const { api, toast } = ctxRef;
  const bodyHtml = `<div class="loading-line"><span class="spinner"></span> Loading…</div>`;
  openModal({ title: 'Task', bodyHtml, size: 'lg' });

  let data;
  try {
    data = await api.get(`/api/tasks/${id}`);
  } catch (err) {
    toast(err.message, 'error');
    closeModal();
    return;
  }
  const { task, comments } = data;

  const modalRoot = document.getElementById('modal-root');
  modalRoot.querySelector('.modal-title').textContent = task.title;
  modalRoot.querySelector('.modal-body').innerHTML = `
    <div class="row" style="gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-4)">
      <span class="badge ${PRIORITY_BADGE[task.priority]}">${PRIORITY_LABEL[task.priority]}</span>
      <select class="select" id="status-select" style="width:auto;height:32px">
        ${['todo', 'in_progress', 'completed', 'cancelled'].map((s) => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}
      </select>
      ${task.dueDate ? `<span class="badge badge-neutral">${icon('calendar', 'icon-sm')} ${fmtDate(task.dueDate)}</span>` : ''}
      ${task.durationMinutes ? `<span class="badge badge-neutral">${fmtDuration(task.durationMinutes)}</span>` : ''}
    </div>
    ${task.description ? `<p class="text-sm" style="margin-bottom:var(--sp-4)">${escapeHtml(task.description)}</p>` : ''}
    ${task.notes ? `<p class="text-sm muted" style="margin-bottom:var(--sp-4)"><strong>Notes:</strong> ${escapeHtml(task.notes)}</p>` : ''}
    <div class="row page-actions" style="margin-bottom:var(--sp-5)">
      <button class="btn btn-sm" id="postpone-btn">${icon('clock', 'icon-sm')} Postpone 1 day</button>
      <button class="btn btn-sm" id="edit-task-btn">${icon('edit', 'icon-sm')} Edit</button>
      <button class="btn btn-sm btn-danger" id="delete-task-btn">${icon('trash', 'icon-sm')} Delete</button>
    </div>
    <hr class="divider" />
    <div class="section-title">Comments</div>
    <div class="stack" id="comment-list" style="margin-bottom:var(--sp-4)">
      ${comments.length ? comments.map(commentHtml).join('') : `<p class="muted text-sm">No comments yet.</p>`}
    </div>
    <form id="comment-form" class="row">
      <input class="input" name="body" placeholder="Write a comment…" style="flex:1" />
      <button class="btn btn-primary" type="submit">${icon('send', 'icon-sm')}</button>
    </form>
  `;

  document.getElementById('status-select').addEventListener('change', async (e) => {
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: e.target.value });
      toast('Status updated', 'success');
      loadTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  document.getElementById('postpone-btn').addEventListener('click', async () => {
    await api.post(`/api/tasks/${task.id}/postpone`, { days: 1 });
    toast('Postponed by 1 day', 'success');
    closeModal();
    loadTasks();
  });
  document.getElementById('edit-task-btn').addEventListener('click', () => {
    closeModal();
    openTaskForm(task);
  });
  document.getElementById('delete-task-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Delete task?', message: `"${task.title}" will be permanently deleted.`, confirmLabel: 'Delete' });
    if (!ok) return;
    await api.del(`/api/tasks/${task.id}`);
    toast('Task deleted', 'success');
    closeModal();
    loadTasks();
  });
  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.body;
    if (!input.value.trim()) return;
    try {
      await api.post(`/api/tasks/${task.id}/comments`, { body: input.value.trim() });
      input.value = '';
      openTaskDetail(task.id);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

function commentHtml(c) {
  return `
    <div class="row" style="align-items:flex-start;gap:var(--sp-2)">
      <div class="avatar avatar-sm">${(c.authorName || '?').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}</div>
      <div>
        <div class="text-sm"><strong>${escapeHtml(c.authorName)}</strong> <span class="muted text-xs">${fmtDate(c.createdAt)}</span></div>
        <div class="text-sm">${escapeHtml(c.body)}</div>
      </div>
    </div>
  `;
}
