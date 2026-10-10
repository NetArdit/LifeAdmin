import { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { confirmDialog } from '../../../../public/js/components/confirm.js';
import { useDecisionDetail } from '../../hooks/useDecisionDetail.js';
import { CriterionRow } from './CriterionRow.jsx';
import { OptionCard } from './OptionCard.jsx';
import { openAddOptionModal } from './AddOptionModal.jsx';
import { openAddCriterionModal } from './AddCriterionModal.jsx';

const CONFIDENCE_BADGE = { high: 'badge-success', medium: 'badge-medium', low: 'badge-low' };

// React port of renderDetail() from the original public/js/pages/decisionflow.js.
// scoring.ranked is entirely server-computed (src/routes/decisions.js's
// scoreOptions()) from user-set criterion weights — this component only
// displays it and never recomputes anything locally. AI ("Analyze with
// AI") only ever proposes criteria/options/ratings/reasoning; it never
// touches the weighted-score math.
export function DecisionDetail({ ctx, id }) {
  const { api, toast, state } = ctx;
  const { decision, criteria, options, scoring, loading, error, refetch } = useDecisionDetail(api, id);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleSetWeight(critId, value) {
    await api.patch(`/api/decisions/${id}/criteria/${critId}`, { weight: value });
    refetch();
  }

  async function handleDecide(optionId) {
    await api.post(`/api/decisions/${id}/decide`, { optionId });
    toast('Decision recorded', 'success');
    refetch();
  }

  async function handleDeleteOption(optionId) {
    const ok = await confirmDialog({ title: 'Remove option?', message: 'Its pros, cons and ratings will be lost.', confirmLabel: 'Remove' });
    if (!ok) return;
    await api.del(`/api/decisions/${id}/options/${optionId}`);
    refetch();
  }

  // Visual Redesign Batch 8: DELETE /api/decisions/:id already existed on
  // the backend (used nowhere in the UI — a real, dormant capability found
  // during this batch's audit) — this wires up the one control that was
  // missing, reusing the same confirmDialog pattern already used for
  // option removal above.
  async function handleDeleteDecision() {
    const ok = await confirmDialog({ title: 'Delete this decision?', message: 'This cannot be undone.', confirmLabel: 'Delete' });
    if (!ok) return;
    await api.del(`/api/decisions/${id}`);
    toast('Decision deleted', 'success');
    location.hash = '#/decisionflow';
  }

  async function handleAnalyze() {
    if (!state.aiConfigured) return toast('AI is not configured on this server. Add ANTHROPIC_API_KEY to enable analysis.', 'error');
    if (!options.length) return toast('Add at least one option first.', 'error');
    setAnalyzing(true);
    try {
      const result = await api.post(`/api/decisions/${id}/analyze`, { options: options.map((o) => o.name) });
      if (!result.ok) {
        toast(result.error, 'error');
        return;
      }
      toast('Analysis complete', 'success');
      refetch();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Loading…
        </div>
      </div>
    );
  }

  // Visual Redesign Batch 8: previously a bare <p class="field-error">,
  // the weakest error treatment anywhere in the app (no icon, no heading,
  // no retry) — brought in line with every other page's error state,
  // including Goals' own equivalent fix (Batch 7C).
  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load this decision</h3>
          <p>{error.message}</p>
          <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chosenOption = decision.status === 'decided' ? scoring.ranked.find((o) => o.id === decision.chosenOptionId) : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <a href="#/decisionflow" className="text-xs muted">&larr; All decisions</a>
          <h1 className="page-title" style={{ marginTop: 6 }}>{decision.question}</h1>
          {decision.status === 'decided' ? (
            <p className="page-subtitle">Decided{chosenOption ? `: ${chosenOption.name}` : ''}</p>
          ) : (
            <p className="page-subtitle">Open decision</p>
          )}
        </div>
        <div className="page-actions">
          <button className="btn" disabled={analyzing} onClick={handleAnalyze}>
            {analyzing ? <span className="spinner" /> : <Icon name="sparkle" cls="icon-sm" />} {analyzing ? 'Analyzing…' : 'Analyze with AI'}
          </button>
          <button className="btn btn-ghost" onClick={handleDeleteDecision}>
            <Icon name="trash" cls="icon-sm" /> Delete
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="stack">
          <div className="card card-pad module-accent--reasoning">
            <div className="card-header">
              <span className="card-title">Options</span>
              <button className="btn btn-sm" onClick={() => openAddOptionModal({ api, toast, decisionId: id, onSaved: refetch })}>
                <Icon name="plus" cls="icon-sm" /> Add option
              </button>
            </div>
            <div className="stack" id="options-list">
              {options.length ? (
                scoring.ranked.map((r, i) => (
                  <OptionCard
                    key={r.id}
                    scored={r}
                    isTop={i === 0}
                    decisionStatus={decision.status}
                    onDecide={handleDecide}
                    onDelete={handleDeleteOption}
                  />
                ))
              ) : (
                <p className="muted text-sm">Add at least two options to compare.</p>
              )}
            </div>
          </div>
          {decision.recommendation ? (
            <div className="card card-pad" style={{ borderColor: 'var(--brand-soft-border)' }}>
              <div className="card-header">
                <span className="card-title">
                  <Icon name="sparkle" cls="icon-sm" /> AI reasoning
                </span>
                <span className={`badge ${CONFIDENCE_BADGE[decision.recommendation.confidence] || 'badge-low'}`}>
                  {decision.recommendation.confidence} confidence
                </span>
              </div>
              <p className="text-sm">{decision.recommendation.reasoningSummary || ''}</p>
              {decision.recommendation.missingInfo && decision.recommendation.missingInfo.length ? (
                <div style={{ marginTop: 'var(--sp-3)' }}>
                  <strong className="text-xs">What would improve confidence:</strong>
                  <ul className="stack" style={{ gap: 4, marginTop: 6 }}>
                    {decision.recommendation.missingInfo.map((m, i) => (
                      <li className="text-sm muted" key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="card card-pad module-accent--reasoning">
          <div className="card-header">
            <span className="card-title">Criteria & weights</span>
            <button className="btn btn-sm" onClick={() => openAddCriterionModal({ api, toast, decisionId: id, onSaved: refetch })}>
              <Icon name="plus" cls="icon-sm" />
            </button>
          </div>
          {criteria.length ? (
            criteria.map((c) => <CriterionRow key={c.id} criterion={c} onSetWeight={handleSetWeight} />)
          ) : (
            <p className="muted text-sm">No criteria yet — add some or use AI analysis.</p>
          )}
          <p className="text-xs muted" style={{ marginTop: 'var(--sp-3)' }}>Weights are yours to set. Scoring math is always computed locally, never guessed by AI.</p>
        </div>
      </div>
    </div>
  );
}
