import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { useFamilies } from '../hooks/useFamilies.js';
import { NoFamilyState } from '../components/family/NoFamilyState.jsx';
import { openCreateFamilyModal } from '../components/family/CreateFamilyModal.jsx';
import { openJoinFamilyModal } from '../components/family/JoinFamilyModal.jsx';
import { OverviewTab } from '../components/family/OverviewTab.jsx';
import { MembersTab } from '../components/family/MembersTab.jsx';
import { ChatTab } from '../components/family/ChatTab.jsx';
import { ShoppingTab } from '../components/family/ShoppingTab.jsx';
import { ActivityTab } from '../components/family/ActivityTab.jsx';

const TABS = [
  ['overview', 'Overview'],
  ['members', 'Members'],
  ['chat', 'Chat'],
  ['shopping', 'Shopping list'],
  ['activity', 'Activity'],
];

// Module-level, persisted across mount/unmount cycles — matching the
// original's `let activeFamilyId = null;` / `let activeTab = 'overview';`
// declared OUTSIDE mount() in public/js/pages/family.js. This is a real
// behavior a naive port would silently lose: the vanilla page remembers
// which family and which tab you were on even after navigating away to
// another page and back (the module stays loaded for the whole browser
// session; only a hard reload resets it). Dashboard/Tasks had no such
// cross-navigation state to preserve — Family does, so plain useState
// (which resets on every mount) would be an unnoticed regression here.
let savedActiveFamilyId = null;
let savedActiveTab = 'overview';

export function Family({ ctx }) {
  const { api, toast, state } = ctx;
  const { families, loading, error, refetch } = useFamilies(api, state);
  const [activeFamilyId, setActiveFamilyIdState] = useState(savedActiveFamilyId);
  const [activeTab, setActiveTabState] = useState(savedActiveTab);

  function setActiveFamilyId(id) {
    savedActiveFamilyId = id;
    setActiveFamilyIdState(id);
  }
  function setActiveTab(tabKey) {
    savedActiveTab = tabKey;
    setActiveTabState(tabKey);
  }

  // Accessibility fix (Daily Product Quality phase): the tab strip used to
  // be plain <div onClick> pills with no keyboard path at all — Tab skipped
  // over them and there was no way to switch tabs without a mouse. Fixed
  // using the exact same ARIA "Tabs" pattern (role="tablist"/"tab"/
  // "tabpanel", aria-selected, roving tabindex, arrow/Home/End navigation)
  // already established for the Assistant page's tabs — see
  // Assistant.jsx's own comment for why this is the correct, spec-matching
  // pattern (HTML has no native tab-strip element) rather than an
  // ARIA-as-decoration patch, and PHASE_7_ASSISTANT_MIGRATION_REPORT.md for
  // the prior audit that deferred fixing this exact gap in Family.jsx.
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
    document.getElementById(`family-tab-${nextKey}`)?.focus();
  }

  // Same fallback rule as the original:
  // `if (!activeFamilyId || !families.find(...)) activeFamilyId = families[0].id;`
  useEffect(() => {
    if (families.length && !families.some((f) => f.id === activeFamilyId)) {
      setActiveFamilyId(families[0].id);
    }
    // Deliberately depends only on `families`, not `activeFamilyId` — this
    // should run when the family list changes (load, create, join), not
    // every time the user switches tabs/families themselves.
  }, [families]);

  function openCreate() {
    openCreateFamilyModal({
      api,
      toast,
      onCreated: (family) => {
        setActiveFamilyId(family.id);
        refetch();
      },
    });
  }
  function openJoin() {
    openJoinFamilyModal({
      api,
      toast,
      onJoined: (family) => {
        setActiveFamilyId(family.id);
        refetch();
      },
    });
  }

  // Matches the router's own generic loading placeholder text exactly —
  // the original mount() never set its own loading state before this
  // fetch resolved, so whatever the user saw during that fetch WAS the
  // router's placeholder. Reproduced here verbatim rather than inventing a
  // Family-specific loading message the original never had.
  if (loading) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Loading…
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
        </div>
      </div>
    );
  }

  if (!families.length) {
    return <NoFamilyState onCreate={openCreate} onJoin={openJoin} />;
  }

  const currentFamily = families.find((f) => f.id === activeFamilyId) || families[0];
  const myRole = currentFamily.members.find((m) => m.userId === state.user.id)?.role;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Family</h1>
          <p className="page-subtitle">Shared responsibilities, chat, and activity.</p>
        </div>
        <div className="page-actions">
          {families.length > 1 ? (
            <select
              className="select"
              style={{ width: 'auto' }}
              value={activeFamilyId ?? ''}
              onChange={(e) => setActiveFamilyId(Number(e.target.value))}
            >
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          ) : null}
          <button className="btn" onClick={openJoin}>
            Join with a code
          </button>
          <button className="btn" onClick={openCreate}>
            <Icon name="plus" cls="icon-sm" /> New family
          </button>
        </div>
      </div>

      {/* Visual Redesign Batch 5: module-accent--warmth added to the
          wrapper only — every role="tablist"/"tab", aria-selected,
          roving-tabindex and arrow/Home/End keyboard behavior below is
          byte-for-byte unchanged from the accessibility work this phase
          explicitly preserves. The accent is consumed by a single,
          generic components.css rule (`.tab.active` reading
          var(--_accent-border, ...)) that was already safe to add
          app-wide, since it only resolves to something other than the
          existing brand color when an ancestor actually wears a
          module-accent class — Assistant's own tabs (no accent) are
          unaffected. */}
      <div className="tabs family-tabs-wrap module-accent--warmth" role="tablist" aria-label="Family sections" onKeyDown={handleTabKeyDown}>
        {TABS.map(([key, label]) => (
          <div
            key={key}
            id={`family-tab-${key}`}
            className={`tab ${activeTab === key ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`family-panel-${key}`}
            tabIndex={activeTab === key ? 0 : -1}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </div>
        ))}
      </div>

      <div id={`family-panel-${activeTab}`} role="tabpanel" aria-labelledby={`family-tab-${activeTab}`} tabIndex={0}>
        {activeTab === 'overview' ? <OverviewTab api={api} toast={toast} familyId={currentFamily.id} family={currentFamily} myRole={myRole} onChanged={refetch} /> : null}
        {activeTab === 'members' ? (
          <MembersTab api={api} toast={toast} familyId={currentFamily.id} family={currentFamily} myRole={myRole} onChanged={refetch} />
        ) : null}
        {activeTab === 'chat' ? <ChatTab api={api} toast={toast} myUserId={state.user.id} familyId={currentFamily.id} /> : null}
        {activeTab === 'shopping' ? <ShoppingTab api={api} familyId={currentFamily.id} /> : null}
        {activeTab === 'activity' ? <ActivityTab api={api} familyId={currentFamily.id} /> : null}
      </div>
    </div>
  );
}
