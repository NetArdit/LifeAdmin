import { useCallback, useEffect, useState } from 'react';

// Same data flow as the original public/js/pages/dashboard.js: one
// GET /api/dashboard, fetched once on mount. The one deliberate improvement
// over the original is `refetch()` — the old page called its own mount()
// again after a mutation (full re-render of the whole page from scratch,
// flagged as a real cost in LIFE_ADMIN_FULL_AUDIT.md §11/§14). Here the
// mutation handlers just call refetch(), which re-runs this same fetch and
// lets React re-render only what changed. Same end state shown to the user,
// fewer wasted renders — not a new feature, just what React gives you for
// free over hand-rolled innerHTML replacement.
export function useDashboardData(api) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/api/dashboard');
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
