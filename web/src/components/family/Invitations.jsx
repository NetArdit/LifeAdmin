import { useCallback, useEffect, useState } from 'react';

// Invitations by email. The server decides everything (the invitation must be for the signed-in account's
// VERIFIED address); these two cards only show what the server returned and send the person's answer.

/** Invitations waiting for me. Shows nothing when there are none. */
export function InvitationsForMe({ api, toast, onChanged }) {
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    api
      .get('/api/family/invitations/mine')
      .then((r) => setList(r.invitations || []))
      .catch(() => setList([]));
  }, [api]);
  useEffect(load, [load]);

  async function answer(inv, accept) {
    if (busy) return;
    setBusy(inv.id);
    try {
      await api.post(`/api/family/invitations/${inv.id}/${accept ? 'accept' : 'decline'}`, {});
      toast(accept ? `You joined ${inv.familyName}` : 'Invitation declined', 'success');
      load();
      if (accept) onChanged();
    } catch (err) {
      toast((err && err.message) || 'Could not answer the invitation', 'error');
      load();
    } finally {
      setBusy(null);
    }
  }

  if (!list.length) return null;
  return (
    <div className="card card-pad" style={{ marginBottom: 'var(--sp-4)' }} role="region" aria-label="Invitations">
      <div className="card-header">
        <span className="card-title">You are invited</span>
      </div>
      <div className="stack">
        {list.map((inv) => (
          <div key={inv.id} className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <span className="text-sm">
              Join the circle <strong>{inv.familyName}</strong>
            </span>
            <span className="row" style={{ gap: 'var(--sp-2)' }}>
              <button className="btn btn-sm btn-primary" disabled={busy === inv.id} onClick={() => answer(inv, true)}>
                Accept
              </button>
              <button className="btn btn-sm" disabled={busy === inv.id} onClick={() => answer(inv, false)}>
                Decline
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Invitations I sent from this circle (owner/admin): who is still pending, with a way to take one back. */
export function SentInvitations({ api, toast, familyId, refreshKey }) {
  const [list, setList] = useState([]);
  const load = useCallback(() => {
    api
      .get(`/api/family/${familyId}/invitations`)
      .then((r) => setList((r.invitations || []).filter((i) => i.status === 'pending')))
      .catch(() => setList([]));
  }, [api, familyId]);
  useEffect(load, [load, refreshKey]);

  async function revoke(inv) {
    try {
      await api.del(`/api/family/${familyId}/invitations/${inv.id}`);
      toast('Invitation withdrawn', 'success');
    } catch (err) {
      toast((err && err.message) || 'Could not withdraw the invitation', 'error');
    }
    load();
  }

  if (!list.length) return null;
  return (
    <div style={{ marginTop: 'var(--sp-4)' }}>
      <p className="text-xs muted" style={{ marginBottom: 'var(--sp-2)' }}>
        Waiting for an answer (valid for 7 days)
      </p>
      <div className="stack">
        {list.map((inv) => (
          <div key={inv.id} className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
            <span className="text-sm" style={{ wordBreak: 'break-all' }}>{inv.email}</span>
            <button className="btn btn-sm" onClick={() => revoke(inv)}>
              Withdraw
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
