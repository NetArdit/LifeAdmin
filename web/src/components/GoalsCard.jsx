// Direct port of goalsCard() from the original dashboard.js.
export function GoalsCard({ goals }) {
  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Goals in progress</span>
        <a href="#/goals" className="text-xs" style={{ color: 'var(--brand)' }}>View all</a>
      </div>
      {goals.length ? (
        goals.map((g) => (
          <div key={g.id} style={{ marginBottom: 'var(--sp-3)' }}>
            <div className="row-between text-sm" style={{ marginBottom: 4 }}>
              <span>{g.title}</span>
              <span className="muted">{g.progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${g.progress}%` }} />
            </div>
          </div>
        ))
      ) : (
        <p className="muted text-sm">No active goals yet.</p>
      )}
    </div>
  );
}
