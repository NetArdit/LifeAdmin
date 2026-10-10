import { Icon } from '../Icon.jsx';
import { openDeleteAccountModal } from './DeleteAccountModal.jsx';

// Direct port of renderData() from the original public/js/pages/settings.js.
export function DataSection({ ctx }) {
  const { api, toast } = ctx;

  async function handleExport() {
    // Raw fetch, not ctx.api — api.js's request() always JSON-parses the
    // response body, which would break the blob-download flow below;
    // matches the original's own use of a plain fetch() here exactly.
    const res = await fetch('/api/settings/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifeadmin-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="card-header">
          <span className="card-title">Export your data</span>
        </div>
        <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
          Download everything you own as a JSON file.
        </p>
        <button className="btn" onClick={handleExport}>
          <Icon name="download" cls="icon-sm" /> Export as JSON
        </button>
      </div>
      <div className="card card-pad" style={{ borderColor: 'var(--danger-400)' }}>
        <div className="card-header">
          <span className="card-title" style={{ color: 'var(--danger-500)' }}>Delete account</span>
        </div>
        <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
          Permanently deletes your account and all associated data on this machine. This cannot be undone.
        </p>
        <button className="btn btn-danger" onClick={() => openDeleteAccountModal({ api, toast })}>
          Delete my account
        </button>
      </div>
    </div>
  );
}
