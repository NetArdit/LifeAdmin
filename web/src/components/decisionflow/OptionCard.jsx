import { Icon } from '../Icon.jsx';

// Direct port of optionCard() from the original public/js/pages/decisionflow.js.
// `scored` already carries pros/cons/risks (the backend's scoreOptions()
// maps them onto each ranked entry) — the original also passed a separate
// `option` and `criteria` argument that its own render never actually used;
// not carried forward here since dead parameters have no observable effect.
export function OptionCard({ scored, isTop, decisionStatus, onDecide, onDelete }) {
  const recommended = isTop && scored.percent >= 50;
  return (
    <div className={`option-card ${recommended ? 'recommended' : ''}`} style={{ marginBottom: 'var(--sp-3)' }}>
      {recommended ? <div className="option-rank-badge">Recommended</div> : null}
      <div className="row-between">
        <strong className="text-sm">{scored.name}</strong>
        <div className="row" style={{ gap: 6 }}>
          {decisionStatus !== 'decided' ? (
            <button className="btn btn-sm" onClick={() => onDecide(scored.id)}>
              Choose this
            </button>
          ) : null}
          <button className="icon-btn" aria-label="Remove" onClick={() => onDelete(scored.id)}>
            <Icon name="x" cls="icon-sm" />
          </button>
        </div>
      </div>
      <div className="option-score-bar">
        <div className="progress-track" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${scored.percent}%` }} />
        </div>
        <span className="text-xs muted">{scored.percent}%</span>
      </div>
      {scored.incomplete ? (
        <p className="text-xs muted" style={{ marginBottom: 'var(--sp-2)' }}>
          Some criteria aren't rated for this option yet (defaulted to neutral).
        </p>
      ) : null}
      <div className="pros-cons">
        <div>
          <div className="pc-title" style={{ color: 'var(--accent-600)' }}>Pros</div>
          <ul>{(scored.pros || []).length ? scored.pros.map((p, i) => <li key={i}>{p}</li>) : <li className="muted">—</li>}</ul>
        </div>
        <div>
          <div className="pc-title" style={{ color: 'var(--danger-500)' }}>Cons</div>
          <ul>{(scored.cons || []).length ? scored.cons.map((c, i) => <li key={i}>{c}</li>) : <li className="muted">—</li>}</ul>
        </div>
      </div>
      {scored.risks && scored.risks.length ? (
        <div style={{ marginTop: 'var(--sp-2)' }}>
          <div className="pc-title text-xs" style={{ color: 'var(--warning-600)' }}>Risks</div>
          <ul className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {scored.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
