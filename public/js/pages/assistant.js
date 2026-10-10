import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { fmtDayLabel } from '../format.js';

let ctxRef;
let activeTab = 'chat';
let messages = [];

const PROMPT_CHIPS = [
  'Organize my week',
  "What needs my attention today?",
  'I have too much going on, help me prioritize',
  'What can I change to save money this month?',
];

export async function mount(root, ctx) {
  ctxRef = ctx;

  if (!ctx.state.aiConfigured) {
    root.innerHTML = unavailableHtml();
    return;
  }

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">Assistant</h1><p class="page-subtitle">Ask about your week, priorities, bills, or family — grounded only in your real data.</p></div>
        <div class="page-actions"><button class="btn" id="weekly-review-btn">${icon('sparkle', 'icon-sm')} Weekly review</button></div>
      </div>
      <div class="tabs" style="margin-bottom:var(--sp-5)">
        <div class="tab ${activeTab === 'chat' ? 'active' : ''}" data-tab="chat">Chat</div>
        <div class="tab ${activeTab === 'plan' ? 'active' : ''}" data-tab="plan">Plan my week</div>
      </div>
      <div id="assistant-content"></div>
    </div>
  `;

  document.querySelectorAll('.tabs .tab').forEach((t) =>
    t.addEventListener('click', () => {
      activeTab = t.dataset.tab;
      mount(root, ctx);
    })
  );
  document.getElementById('weekly-review-btn').addEventListener('click', openWeeklyReview);

  if (activeTab === 'chat') renderChatTab();
  else renderPlanTab();
}

function unavailableHtml() {
  return `
    <div class="page">
      <div class="page-header"><div><h1 class="page-title">Assistant</h1><p class="page-subtitle">Your AI-powered life copilot.</p></div></div>
      <div class="card"><div class="empty-state">
        ${icon('assistant', 'icon-lg')}
        <h3>AI is not configured</h3>
        <p>The assistant, natural-language planner, DecisionFlow analysis, and insights all need an ANTHROPIC_API_KEY set on the server. The rest of LifeAdmin works fully without it.</p>
      </div></div>
    </div>
  `;
}

// -----------------------------------------------------------------------
async function renderChatTab() {
  const { api } = ctxRef;
  const content = document.getElementById('assistant-content');
  content.innerHTML = `
    <div class="card card-pad">
      <div class="assistant-shell">
        <div class="assistant-messages" id="assistant-messages"><div class="loading-line"><span class="spinner"></span> Loading conversation…</div></div>
        <form class="chat-input-row" id="assistant-form">
          <input class="input" name="message" placeholder="Ask LifeAdmin anything about your week…" style="flex:1" autocomplete="off" />
          <button class="btn btn-primary btn-icon" type="submit" aria-label="Send">${icon('send', 'icon-sm')}</button>
        </form>
      </div>
    </div>
  `;

  const { messages: history } = await api.get('/api/ai/chat/history');
  messages = history;
  renderMessages();

  document.getElementById('assistant-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.message;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    messages.push({ role: 'user', content: text });
    renderMessages(true);

    try {
      const result = await ctxRef.api.post('/api/ai/chat', { message: text });
      if (!result.ok) {
        ctxRef.toast(result.error, 'error');
        messages.pop();
        renderMessages();
        return;
      }
      messages.push({ role: 'assistant', content: result.data.reply, suggestions: result.data.suggestions });
      renderMessages(true);
    } catch (err) {
      ctxRef.toast(err.message, 'error');
    }
  });
}

function renderMessages(scrollBottom) {
  const box = document.getElementById('assistant-messages');
  if (!box) return;
  if (!messages.length) {
    box.innerHTML = `
      <div class="assistant-empty">
        ${icon('assistant', 'icon-lg')}
        <h3 style="margin-top:var(--sp-2)">How can I help with your week?</h3>
        <div class="assistant-prompt-grid">
          ${PROMPT_CHIPS.map((p) => `<button class="assistant-prompt-chip" data-chip="${escapeHtml(p)}">${p}</button>`).join('')}
        </div>
      </div>
    `;
    box.querySelectorAll('[data-chip]').forEach((chip) =>
      chip.addEventListener('click', () => {
        const input = document.querySelector('#assistant-form [name=message]');
        input.value = chip.dataset.chip;
        document.getElementById('assistant-form').requestSubmit();
      })
    );
    return;
  }

  box.innerHTML = messages
    .map(
      (m) => `
    <div class="assistant-msg ${m.role}">
      <div class="bubble">${escapeHtml(m.content)}</div>
      ${m.suggestions && m.suggestions.length ? `<div class="assistant-suggestions">${m.suggestions.map((s) => `<button class="pill" data-suggestion="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div>` : ''}
    </div>`
    )
    .join('');

  box.querySelectorAll('[data-suggestion]').forEach((chip) =>
    chip.addEventListener('click', () => {
      const input = document.querySelector('#assistant-form [name=message]');
      input.value = chip.dataset.suggestion;
      document.getElementById('assistant-form').requestSubmit();
    })
  );

  if (scrollBottom) box.scrollTop = box.scrollHeight;
}

// -----------------------------------------------------------------------
function renderPlanTab() {
  const content = document.getElementById('assistant-content');
  content.innerHTML = `
    <div class="card card-pad">
      <p class="text-sm muted" style="margin-bottom:var(--sp-3)">Describe your week in your own words. LifeAdmin protects sleep, meals and rest automatically — it won't schedule every free minute.</p>
      <form id="plan-form" class="stack">
        <textarea class="textarea" name="text" rows="4" placeholder="From Monday until Friday I want to study JavaScript. I'm free 8-10 in the morning, then I work until 18:00. After work I need an hour to rest and eat, but I still want to study another hour."></textarea>
        <button type="submit" class="btn btn-primary" style="align-self:flex-start">${icon('sparkle', 'icon-sm')} Build my plan</button>
      </form>
      <div id="plan-result" style="margin-top:var(--sp-5)"></div>
    </div>
  `;

  document.getElementById('plan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (!text) return;
    const resultEl = document.getElementById('plan-result');
    resultEl.innerHTML = `<div class="loading-line"><span class="spinner"></span> Reasoning about your week — protecting sleep, meals and rest…</div>`;
    try {
      const result = await ctxRef.api.post('/api/ai/plan', { text });
      if (!result.ok) {
        resultEl.innerHTML = `<p class="field-error">${escapeHtml(result.error)}</p>`;
        return;
      }
      renderPlanResult(result.plan, result.preview);
    } catch (err) {
      resultEl.innerHTML = `<p class="field-error">${escapeHtml(err.message)}</p>`;
    }
  });
}

function renderPlanResult(plan, preview) {
  const resultEl = document.getElementById('plan-result');
  const days = Object.keys(preview).sort();

  if (!days.length) {
    resultEl.innerHTML = `<p class="muted text-sm">No schedulable activities were found in that description. Try mentioning specific things you want time for.</p>`;
    return;
  }

  resultEl.innerHTML = `
    <div class="section-title">Reasoning</div>
    <ul class="stack" style="gap:4px;margin-bottom:var(--sp-5)">${(plan.notes || []).map((n) => `<li class="text-sm muted">${escapeHtml(n)}</li>`).join('') || '<li class="muted text-sm">—</li>'}</ul>
    <div class="section-title">Proposed schedule</div>
    ${days
      .map(
        (date) => `
      <div class="plan-preview-day">
        <strong class="text-sm">${fmtDayLabel(date)}</strong>
        ${preview[date].placed.map((b) => `<div class="plan-block"><span class="plan-block-time">${b.start}–${b.end}</span><span>${escapeHtml(b.label)}</span></div>`).join('') || '<p class="muted text-xs">Nothing placed.</p>'}
        ${preview[date].warnings.map((w) => `<p class="text-xs" style="color:var(--warning-600)">${icon('alert', 'icon-sm')} ${escapeHtml(w)}</p>`).join('')}
      </div>`
      )
      .join('')}
    <button class="btn btn-primary" id="apply-plan-btn" style="margin-top:var(--sp-3)">${icon('check', 'icon-sm')} Add these to my tasks</button>
  `;

  document.getElementById('apply-plan-btn').addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.innerHTML = `<span class="spinner"></span> Adding…`;
    const res = await ctxRef.api.post('/api/ai/plan/apply', { preview });
    ctxRef.toast(`Added ${res.created} tasks to your schedule`, 'success');
    e.target.textContent = 'Added to your tasks';
  });
}

// -----------------------------------------------------------------------
async function openWeeklyReview() {
  if (!ctxRef.state.aiConfigured) return ctxRef.toast('AI is not configured on this server.', 'error');
  const { openModal } = await import('../components/modal.js');
  openModal({ title: 'Weekly review', bodyHtml: `<div class="loading-line"><span class="spinner"></span> Reviewing your week…</div>` });
  try {
    const result = await ctxRef.api.post('/api/ai/weekly-review', {});
    const body = document.querySelector('#modal-root .modal-body');
    if (!result.ok) {
      body.innerHTML = `<p class="field-error">${escapeHtml(result.error)}</p>`;
      return;
    }
    const r = result.data;
    body.innerHTML = `
      <h3 style="margin-bottom:var(--sp-3)">${escapeHtml(r.headline)}</h3>
      ${r.highlights.length ? `<div class="section-title">Highlights</div><ul class="stack" style="gap:4px;margin-bottom:var(--sp-4)">${r.highlights.map((h) => `<li class="text-sm">${escapeHtml(h)}</li>`).join('')}</ul>` : ''}
      ${r.forgettingChecklist.length ? `<div class="section-title">Things you might be forgetting</div><ul class="stack" style="gap:4px">${r.forgettingChecklist.map((h) => `<li class="text-sm muted">${escapeHtml(h)}</li>`).join('')}</ul>` : ''}
    `;
  } catch (err) {
    const body = document.querySelector('#modal-root .modal-body');
    if (body) body.innerHTML = `<p class="field-error">${escapeHtml(err.message)}</p>`;
  }
}
