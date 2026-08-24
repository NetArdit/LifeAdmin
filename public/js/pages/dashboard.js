import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { daysUntilLabel, fmtRelative } from '../format.js';

export async function mount(root, ctx) {
  const { api, toast, state } = ctx;
  root.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Preparing your dashboard…</div></div>`;

  const data = await api.get('/api/dashboard');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const showOnboarding = data.counts.tasks === 0 && data.counts.bills === 0 && !state.families.length;

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">${greeting}, ${escapeHtml(state.user.firstName)}</h1>
          <p class="page-subtitle">Here's what matters in your life right now.</p>
        </div>
      </div>

      ${showOnboarding ? onboardingHtml() : ''}

      <div class="today-banner">
        <div>
          <h2>${data.today.count === 0 ? 'Nothing urgent today' : `${data.today.count} thing${data.today.count === 1 ? '' : 's'} need${data.today.count === 1 ? 's' : ''} your attention`}</h2>
          <p>${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="today-count">${data.today.count}</div>
      </div>

      <div class="dash-grid">
        <div class="stack">
          ${bucketCard('Needs attention', data.needsAttention, 'var(--danger-500)', 'Nothing needs urgent attention — nice work.')}
          ${bucketCard('Coming soon', data.comingSoon, 'var(--warning-500)', 'Nothing coming up in the next few days.')}
          ${bucketCard('Can wait', data.canWait, 'var(--priority-low)', 'Nothing low-priority queued up.')}
        </div>
        <div class="stack">
          ${goalsCard(data.goalsInProgress)}
          ${activityCard(data.familyActivity)}
          ${data.conflicts > 0 ? conflictCard(data.conflicts) : ''}
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-complete-task]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await api.patch(`/api/tasks/${btn.dataset.completeTask}`, { status: 'completed' });
        toast('Task completed', 'success');
        mount(root, ctx);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });

  const seedBtn = document.getElementById('seed-demo-btn');
  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      seedBtn.disabled = true;
      seedBtn.innerHTML = `<span class="spinner"></span> Adding sample data…`;
      await api.post('/api/demo/seed');
      toast('Demo data added', 'success');
      const { families } = await api.get('/api/family');
      state.families = families;
      mount(root, ctx);
    });
  }
}

function onboardingHtml() {
  return `
    <div class="onboard-card">
      ${icon('sparkle', 'icon-lg')}
      <div style="flex:1">
        <strong>Get started with LifeAdmin</strong>
        <p class="text-sm muted" style="margin-top:2px">Add a real task or bill, create a family, or load sample data to see everything in action.</p>
      </div>
      <button class="btn btn-primary" id="seed-demo-btn">Load demo data</button>
    </div>
  `;
}

function itemRow(item) {
  const isTask = item.kind === 'task';
  const badgeClass = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[item.priority] || 'badge-medium';
  const daysLabel = item.due_date ? daysUntilLabel(daysBetweenToday(item.due_date)) : '';
  return `
    <a class="row-item" href="${item.link}" style="text-decoration:none">
      ${isTask ? `<button class="row-check" data-complete-task="${item.id}" aria-label="Complete">${icon('check')}</button>` : `<div class="row-check" style="pointer-events:none;opacity:0.35">${icon(item.kind === 'bill' ? 'bill' : 'decision', 'icon-sm')}</div>`}
      <div class="row-main">
        <div class="row-title">${escapeHtml(item.title)}</div>
        <div class="row-meta">
          <span class="badge ${badgeClass}">${item.priority}</span>
          ${daysLabel ? `<span>${daysLabel}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

function daysBetweenToday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

function bucketCard(title, items, color, emptyText) {
  return `
    <div class="card card-pad">
      <div class="bucket-header" style="margin-bottom:var(--sp-3)">
        <span class="badge-dot-lg" style="background:${color}"></span>
        <span class="card-title">${title}</span>
        <span class="muted text-xs" style="margin-left:4px">${items.length}</span>
      </div>
      ${items.length ? `<div class="row-list">${items.map(itemRow).join('')}</div>` : `<p class="muted text-sm">${emptyText}</p>`}
    </div>
  `;
}

function goalsCard(goals) {
  return `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Goals in progress</span><a href="#/goals" class="text-xs" style="color:var(--brand)">View all</a></div>
      ${
        goals.length
          ? goals
              .map(
                (g) => `
        <div style="margin-bottom:var(--sp-3)">
          <div class="row-between text-sm" style="margin-bottom:4px"><span>${escapeHtml(g.title)}</span><span class="muted">${g.progress}%</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${g.progress}%"></div></div>
        </div>`
              )
              .join('')
          : `<p class="muted text-sm">No active goals yet.</p>`
      }
    </div>
  `;
}

function activityCard(activity) {
  return `
    <div class="card card-pad">
      <div class="card-header"><span class="card-title">Family activity</span></div>
      ${
        activity.length
          ? `<div class="row-list">${activity
              .slice(0, 6)
              .map(
                (a) => `<a class="row-item" href="${a.link || '#'}" style="text-decoration:none">
                <div class="row-main"><div class="row-title" style="white-space:normal;font-weight:500">${escapeHtml(a.summary)}</div><div class="row-meta">${fmtRelative(a.createdAt)}</div></div>
              </a>`
              )
              .join('')}</div>`
          : `<p class="muted text-sm">No family activity yet. Create a family to share tasks and updates.</p>`
      }
    </div>
  `;
}

function conflictCard(count) {
  return `
    <div class="card card-pad" style="border-color:var(--warning-400)">
      <div class="row" style="gap:var(--sp-3)">
        ${icon('alert', 'icon-lg')}
        <div>
          <strong class="text-sm">${count} schedule conflict${count === 1 ? '' : 's'} detected</strong>
          <p class="text-xs muted" style="margin-top:2px">Some timed tasks overlap. <a href="#/tasks" style="color:var(--brand)">Review tasks</a></p>
        </div>
      </div>
    </div>
  `;
}
