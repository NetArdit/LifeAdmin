import { useCallback, useEffect, useState } from 'react';

// Fetches the user's family list and — matching the original vanilla
// mount()'s `state.families = families;` — keeps the shared ctx.state
// object in sync too, since other still-vanilla pages (and React Dashboard/
// Tasks) read state.families directly (onboarding checks, the task form's
// family selector, etc.). Losing this sync would be a real, silent
// regression for those other pages, not just a Family-page concern.
export function useFamilies(api, state) {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { families: rows } = await api.get('/api/family');
      setFamilies(rows);
      state.families = rows;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api, state]);

  useEffect(() => {
    load();
  }, [load]);

  return { families, loading, error, refetch: load };
}
