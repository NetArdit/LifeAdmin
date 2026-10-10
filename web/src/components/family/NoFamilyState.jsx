import { Icon } from '../Icon.jsx';

// Direct port of noFamilyHtml() from the original public/js/pages/family.js.
export function NoFamilyState({ onCreate, onJoin }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Family</h1>
          <p className="page-subtitle">Shared responsibilities, chat, and activity.</p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <Icon name="family" cls="icon-lg" />
          <h3>No family yet</h3>
          <p>Create a family to share tasks, bills, a chat and a shopping list with the people you live with.</p>
          <div className="row" style={{ marginTop: 'var(--sp-2)', gap: 'var(--sp-2)' }}>
            <button className="btn btn-primary" onClick={onCreate}>
              Create a family
            </button>
            <button className="btn" onClick={onJoin}>
              Join with a code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
