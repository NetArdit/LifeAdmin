import { useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import { BucketCard } from '../components/BucketCard.jsx';
import { GoalsCard } from '../components/GoalsCard.jsx';
import { ActivityCard } from '../components/ActivityCard.jsx';
import { ConflictCard } from '../components/ConflictCard.jsx';
import { OnboardingCard } from '../components/OnboardingCard.jsx';

function greetingForHour(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// React port of public/js/pages/dashboard.js's mount(). `ctx` is the exact
// same {api, toast, state} object app.js already passes to every page
// module — reused as-is, not re-implemented, so this inherits the app's
// real session/auth state and the same api.js/toast.js singletons every
// other (still-vanilla) page uses.
export function Dashboard({ ctx }) {
  const { api, toast, state } = ctx;
  const { data, loading, error, refetch } = useDashboardData(api);

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  async function handleComplete(taskId) {
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: 'completed' });
      toast('Task completed', 'success');
      refetch();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleSeedDemo() {
    await api.post('/api/demo/seed');
    toast('Demo data added', 'success');
    const { families } = await api.get('/api/family');
    state.families = families;
    refetch();
  }

  // Loading state — same message as the original's initial innerHTML.
  if (loading) {
    return (
      <div className="page">
        <div className="loading-line">
          <span className="spinner" /> Preparing your dashboard…
        </div>
      </div>
    );
  }

  // Error state — same markup/classes as app.js's router-level errorHtml(),
  // reproduced here because a fetch failure inside a mounted React
  // component happens *after* mount() already returned, so the router's
  // own try/catch around mount() can no longer catch it (see Phase 1
  // report §5/§9 for why this had to move inside the component).
  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load this page</h3>
          <p>{error.message || 'Something went wrong loading this page.'}</p>
        </div>
      </div>
    );
  }

  const showOnboarding = data.counts.tasks === 0 && data.counts.bills === 0 && !state.families.length;

  // Visual Redesign Batch 6: severity-ordered dominance, not a hardcoded
  // "Needs attention is always dominant" rule (a gap the redesign spec's
  // own challenge section caught in an earlier phase and committed to
  // fixing here) — the dominant bucket is whichever of the three is
  // non-empty and highest in the existing severity order. If all three
  // are empty there is nothing to triage at all, so the whole group
  // collapses to one calm "caught up" message instead of three empty
  // compact headers.
  // Overdue comes first. The server has always returned these items and the
  // banner above has always counted them, but no list showed them, so the
  // most urgent things were the only ones missing from this page.
  const buckets = [
    ...(data.overdue && data.overdue.length
      ? [{ key: 'overdue', title: 'Overdue', items: data.overdue, color: 'var(--danger-500)', emptyText: '' }]
      : []),
    { key: 'needsAttention', title: 'Needs attention', items: data.needsAttention, color: 'var(--danger-500)', emptyText: 'Nothing needs urgent attention — nice work.' },
    { key: 'comingSoon', title: 'Coming soon', items: data.comingSoon, color: 'var(--warning-500)', emptyText: 'Nothing coming up in the next few days.' },
    { key: 'canWait', title: 'Can wait', items: data.canWait, color: 'var(--priority-low)', emptyText: 'Nothing low-priority queued up.' },
  ];
  const dominantIndex = buckets.findIndex((b) => b.items.length > 0);
  const allBucketsEmpty = dominantIndex === -1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {state.user.firstName}</h1>
          <p className="page-subtitle">Here&apos;s what matters in your life right now.</p>
        </div>
      </div>

      {showOnboarding ? <OnboardingCard onSeedDemo={handleSeedDemo} /> : null}

      <div className="today-banner">
        <div>
          <h2>
            {data.today.count === 0
              ? 'Nothing urgent today'
              : `${data.today.count} thing${data.today.count === 1 ? '' : 's'} need${data.today.count === 1 ? 's' : ''} your attention`}
          </h2>
          <p>{todayLabel}</p>
        </div>
        <div className="today-count">{data.today.count}</div>
      </div>

      <div className="dash-grid">
        <div className="stack">
          {allBucketsEmpty ? (
            <div className="card card-pad">
              <div className="empty-state" style={{ padding: 'var(--sp-6) var(--sp-4)' }}>
                <Icon name="check" cls="icon-lg" />
                <h3>You&apos;re all caught up</h3>
                <p>Nothing needs your attention right now.</p>
              </div>
            </div>
          ) : (
            buckets.map((b, i) => (
              <BucketCard
                key={b.key}
                title={b.title}
                items={b.items}
                color={b.color}
                emptyText={b.emptyText}
                onComplete={handleComplete}
                dominant={i === dominantIndex}
              />
            ))
          )}
        </div>
        <div className="stack">
          <GoalsCard goals={data.goalsInProgress} />
          <ActivityCard activity={data.familyActivity} />
          {data.conflicts > 0 ? <ConflictCard count={data.conflicts} /> : null}
        </div>
      </div>
    </div>
  );
}
