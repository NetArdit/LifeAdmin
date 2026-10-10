import { Icon } from '../Icon.jsx';
import { useDecisions } from '../../hooks/useDecisions.js';
import { DecisionRow } from './DecisionRow.jsx';
import { openNewDecisionModal } from './NewDecisionModal.jsx';

// Visual Redesign Batch 8: decisions accumulate and are individually
// scanned/opened the same way tasks/bills/timeline entries do — a
// continuum, not a small bounded set (unlike, say, Family's member
// roster) — so per the established SET-vs-CONTINUUM rule this list
// belongs in a `.list-region`, not the plain `.card.card-pad` it was
// wrapped in pre-redesign. Reasoning is the accent: `decision_made`
// activity rows already render with it in Timeline/Family/Dashboard
// (see EVENT_META in those files) — this is the first time DecisionFlow's
// own page adopts the accent already associated with it everywhere else.
//
// Open/Decided split mirrors Goals' active/completed-inactive split
// (Batch 7C) — the same, by-now-proven pattern for separating what still
// needs attention from what's settled, applied here because it answers
// DecisionFlow's own primary question ("which decisions are still open")
// at a glance instead of requiring the user to scan a flat list for
// status badges.
export function DecisionList({ ctx }) {
  const { api, toast } = ctx;
  const { decisions, loading, error, refetch } = useDecisions(api);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Loading decisions…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load this page</h3>
          <p>{error.message}</p>
          <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const open = decisions.filter((d) => d.status !== 'decided');
  const decided = decisions.filter((d) => d.status === 'decided');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">DecisionFlow</h1>
          <p className="page-subtitle">Structure hard decisions with clear, transparent reasoning.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openNewDecisionModal({ api, toast })}>
            <Icon name="plus" cls="icon-sm" /> New decision
          </button>
        </div>
      </div>

      {open.length ? (
        <div className="list-region module-accent--reasoning">
          <div className="list-region-heading">{open.length} open decision{open.length === 1 ? '' : 's'}</div>
          <div className="row-list">
            {open.map((d) => (
              <DecisionRow key={d.id} decision={d} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Icon name="decision" cls="icon-lg" />
            <h3>No open decisions</h3>
            <p>Describe something you're trying to decide — LifeAdmin will help you weigh it clearly.</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--sp-2)' }} onClick={() => openNewDecisionModal({ api, toast })}>
              Start a decision
            </button>
          </div>
        </div>
      )}

      {decided.length ? (
        <div className="list-region module-accent--reasoning" style={{ marginTop: 'var(--sp-6)' }}>
          <div className="list-region-heading">Decided</div>
          <div className="row-list">
            {decided.map((d) => (
              <DecisionRow key={d.id} decision={d} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
