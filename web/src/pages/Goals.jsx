import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { useGoals } from '../hooks/useGoals.js';
import { GoalRow } from '../components/goals/GoalRow.jsx';
import { openGoalFormModal } from '../components/goals/GoalFormModal.jsx';

// Visual Redesign Batch 7C: Goals' primary view is now a compact index
// (a .list-region, Warmth-accented like Family's) rather than a grid of
// equal-height cards — opening a goal expands it in place into a bounded
// detail panel (GoalRow.jsx). See GOALS_BATCH7_RESEARCH.md for the
// research/prototype work behind this shape.
//
// #/goals/:id addressing: the router (public/js/app.js's route()) already
// passes the hash's sub-path segments through as ctx.params — it was
// never actually discarding the goal id the way earlier research assumed;
// Goals.jsx simply never read it. Reading ctx.params[0] here is the whole
// fix. Opening/closing a goal afterwards updates the hash via
// history.pushState (not location.hash =), which does NOT fire
// hashchange/re-trigger the router's full unmount+remount — so toggling a
// goal open is a cheap, local React state change, exactly like every
// other disclosure in the app, while still keeping the URL bookmarkable
// and Back/Forward-correct: a real Back navigation changes the hash,
// which *does* fire hashchange and remounts the page fresh with the
// previous hash's params, closing (or reopening) the right goal.
export function Goals({ ctx }) {
  const { api, toast, state, params } = ctx;
  const { goals, loading, error, refetch } = useGoals(api);
  const [expandedId, setExpandedId] = useState(() => {
    const raw = params && params[0];
    const id = raw ? Number(raw) : null;
    return Number.isFinite(id) && id > 0 ? id : null;
  });

  // If the goal an #/goals/:id link pointed at gets deleted (or the id in
  // the URL never matched a real goal — a bad/stale link), fail gracefully
  // rather than leaving the page pointed at nothing: fall back to the
  // plain index instead of erroring.
  useEffect(() => {
    if (expandedId != null && !loading && !goals.some((g) => g.id === expandedId)) {
      setExpandedId(null);
      history.replaceState(null, '', '#/goals');
    }
  }, [goals, loading, expandedId]);

  function openAdd() {
    openGoalFormModal({ api, toast, onSaved: refetch });
  }

  function handleToggle(id) {
    setExpandedId((current) => {
      const next = current === id ? null : id;
      history.pushState(null, '', next ? `#/goals/${next}` : '#/goals');
      return next;
    });
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Loading goals…
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

  const active = goals.filter((g) => g.status === 'active');
  const done = goals.filter((g) => g.status !== 'active');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">Learning, fitness, financial and personal goals — broken into real steps.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon name="plus" cls="icon-sm" /> New goal
          </button>
        </div>
      </div>

      {active.length ? (
        <div className="list-region module-accent--warmth">
          <div className="list-region-heading">{active.length} active goal{active.length === 1 ? '' : 's'}</div>
          <div className="row-list">
            {active.map((g) => (
              <GoalRow key={g.id} goal={g} api={api} toast={toast} state={state} onChanged={refetch} expanded={expandedId === g.id} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Icon name="goal" cls="icon-lg" />
            <h3>No goals yet</h3>
            <p>Set a learning, fitness, financial or personal goal and break it into milestones.</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--sp-2)' }} onClick={openAdd}>
              Add a goal
            </button>
          </div>
        </div>
      )}

      {done.length ? (
        <div className="list-region module-accent--warmth" style={{ marginTop: 'var(--sp-6)' }}>
          <div className="list-region-heading">Completed / inactive</div>
          <div className="row-list">
            {done.map((g) => (
              <GoalRow key={g.id} goal={g} api={api} toast={toast} state={state} onChanged={refetch} expanded={expandedId === g.id} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
