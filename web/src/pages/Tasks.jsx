import { Icon } from '../components/Icon.jsx';
import { useTasks } from '../hooks/useTasks.js';
import { FilterBar } from '../components/tasks/FilterBar.jsx';
import { TaskRow } from '../components/tasks/TaskRow.jsx';
import { openTaskFormModal } from '../components/tasks/TaskFormModal.jsx';
import { openTaskDetailModal } from '../components/tasks/TaskDetailModal.jsx';

// React port of public/js/pages/tasks.js's mount(). Note (preserved
// exactly, not "improved"): the original never read ctx.params, so a link
// like #/tasks/12 always lands on the plain list, never auto-opening that
// task's detail — this port does the same, since inventing a deep-link
// feature the original never had would be scope creep, not parity.
export function Tasks({ ctx }) {
  const { api, toast, state } = ctx;
  const { tasks, loading, error, filters, toggleFilter, searchValue, setSearchValue, refetch } = useTasks(api);

  function openCreateForm() {
    openTaskFormModal({ api, toast, state, existing: null, onSaved: refetch });
  }

  function openEditForm(task) {
    openTaskFormModal({ api, toast, state, existing: task, onSaved: refetch });
  }

  function openDetail(id) {
    openTaskDetailModal({
      api,
      toast,
      taskId: id,
      onEdit: openEditForm,
      onChanged: refetch,
    });
  }

  // Same exact semantics as the original's [data-check] handler: only ever
  // flips 'completed' <-> 'todo', regardless of the task's current status
  // (an in_progress task's checkbox always sets it to 'completed', never
  // back to in_progress) — preserved, not redesigned into a 3-state toggle.
  async function handleToggleCheck(task) {
    const completed = task.status === 'completed';
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: completed ? 'todo' : 'completed' });
      refetch();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="page">
      {/* C3 Phase 1: relabeled from "Tasks" to "This Week" to match the
          shell's Today/This Week/Ledger switch this page is now reached
          through (see public/js/app.js's VIEW_SWITCH_ITEMS) — a mismatched
          nav label and page heading is exactly the "unclear primary
          hierarchy" failure the C3 Shell Final Validation Gate's Decision
          Rule rules out. The route, data, filters and every component
          below are unchanged — this phase relabels the shell, it doesn't
          redesign this module. */}
      <div className="page-header">
        <div>
          <h1 className="page-title">This Week</h1>
          <p className="page-subtitle">Everything on your plate, prioritized.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreateForm}>
            <Icon name="plus" cls="icon icon-sm" /> New task
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onToggle={toggleFilter} searchValue={searchValue} onSearchChange={setSearchValue} />

      {/* Visual Redesign Batch 2: Tasks is a continuum being scanned, not a
          set of separate comparable things, so it no longer sits inside a
          .card — see components.css's .list-region for the full rationale.
          The heading carries the live, filter-aware count (unlike a static
          "All tasks" label, this stays accurate whichever filter pill is
          active) and doubles as the region's own visual anchor across every
          state below, so layout doesn't jump between loading/error/empty/
          populated — a deliberate, small UX improvement, not new business
          logic: the underlying data/filtering is completely unchanged. */}
      <div className="list-region">
        <div className="list-region-heading">
          {loading ? 'Tasks' : error ? 'Tasks' : `${tasks.length} task${tasks.length === 1 ? '' : 's'}`}
        </div>
        {loading ? (
          <div className="loading-line">
            <span className="spinner" /> Loading tasks…
          </div>
        ) : error ? (
          // Visual Redesign Batch 2: brought in line with the standard
          // icon+heading+description error pattern already used everywhere
          // else in the app (Dashboard, BillSense, Goals, ...) — the
          // original plain-text treatment here was an inconsistency, not a
          // deliberate design choice (see the prior comment this replaces).
          // Also gains a retry action wired to the existing refetch() this
          // page's own data hook already exposes — no new data-fetching
          // logic, just a button that calls it.
          <div className="empty-state">
            <Icon name="alert" cls="icon-lg" />
            <h3>Couldn&apos;t load your tasks</h3>
            <p>{error.message}</p>
            <button className="btn" style={{ marginTop: 'var(--sp-2)' }} onClick={refetch}>
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <Icon name="tasks" cls="icon-lg" />
            <h3>No tasks here</h3>
            <p>Add your first task to start organizing your day.</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--sp-2)' }} onClick={openCreateForm}>
              Add a task
            </button>
          </div>
        ) : (
          <div className="row-list">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={openDetail} onToggleCheck={handleToggleCheck} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
