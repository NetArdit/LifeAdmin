import { useCallback, useEffect, useState } from 'react';

// Same shape as useBills/useEcoLogs: one fetch, refetch() re-runs it.
export function useGoals(api) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { goals: rows } = await api.get('/api/goals');
      setGoals(rows);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return { goals, loading, error, refetch: load };
}
