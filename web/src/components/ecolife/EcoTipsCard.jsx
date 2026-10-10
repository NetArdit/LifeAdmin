import { Icon } from '../Icon.jsx';

// Direct port of loadTips()'s rendered output from the original
// public/js/pages/ecolife.js. Same shape as BillSense's AiInsightsCard
// (unavailable/loading/error/data), kept as its own small component rather
// than a shared generic one — the two features' "data" state renders
// differently (a flat string list vs. {area, tip} pairs), and with only
// two occurrences so far the shared shell would save little while adding
// an indirection layer (see PHASE_5_MIGRATION_BATCH_REPORT.md §6).
export function EcoTipsCard({ state }) {
  if (!state) return null;

  if (state.unavailable) {
    return (
      <div className="card card-pad" style={{ marginBottom: 'var(--sp-5)' }}>
        <p className="text-sm muted">
          <Icon name="info" cls="icon-sm" /> AI tips require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo.
        </p>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="card card-pad" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="loading-line">
          <span className="spinner" /> Finding practical suggestions for you…
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="card card-pad" style={{ marginBottom: 'var(--sp-5)' }}>
        <p className="field-error">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 'var(--sp-5)', borderColor: 'var(--brand-soft-border)' }}>
      <div className="card-header">
        <span className="card-title">
          <Icon name="sparkle" cls="icon-sm" /> Suggestions for you
        </span>
      </div>
      <div className="stack">
        {state.data.tips.map((t, idx) => (
          <div key={idx}>
            <strong className="text-sm" style={{ textTransform: 'capitalize' }}>{t.area}</strong>
            <p className="text-sm muted">{t.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
