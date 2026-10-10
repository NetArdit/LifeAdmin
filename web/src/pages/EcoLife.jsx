import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { useEcoLogs } from '../hooks/useEcoLogs.js';
import { LogRow } from '../components/ecolife/LogRow.jsx';
import { EcoTipsCard } from '../components/ecolife/EcoTipsCard.jsx';
import { openLogFormModal } from '../components/ecolife/LogFormModal.jsx';
import { confirmDialog } from '../../../public/js/components/confirm.js';

const CATEGORIES = ['transport', 'energy', 'food', 'shopping', 'waste', 'water'];
const CATEGORY_ICON = { transport: 'refresh', energy: 'sun', food: 'cart', shopping: 'cart', waste: 'trash', water: 'refresh' };
const ECO_CATEGORY_LABEL = { transport: 'Transport', energy: 'Energy', food: 'Food', shopping: 'Shopping', waste: 'Waste', water: 'Water' };

// React port of public/js/pages/ecolife.js. Same category-tile grid,
// recent-activity list, and AI-tips slot; see
// PHASE_5_MIGRATION_BATCH_REPORT.md for the full parity matrix.
export function EcoLife({ ctx }) {
  const { api, toast, state } = ctx;
  const { logs, summary, totalLogs, loading, error, refetch } = useEcoLogs(api);
  const [tips, setTips] = useState(null);

  async function handleDelete(logId) {
    const ok = await confirmDialog({ title: 'Delete this log?', message: 'This entry will be permanently removed.', confirmLabel: 'Delete' });
    if (!ok) return;
    await api.del(`/api/ecolife/${logId}`);
    refetch();
  }

  async function loadTips() {
    if (!state.aiConfigured) {
      setTips({ unavailable: true });
      return;
    }
    setTips({ loading: true });
    try {
      const result = await api.post('/api/ecolife/tips', {});
      if (!result.ok) {
        setTips({ error: result.error });
        return;
      }
      setTips({ data: result.data });
    } catch (err) {
      setTips({ error: err.message });
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Loading EcoLife…
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">EcoLife</h1>
          <p className="page-subtitle">Track habits and get practical, honest sustainability suggestions.</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={loadTips}>
            <Icon name="sparkle" cls="icon-sm" /> Get tips
          </button>
          <button className="btn btn-primary" onClick={() => openLogFormModal({ api, toast, onSaved: refetch })}>
            <Icon name="plus" cls="icon-sm" /> Log an action
          </button>
        </div>
      </div>

      <EcoTipsCard state={tips} />

      <div className="grid-3" style={{ marginBottom: 'var(--sp-6)' }}>
        {CATEGORIES.map((cat) => (
          <div className="card eco-cat-card" key={cat}>
            <div className="eco-cat-icon">
              <Icon name={CATEGORY_ICON[cat]} cls="icon" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-lg)' }}>{summary[cat].count}</div>
            <div className="muted text-xs">{ECO_CATEGORY_LABEL[cat]} logs</div>
          </div>
        ))}
      </div>

      {logs.length ? (
        <div className="list-region module-accent--nature">
          <div className="list-region-heading">{totalLogs} logged in the last 30 days</div>
          <div className="row-list">
            {logs.slice(0, 15).map((l) => (
              <LogRow key={l.id} log={l} onDelete={handleDelete} />
            ))}
          </div>
          {logs.length > 15 ? <p className="muted text-xs" style={{ marginTop: 'var(--sp-2)' }}>Showing the 15 most recent.</p> : null}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Icon name="eco" cls="icon-lg" />
            <h3>No logs yet</h3>
            <p>Log small everyday actions — taking the bus, recycling, a meatless meal — to see patterns and get tips.</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--sp-2)' }} onClick={() => openLogFormModal({ api, toast, onSaved: refetch })}>
              Log an action
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
