import { useCallback, useEffect, useState } from 'react';

// Same two-call shape as the original public/js/pages/ecolife.js's
// renderAll(): GET /api/ecolife/summary + GET /api/ecolife via Promise.all.
export function useEcoLogs(api) {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, logsRes] = await Promise.all([api.get('/api/ecolife/summary'), api.get('/api/ecolife')]);
      setSummary(summaryRes.summary);
      setTotalLogs(summaryRes.totalLogs);
      setLogs(logsRes.logs);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return { logs, summary, totalLogs, loading, error, refetch: load };
}
