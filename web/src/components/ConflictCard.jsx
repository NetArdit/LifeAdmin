import { Icon } from './Icon.jsx';

// Direct port of conflictCard() from the original dashboard.js.
export function ConflictCard({ count }) {
  return (
    <div className="card card-pad" style={{ borderColor: 'var(--warning-400)' }}>
      <div className="row" style={{ gap: 'var(--sp-3)' }}>
        <Icon name="alert" cls="icon-lg" />
        <div>
          <strong className="text-sm">{count} schedule conflict{count === 1 ? '' : 's'} detected</strong>
          <p className="text-xs muted" style={{ marginTop: 2 }}>
            Some timed tasks overlap. <a href="#/tasks" style={{ color: 'var(--brand)' }}>Review tasks</a>
          </p>
        </div>
      </div>
    </div>
  );
}
