import { useState } from 'react';

// Direct port of renderAi() from the original public/js/pages/settings.js.
export function AiSection({ ctx }) {
  const { api, toast, state } = ctx;
  const [aiEnabled, setAiEnabled] = useState(state.user.aiEnabled);

  async function handleToggle(checked) {
    setAiEnabled(checked);
    const { user } = await api.patch('/api/settings/preferences', { aiEnabled: checked });
    state.user = user;
    toast('Preference saved', 'success');
  }

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">AI preferences</span>
      </div>
      <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
        Server status: <strong>{state.aiConfigured ? 'AI enabled' : 'AI not configured (needs ANTHROPIC_API_KEY)'}</strong>
      </p>
      <label className="checkbox-row">
        <input type="checkbox" checked={aiEnabled} onChange={(e) => handleToggle(e.target.checked)} /> Use AI features (assistant, DecisionFlow analysis, planning, insights)
      </label>
      <p className="text-xs muted" style={{ marginTop: 'var(--sp-3)' }}>
        LifeAdmin only sends the minimum context needed for each request — never your whole database — to control cost and protect privacy.
      </p>
    </div>
  );
}
