import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { fmtTime, fmtDayLabel } from '../format.js';

const TYPE_ICON = {
  task_created: 'tasks', task_completed: 'check', bill_paid: 'bill', decision_made: 'decision',
  goal_progress: 'goal', comment: 'message', message: 'message', member_joined: 'family',
};

export async function mount(root, ctx) {
  const { api } = ctx;
  root.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading timeline…</div></div>`;
  const { activity } = await api.get('/api/timeline');

  if (!activity.length) {
    root.innerHTML = `<div class="page"><div class="page-header"><div><h1 class="page-title">Timeline</h1><p class="page-subtitle">A memory of everything that's happened.</p></div></div><div class="card"><div class="empty-state">${icon('timeline', 'icon-lg')}<h3>Nothing here yet</h3><p>As you complete tasks, pay bills, and make decisions, they'll show up here.</p></div></div></div>`;
    return;
  }

  const groups = groupByDay(activity);

  root.innerHTML = `
    <div class="page">
      <div class="page-header"><div><h1 class="page-title">Timeline</h1><p class="page-subtitle">A memory of everything that's happened.</p></div></div>
      <div class="card card-pad">
        ${Object.entries(groups)
          .map(
            ([day, items]) => `
          <div class="timeline-day">
            <div class="timeline-day-label">${day}</div>
            ${items.map(itemHtml).join('')}
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;
}

function groupByDay(activity) {
  const groups = {};
  for (const a of activity) {
    const dateStr = a.createdAt.slice(0, 10);
    const label = fmtDayLabel(dateStr);
    if (!groups[label]) groups[label] = [];
    groups[label].push(a);
  }
  return groups;
}

function itemHtml(a) {
  const time = fmtTime(a.createdAt.replace(' ', 'T') + 'Z');
  return `
    <a class="timeline-item" href="${a.link || '#'}" style="text-decoration:none">
      <span class="timeline-time">${time}</span>
      <span class="timeline-dot"></span>
      <span class="text-sm">${escapeHtml(a.summary)}</span>
    </a>
  `;
}
