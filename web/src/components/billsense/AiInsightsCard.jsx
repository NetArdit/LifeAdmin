import { Icon } from '../Icon.jsx';

// Direct port of loadInsights()/aiUnavailableHtml()'s rendered output from
// the original public/js/pages/billsense.js. `state` is null until the "AI
// insights" button is clicked (matches the original's empty
// #ai-insights-card div before that first click) — this component just
// renders whatever state the page's loadInsights() produced; it doesn't
// fetch anything itself.
export function AiInsightsCard({ state }) {
  if (!state) return null;

  if (state.unavailable) {
    return (
      <div className="card card-pad" style={{ marginBottom: 'var(--sp-5)' }}>
        <p className="text-sm muted">
          <Icon name="info" cls="icon-sm" /> AI insights require an ANTHROPIC_API_KEY to be configured. This feature is UI-ready but disabled in this local demo.
        </p>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="card card-pad">
        <div className="loading-line">
          <span className="spinner" /> Analyzing your spending…
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="card card-pad">
        <p className="field-error">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 'var(--sp-5)', borderColor: 'var(--brand-soft-border)' }}>
      <div className="card-header">
        <span className="card-title">
          <Icon name="sparkle" cls="icon-sm" /> AI insights
        </span>
      </div>
      <ul className="stack" style={{ gap: '6px' }}>
        {state.data.insights.map((i, idx) => (
          <li className="text-sm" key={idx}>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
