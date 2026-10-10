import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { ProfileSection } from '../components/settings/ProfileSection.jsx';
import { SecuritySection } from '../components/settings/SecuritySection.jsx';
import { NotificationsSection } from '../components/settings/NotificationsSection.jsx';
import { AppearanceSection } from '../components/settings/AppearanceSection.jsx';
import { AiSection } from '../components/settings/AiSection.jsx';
import { DataSection } from '../components/settings/DataSection.jsx';
import { DemoSection } from '../components/settings/DemoSection.jsx';

const SECTIONS = [
  ['profile', 'Profile', 'family'],
  ['security', 'Security', 'settings'],
  ['notifications', 'Notifications', 'bell'],
  ['appearance', 'Appearance', 'sun'],
  ['ai', 'AI preferences', 'sparkle'],
  ['data', 'Data', 'download'],
  ['demo', 'Demo mode', 'star'],
];

// Same module-level persistence pattern established for Family.jsx (Phase
// 3) and Assistant.jsx (Phase 7): the router fully unmounts/remounts this
// page on every navigation, and the original vanilla page's own
// `let activeSection = 'profile'` persisted across its own re-mounts
// (nav clicks call mount(root, ctx) again) — this reproduces that exactly.
let savedActiveSection = 'profile';

// React port of public/js/pages/settings.js's mount(). The nav is built as
// a real ARIA tablist (vertical orientation is a valid APG tabs pattern),
// same reasoning as Assistant's Chat/Plan tabs (Phase 7) — the original
// already used real <a> tags here (natively focusable, unlike the shared
// `.tabs` div problem elsewhere), so this properly annotates an
// already-keyboard-reachable control rather than fixing a broken one.
// See PHASE_8_SETTINGS_MIGRATION_REPORT.md for the full audit.
export function Settings({ ctx }) {
  const [activeSection, setActiveSectionState] = useState(savedActiveSection);

  function setActiveSection(key) {
    savedActiveSection = key;
    setActiveSectionState(key);
  }

  function handleNavKeyDown(e) {
    const idx = SECTIONS.findIndex(([key]) => key === activeSection);
    let nextIdx = null;
    if (e.key === 'ArrowDown') nextIdx = (idx + 1) % SECTIONS.length;
    else if (e.key === 'ArrowUp') nextIdx = (idx - 1 + SECTIONS.length) % SECTIONS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = SECTIONS.length - 1;
    if (nextIdx === null) return;
    e.preventDefault();
    const nextKey = SECTIONS[nextIdx][0];
    setActiveSection(nextKey);
    document.getElementById(`settings-tab-${nextKey}`)?.focus();
  }

  const SectionComponent = {
    profile: ProfileSection,
    security: SecuritySection,
    notifications: NotificationsSection,
    appearance: AppearanceSection,
    ai: AiSection,
    data: DataSection,
    demo: DemoSection,
  }[activeSection];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile, security, and preferences.</p>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav" role="tablist" aria-label="Settings sections" aria-orientation="vertical" onKeyDown={handleNavKeyDown}>
          {SECTIONS.map(([key, label, icon]) => (
            <div
              key={key}
              id={`settings-tab-${key}`}
              className={`settings-nav-item ${activeSection === key ? 'active' : ''}`}
              role="tab"
              aria-selected={activeSection === key}
              aria-controls={`settings-panel-${key}`}
              tabIndex={activeSection === key ? 0 : -1}
              onClick={() => setActiveSection(key)}
            >
              <span className="settings-nav-icon"><Icon name={icon} cls="icon-sm" /></span>
              <span>{label}</span>
            </div>
          ))}
        </nav>
        <div id={`settings-panel-${activeSection}`} role="tabpanel" aria-labelledby={`settings-tab-${activeSection}`} tabIndex={0}>
          <SectionComponent ctx={ctx} />
        </div>
      </div>
    </div>
  );
}
