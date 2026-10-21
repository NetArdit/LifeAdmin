import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './pages/Dashboard.jsx';
import { Tasks } from './pages/Tasks.jsx';
import { Family } from './pages/Family.jsx';
import { BillSense } from './pages/BillSense.jsx';
import { Goals } from './pages/Goals.jsx';
import { Documents } from './pages/Documents.jsx';
import { EcoLife } from './pages/EcoLife.jsx';
import { Timeline } from './pages/Timeline.jsx';
import { DecisionFlow } from './pages/DecisionFlow.jsx';
import { Assistant } from './pages/Assistant.jsx';
import { Settings } from './pages/Settings.jsx';
import { Routines } from './pages/Routines.jsx';
import { Reflection } from './pages/Reflection.jsx';
// C3 Phase 1: the shell's quick-add FAB (public/js/app.js) reuses this
// exact modal — the same one Tasks' own "New task" button opens — rather
// than a second, parallel task-creation implementation. Re-exported here
// because app.js (plain ES modules, not part of this Vite bundle) can only
// reach it via the same dynamic import('/app/main.js') the router already
// uses for every page.
export { openTaskFormModal } from './components/tasks/TaskFormModal.jsx';

// One shared bundle for every React-migrated page, each with its own
// mount(container, ctx)/unmount() pair — matching the same contract every
// vanilla page module already uses (see public/js/app.js's PAGES map).
// This replaces Phase 1's Dashboard-only bundle: with a second page now
// migrated, building each page as its OWN separate bundle would mean
// shipping a second full copy of React/ReactDOM (React isn't externalized —
// see vite.config.js) for zero benefit, since both pages run in the same
// browser tab moments apart. One shared bundle means React is fetched and
// evaluated once; the browser's module cache serves the second page's
// dynamic import() of this same URL from cache, not a second network round
// trip. See PHASE_2_TASKS_MIGRATION_REPORT.md §15 (Performance).

// Phase 1/2/3 each hand-wrote this exact 10-line root-lifecycle block for
// Dashboard/Tasks/Family — identical every time, varying only by which
// component gets mounted. Every future page migration would otherwise
// copy it again, so it's factored out here (Phase 3.5) once the same block
// existed three times in a row. Nothing about mount/unmount behavior
// changes — this is the same createRoot/render/unmount every page already
// had, just written once.
function makePageMount(Component) {
  let root = null;
  return {
    mount(container, ctx) {
      root = createRoot(container);
      root.render(createElement(Component, { ctx }));
    },
    unmount() {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  };
}

const dashboardMount = makePageMount(Dashboard);
export const mountDashboard = dashboardMount.mount;
export const unmountDashboard = dashboardMount.unmount;

const tasksMount = makePageMount(Tasks);
export const mountTasks = tasksMount.mount;
export const unmountTasks = tasksMount.unmount;

const familyMount = makePageMount(Family);
export const mountFamily = familyMount.mount;
export const unmountFamily = familyMount.unmount;

const billsenseMount = makePageMount(BillSense);
export const mountBillsense = billsenseMount.mount;
export const unmountBillsense = billsenseMount.unmount;

const documentsMount = makePageMount(Documents);
export const mountDocuments = documentsMount.mount;
export const unmountDocuments = documentsMount.unmount;

const goalsMount = makePageMount(Goals);
export const mountGoals = goalsMount.mount;
export const unmountGoals = goalsMount.unmount;

const ecolifeMount = makePageMount(EcoLife);
export const mountEcolife = ecolifeMount.mount;
export const unmountEcolife = ecolifeMount.unmount;

const timelineMount = makePageMount(Timeline);
export const mountTimeline = timelineMount.mount;
export const unmountTimeline = timelineMount.unmount;

const decisionflowMount = makePageMount(DecisionFlow);
export const mountDecisionflow = decisionflowMount.mount;
export const unmountDecisionflow = decisionflowMount.unmount;

const assistantMount = makePageMount(Assistant);
export const mountAssistant = assistantMount.mount;
export const unmountAssistant = assistantMount.unmount;

const reflectionMount = makePageMount(Reflection);
export const mountReflection = reflectionMount.mount;
export const unmountReflection = reflectionMount.unmount;

const routinesMount = makePageMount(Routines);
export const mountRoutines = routinesMount.mount;
export const unmountRoutines = routinesMount.unmount;

const settingsMount = makePageMount(Settings);
export const mountSettings = settingsMount.mount;
export const unmountSettings = settingsMount.unmount;
