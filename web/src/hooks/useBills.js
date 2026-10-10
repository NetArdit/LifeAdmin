import { useCallback, useEffect, useState } from 'react';

// Same two-call shape as the original public/js/pages/billsense.js's
// renderAll(): GET /api/bills and GET /api/bills/stats fetched together via
// Promise.all, once on mount. refetch() re-runs both, same as Dashboard's
// hook — the original re-ran its whole renderAll() after every mutation;
// this gets the same end state with fewer wasted re-renders.
export function useBills(api) {
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsRes, statsRes] = await Promise.all([api.get('/api/bills'), api.get('/api/bills/stats')]);
      setBills(billsRes.bills);
      setStats(statsRes.stats);
      setOverdue(statsRes.overdue);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return { bills, stats, overdue, loading, error, refetch: load };
}
