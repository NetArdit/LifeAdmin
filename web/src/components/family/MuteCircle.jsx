import { useEffect, useState } from 'react';

// "Quiet for a while": this person's devices stop being told about this circle for the hours chosen. The
// bell keeps filling, nobody else is affected, and it ends by itself.
export function MuteCircle({ api, toast, familyId }) {
  const [until, setUntil] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/family/${familyId}/mute`)
      .then((r) => alive && setUntil(r.mutedUntil))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [api, familyId]);

  async function change(work) {
    setBusy(true);
    try {
      const r = await work();
      setUntil(r.mutedUntil);
    } catch (err) {
      toast((err && err.message) || 'Could not change that', 'error');
    } finally {
      setBusy(false);
    }
  }

  const row = { display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' };
  if (until) {
    const time = new Date(until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="text-sm muted" style={row} role="status">
        <span>Notifications from this circle are off on your devices until {time}.</span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => change(() => api.del(`/api/family/${familyId}/mute`))}>
          Turn back on
        </button>
      </div>
    );
  }
  return (
    <div className="text-sm muted" style={row}>
      <span>Too many notifications right now?</span>
      {[1, 8, 24].map((hours) => (
        <button key={hours} type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => change(() => api.post(`/api/family/${familyId}/mute`, { hours }))}>
          Quiet for {hours} h
        </button>
      ))}
    </div>
  );
}
