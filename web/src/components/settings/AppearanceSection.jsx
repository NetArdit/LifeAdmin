import { useState } from 'react';
import { applyTheme } from '../../../../public/js/theme.js';

const THEMES = ['system', 'light', 'dark'];

// Direct port of renderAppearance() from the original
// public/js/pages/settings.js. Reuses the exact same applyTheme() the
// pre-paint <script> in index.html already uses — a plain DOM/localStorage
// function, already framework-agnostic since Phase 1, not rewritten here.
// Visual Redesign Batch 11B: this is now the ONLY theme control in the
// app — the topbar's own theme-toggle button (previously a duplicate
// quick-access entry point to this exact same preference) was removed
// per the approved design direction (theme selection belongs in
// Settings -> Appearance only).
export function AppearanceSection({ ctx }) {
  const { api, state } = ctx;
  const [theme, setTheme] = useState(state.user.theme);

  async function handleSelect(t) {
    const { user } = await api.patch('/api/settings/preferences', { theme: t });
    state.user = user;
    applyTheme(t);
    setTheme(t);
  }

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Appearance</span>
      </div>
      <div className="row" style={{ gap: 'var(--sp-2)' }}>
        {THEMES.map((t) => (
          <button
            key={t}
            className={`pill ${theme === t ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
            onClick={() => handleSelect(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
