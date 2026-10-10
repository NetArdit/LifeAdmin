// Direct port of criterionRow() from the original public/js/pages/decisionflow.js.
// Clicking a dot sets the weight to that dot's value (1-5) immediately —
// no debounce, no local optimistic state, matching the original exactly
// (each click PATCHes then refetches the whole detail payload, since the
// weight change also changes every option's score).
export function CriterionRow({ criterion, onSetWeight }) {
  return (
    <div className="criterion-row">
      <span className="crit-name">{criterion.name}</span>
      <div className="weight-dots">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            className={`weight-dot ${v <= criterion.weight ? 'filled' : ''}`}
            aria-label={`Set weight to ${v}`}
            aria-pressed={v <= criterion.weight}
            onClick={() => onSetWeight(criterion.id, v)}
          />
        ))}
      </div>
    </div>
  );
}
