import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { confirmDialog } from '../components/confirm.js';
import { fmtDate } from '../format.js';

let ctxRef, rootRef;

export async function mount(root, ctx) {
  ctxRef = ctx;
  rootRef = root;
  const id = ctx.params && ctx.params[0];
  if (id) return renderDetail(Number(id));
  return renderList();
}

async function renderList() {
  const { api } = ctxRef;
  rootRef.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading decisions…</div></div>`;
  const { decisions } = await api.get('/api/decisions');

  rootRef.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">DecisionFlow</h1><p class="page-subtitle">Structure hard decisions with clear, transparent reasoning.</p></div>
        <div class="page-actions"><button class="btn btn-primary" id="new-decision-btn">${icon('plus', 'icon-sm')} New decision</button></div>
      </div>
      <div class="card card-pad">
        ${
          decisions.length
            ? `<div class="row-list">${decisions.map(decisionRow).join('')}</div>`
            : `<div class="empty-state">${icon('decision', 'icon-lg')}<h3>No decisions yet</h3><p>Describe something you're trying to decide — LifeAdmin will help you weigh it clearly.</p><button class="btn btn-primary" style="margin-top:var(--sp-2)" id="empty-new-decision">Start a decision</button></div>`
        }
      </div>
    </div>
  `;

  const btn = document.getElementById('new-decision-btn') || document.getElementById('empty-new-decision');
  if (btn) btn.addEventListener('click', openNewDecision);
  rootRef.querySelectorAll('[data-open-decision]').forEach((el) =>
    el.addEventListener('click', () => (location.hash = `#/decisionflow/${el.dataset.openDecision}`))
  );
}

function decisionRow(d) {
  return `
    <div class="row-item" data-open-decision="${d.id}" style="cursor:pointer">
      <div class="row-check" style="pointer-events:none;${d.status === 'decided' ? 'background:var(--accent-500);border-color:var(--accent-500);color:#fff' : ''}">${d.status === 'decided' ? icon('check', 'icon-sm') : icon('decision', 'icon-sm')}</div>
      <div class="row-main">
        <div class="row-title">${escapeHtml(d.question)}</div>
        <div class="row-meta"><span>${fmtDate(d.createdAt)}</span>${d.status === 'decided' ? '<span class="badge badge-success">Decided</span>' : '<span class="badge badge-neutral">Open</span>'}</div>
      </div>
    </div>
  `;
}

function openNewDecision() {
  const { api, toast } = ctxRef;
  openModal({
    title: 'Start a new decision',
    bodyHtml: `<form id="decision-form"><div class="field"><label class="field-label">What are you trying to decide?</label><textarea class="textarea" name="question" placeholder="Should I buy this laptop? Should I move apartments? Should I take this job?" required></textarea></div></form>`,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="save-decision-btn">Start</button>`,
    onMount: () => {
      document.getElementById('save-decision-btn').addEventListener('click', async () => {
        const question = document.querySelector('#decision-form [name=question]').value.trim();
        if (!question) return toast('Describe the decision first.', 'error');
        try {
          const { decision } = await api.post('/api/decisions', { question });
          closeModal();
          location.hash = `#/decisionflow/${decision.id}`;
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    },
  });
}

// -----------------------------------------------------------------------
async function renderDetail(id) {
  const { api, toast } = ctxRef;
  rootRef.innerHTML = `<div class="page"><div class="loading-line"><span class="spinner"></span> Loading…</div></div>`;
  let data;
  try {
    data = await api.get(`/api/decisions/${id}`);
  } catch (err) {
    rootRef.innerHTML = `<div class="page"><p class="field-error">${escapeHtml(err.message)}</p></div>`;
    return;
  }

  const { decision, criteria, options, scoring } = data;

  rootRef.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <a href="#/decisionflow" class="text-xs muted">&larr; All decisions</a>
          <h1 class="page-title" style="margin-top:6px">${escapeHtml(decision.question)}</h1>
          ${decision.status === 'decided' ? `<p class="page-subtitle">Decided${scoring.ranked.find((o) => o.id === decision.chosenOptionId) ? ': ' + escapeHtml(scoring.ranked.find((o) => o.id === decision.chosenOptionId).name) : ''}</p>` : `<p class="page-subtitle">Open decision</p>`}
        </div>
        <div class="page-actions">
          <button class="btn" id="analyze-btn">${icon('sparkle', 'icon-sm')} Analyze with AI</button>
        </div>
      </div>

      <div class="dash-grid">
        <div class="stack">
          <div class="card card-pad">
            <div class="card-header">
              <span class="card-title">Options</span>
              <button class="btn btn-sm" id="add-option-btn">${icon('plus', 'icon-sm')} Add option</button>
            </div>
            <div class="stack" id="options-list">${options.length ? scoring.ranked.map((r, i) => optionCard(r, options.find((o) => o.id === r.id), i === 0, criteria, decision)).join('') : `<p class="muted text-sm">Add at least two options to compare.</p>`}</div>
          </div>
          ${
            decision.recommendation
              ? `<div class="card card-pad" style="border-color:var(--brand-soft-border)">
                <div class="card-header"><span class="card-title">${icon('sparkle', 'icon-sm')} AI reasoning</span><span class="badge badge-${decision.recommendation.confidence === 'high' ? 'success' : decision.recommendation.confidence === 'medium' ? 'medium' : 'low'}">${decision.recommendation.confidence} confidence</span></div>
                <p class="text-sm">${escapeHtml(decision.recommendation.reasoningSummary || '')}</p>
                ${decision.recommendation.missingInfo && decision.recommendation.missingInfo.length ? `<div style="margin-top:var(--sp-3)"><strong class="text-xs">What would improve confidence:</strong><ul class="stack" style="gap:4px;margin-top:6px">${decision.recommendation.missingInfo.map((m) => `<li class="text-sm muted">${escapeHtml(m)}</li>`).join('')}</ul></div>` : ''}
              </div>`
              : ''
          }
        </div>
        <div class="card card-pad">
          <div class="card-header"><span class="card-title">Criteria & weights</span><button class="btn btn-sm" id="add-criterion-btn">${icon('plus', 'icon-sm')}</button></div>
          ${criteria.length ? criteria.map(criterionRow).join('') : `<p class="muted text-sm">No criteria yet — add some or use AI analysis.</p>`}
          <p class="text-xs muted" style="margin-top:var(--sp-3)">Weights are yours to set. Scoring math is always computed locally, never guessed by AI.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('analyze-btn').addEventListener('click', () => runAnalysis(id, options.map((o) => o.name)));
  document.getElementById('add-option-btn').addEventListener('click', () => addOption(id));
  document.getElementById('add-criterion-btn').addEventListener('click', () => addCriterion(id));

  rootRef.querySelectorAll('[data-weight-dot]').forEach((dot) =>
    dot.addEventListener('click', async () => {
      const critId = dot.dataset.critId;
      const value = Number(dot.dataset.weightDot);
      await api.patch(`/api/decisions/${id}/criteria/${critId}`, { weight: value });
      renderDetail(id);
    })
  );
  rootRef.querySelectorAll('[data-decide]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      await api.post(`/api/decisions/${id}/decide`, { optionId: Number(btn.dataset.decide) });
      toast('Decision recorded', 'success');
      renderDetail(id);
    })
  );
  rootRef.querySelectorAll('[data-delete-option]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Remove option?', message: 'Its pros, cons and ratings will be lost.', confirmLabel: 'Remove' });
      if (!ok) return;
      await api.del(`/api/decisions/${id}/options/${btn.dataset.deleteOption}`);
      renderDetail(id);
    })
  );
}

function criterionRow(c) {
  return `
    <div class="criterion-row">
      <span class="crit-name">${escapeHtml(c.name)}</span>
      <div class="weight-dots">
        ${[1, 2, 3, 4, 5].map((v) => `<div class="weight-dot ${v <= c.weight ? 'filled' : ''}" data-weight-dot="${v}" data-crit-id="${c.id}"></div>`).join('')}
      </div>
    </div>
  `;
}

function optionCard(scored, option, isTop, criteria, decision) {
  const recommended = isTop && scored.percent >= 50;
  return `
    <div class="option-card ${recommended ? 'recommended' : ''}" style="margin-bottom:var(--sp-3)">
      ${recommended ? `<div class="option-rank-badge">Recommended</div>` : ''}
      <div class="row-between">
        <strong class="text-sm">${escapeHtml(scored.name)}</strong>
        <div class="row" style="gap:6px">
          ${decision.status !== 'decided' ? `<button class="btn btn-sm" data-decide="${scored.id}">Choose this</button>` : ''}
          <button class="icon-btn" data-delete-option="${scored.id}" aria-label="Remove">${icon('x', 'icon-sm')}</button>
        </div>
      </div>
      <div class="option-score-bar">
        <div class="progress-track" style="flex:1"><div class="progress-fill" style="width:${scored.percent}%"></div></div>
        <span class="text-xs muted">${scored.percent}%</span>
      </div>
      ${scored.incomplete ? `<p class="text-xs muted" style="margin-bottom:var(--sp-2)">Some criteria aren't rated for this option yet (defaulted to neutral).</p>` : ''}
      <div class="pros-cons">
        <div><div class="pc-title" style="color:var(--accent-600)">Pros</div><ul>${(scored.pros || []).map((p) => `<li>${escapeHtml(p)}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
        <div><div class="pc-title" style="color:var(--danger-500)">Cons</div><ul>${(scored.cons || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
      </div>
      ${scored.risks && scored.risks.length ? `<div style="margin-top:var(--sp-2)"><div class="pc-title text-xs" style="color:var(--warning-600)">Risks</div><ul class="text-xs" style="color:var(--text-secondary)">${scored.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>` : ''}
    </div>
  `;
}

async function runAnalysis(id, existingOptionNames) {
  const { api, toast, state } = ctxRef;
  if (!state.aiConfigured) return toast('AI is not configured on this server. Add ANTHROPIC_API_KEY to enable analysis.', 'error');
  if (!existingOptionNames.length) return toast('Add at least one option first.', 'error');
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Analyzing…`;
  try {
    const result = await api.post(`/api/decisions/${id}/analyze`, { options: existingOptionNames });
    if (!result.ok) {
      toast(result.error, 'error');
      btn.disabled = false;
      btn.innerHTML = `${icon('sparkle', 'icon-sm')} Analyze with AI`;
      return;
    }
    toast('Analysis complete', 'success');
    renderDetail(id);
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = `${icon('sparkle', 'icon-sm')} Analyze with AI`;
  }
}

function addOption(id) {
  const { api, toast } = ctxRef;
  openModal({
    title: 'Add an option',
    bodyHtml: `<form id="opt-form"><div class="field"><label class="field-label">Option name</label><input class="input" name="name" required /></div></form>`,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="opt-save">Add</button>`,
    onMount: () => {
      document.getElementById('opt-save').addEventListener('click', async () => {
        const name = document.querySelector('#opt-form [name=name]').value.trim();
        if (!name) return toast('Name is required.', 'error');
        await api.post(`/api/decisions/${id}/options`, { name });
        closeModal();
        renderDetail(id);
      });
    },
  });
}

function addCriterion(id) {
  const { api, toast } = ctxRef;
  openModal({
    title: 'Add a criterion',
    bodyHtml: `<form id="crit-form" class="stack"><div class="field"><label class="field-label">Criterion name</label><input class="input" name="name" placeholder="e.g. Cost, Risk, Convenience" required /></div><div class="field"><label class="field-label">Weight (1-5)</label><input class="input" type="number" name="weight" min="1" max="5" value="3" /></div></form>`,
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="crit-save">Add</button>`,
    onMount: () => {
      document.getElementById('crit-save').addEventListener('click', async () => {
        const form = document.getElementById('crit-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.name.trim()) return toast('Name is required.', 'error');
        await api.post(`/api/decisions/${id}/criteria`, { name: fd.name.trim(), weight: Number(fd.weight) });
        closeModal();
        renderDetail(id);
      });
    },
  });
}
