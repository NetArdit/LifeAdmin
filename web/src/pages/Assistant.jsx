import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { ChatTab } from '../components/assistant/ChatTab.jsx';
import { PlanTab } from '../components/assistant/PlanTab.jsx';
import { openWeeklyReviewModal } from '../components/assistant/WeeklyReviewModal.jsx';

const TABS = [
  ['chat', 'Chat'],
  ['plan', 'Plan my week'],
];

// Same module-level persistence pattern established for Family.jsx (Phase
// 3): the app's router fully unmounts/remounts this page on every
// navigation, so a plain useState would reset activeTab on every visit —
// the original vanilla page's own `let activeTab = 'chat'` persisted
// across its own re-mounts (tab clicks call mount(root, ctx) again), and
// this reproduces that exactly.
let savedActiveTab = 'chat';

// React port of public/js/pages/assistant.js's mount(). Tabs are built as
// a real ARIA tablist (role="tablist"/"tab"/"tabpanel", aria-selected,
// roving tabindex, Left/Right/Home/End keyboard navigation) — the
// original's tabs (and Family's, from Phase 3) are plain clickable divs
// with no keyboard path at all; Phase 3.5 deliberately deferred fixing
// that shared gap rather than reopening it unnecessarily, but explicitly
// called for any *newly migrated* page that introduces a tab system to
// implement it correctly rather than knowingly repeating the gap. This is
// that page. See PHASE_7_ASSISTANT_MIGRATION_REPORT.md for the full audit.
export function Assistant({ ctx }) {
  const { api, toast, state } = ctx;
  const [activeTab, setActiveTabState] = useState(savedActiveTab);

  function setActiveTab(key) {
    savedActiveTab = key;
    setActiveTabState(key);
  }

  function handleTabKeyDown(e) {
    const idx = TABS.findIndex(([key]) => key === activeTab);
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = TABS.length - 1;
    if (nextIdx === null) return;
    e.preventDefault();
    const nextKey = TABS[nextIdx][0];
    setActiveTab(nextKey);
    document.getElementById(`assistant-tab-${nextKey}`)?.focus();
  }

  if (!state.aiConfigured) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Assistant</h1>
            <p className="page-subtitle">Your AI-powered life copilot.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty-state">
            <Icon name="assistant" cls="icon-lg" />
            <h3>AI is not configured</h3>
            <p>The assistant, natural-language planner, DecisionFlow analysis, and insights all need an ANTHROPIC_API_KEY set on the server. The rest of LifeAdmin works fully without it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page assistant-page-flex">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assistant</h1>
          <p className="page-subtitle">Ask about your week, priorities, bills, or your circle — grounded only in your real data.</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => openWeeklyReviewModal({ api, toast, aiConfigured: state.aiConfigured })}>
            <Icon name="sparkle" cls="icon-sm" /> Weekly review
          </button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--sp-5)' }} role="tablist" aria-label="Assistant views" onKeyDown={handleTabKeyDown}>
        {TABS.map(([key, label]) => (
          <div
            key={key}
            id={`assistant-tab-${key}`}
            className={`tab ${activeTab === key ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`assistant-panel-${key}`}
            tabIndex={activeTab === key ? 0 : -1}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        id={`assistant-panel-${activeTab}`}
        className="assistant-tabpanel-fill"
        role="tabpanel"
        aria-labelledby={`assistant-tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'chat' ? <ChatTab api={api} toast={toast} /> : <PlanTab ctx={ctx} />}
      </div>
    </div>
  );
}
