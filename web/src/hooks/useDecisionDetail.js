import { useCallback, useEffect, useState } from 'react';

// Fetches the full decision detail payload — {decision, criteria, options,
// scoring} — matching GET /api/decisions/:id exactly. scoring.ranked is
// the deterministic, server-computed weighted score (never recomputed on
// the client); the frontend only ever displays it.
export function useDecisionDetail(api, id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(`/api/decisions/${id}`);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, error, refetch: load };
}
