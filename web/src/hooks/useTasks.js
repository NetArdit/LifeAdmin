import { useCallback, useEffect, useState } from 'react';

// Direct port of the vanilla Tasks page's filter/list state (public/js/pages/tasks.js:
// `let filters = {view,status,q}` + loadTasks()). Preserves the exact toggle
// semantics: clicking an already-active pill clears it, and clearing the
// active 'view' pill resets to 'all' — not a redesign, the same two-line
// rule the original had, just as a pure function instead of mutating a
// module-level object.
function toggleFilter(prev, group, value) {
  const next = { ...prev };
  next[group] = prev[group] === value ? '' : value;
  if (group === 'view' && next.view !== value) next.view = 'all';
  return next;
}

export function useTasks(api) {
  const [filters, setFilters] = useState({ view: 'all', status: '', q: '' });
  const [searchValue, setSearchValue] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (activeFilters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (activeFilters.view && activeFilters.view !== 'all') params.set('view', activeFilters.view);
        if (activeFilters.status) params.set('status', activeFilters.status);
        if (activeFilters.q) params.set('q', activeFilters.q);
        const { tasks: rows } = await api.get(`/api/tasks?${params.toString()}`);
        setTasks(rows);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  // Same 250ms debounce as the original's debounce(fn, 250) on the search input.
  useEffect(() => {
    const trimmed = searchValue.trim();
    const t = setTimeout(() => {
      setFilters((f) => (f.q === trimmed ? f : { ...f, q: trimmed }));
    }, 250);
    return () => clearTimeout(t);
  }, [searchValue]);

  return {
    tasks,
    loading,
    error,
    filters,
    toggleFilter: (group, value) => setFilters((prev) => toggleFilter(prev, group, value)),
    searchValue,
    setSearchValue,
    refetch: () => load(filters),
  };
}
