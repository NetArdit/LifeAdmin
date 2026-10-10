// Direct port of renderDemo() from the original public/js/pages/settings.js.
// No disable-while-pending guard added here — unlike the higher-stakes
// flows this phase specifically audited (password change, profile save,
// account deletion, verify-confirm), seed/clear demo data is low-stakes
// and non-destructive-to-real-data, so this stays a faithful 1:1 port
// rather than adding an unrequested defensive control everywhere.
export function DemoSection({ ctx }) {
  const { api, toast } = ctx;

  async function handleSeed() {
    await api.post('/api/demo/seed');
    toast('Demo data loaded — check the Dashboard', 'success');
  }
  async function handleClear() {
    await api.post('/api/demo/clear');
    toast('Demo-tagged tasks and bills cleared', 'success');
  }

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Demo mode</span>
      </div>
      <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
        Load sample tasks, bills, a circle, decisions, goals and eco logs to explore LifeAdmin quickly. You can clear demo-tagged tasks/bills at any time.
      </p>
      <div className="row" style={{ gap: 'var(--sp-2)' }}>
        <button className="btn btn-primary" onClick={handleSeed}>
          Load demo data
        </button>
        <button className="btn" onClick={handleClear}>
          Clear demo data
        </button>
      </div>
    </div>
  );
}
