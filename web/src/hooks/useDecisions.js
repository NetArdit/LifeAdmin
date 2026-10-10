import { useCallback, useEffect, useState } from 'react';

export function useDecisions(api) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { decisions: rows } = await api.get('/api/decisions');
      setDecisions(rows);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return { decisions, loading, error, refetch: load };
}
