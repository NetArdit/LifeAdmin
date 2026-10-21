import { useState } from 'react';
import { openVerifyModal } from './VerifyModal.jsx';

// Direct port of renderSecurity() from the original public/js/pages/settings.js.
export function SecuritySection({ ctx }) {
  const { api, toast, state } = ctx;
  const [saving, setSaving] = useState(false);
  // state.user is the shared ctx.state object, mutated in place by
  // openVerifyModal on success — this tick forces a re-render so the
  // verified badge reflects it (the object mutation itself is invisible
  // to React, matching how the original re-ran mount() for the same reason).
  const [, forceUpdate] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const fd = Object.fromEntries(new FormData(e.target).entries());
    setSaving(true);
    try {
      await api.post('/api/settings/password', fd);
      toast('Password updated', 'success');
      e.target.reset();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function openVerify(channel) {
    if (channel === 'email') {
      try {
        const r = await api.post('/api/auth/verify-email/resend', {});
        toast(r.alreadyVerified ? 'Your email is already confirmed.' : r.message, r.delivered === false ? 'error' : 'success');
      } catch (err) {
        toast((err && err.message) || 'Could not send the link', 'error');
      }
      return;
    }
    openVerifyModal({ api, toast, state, channel, onVerified: () => forceUpdate((n) => n + 1) });
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="card-header">
          <span className="card-title">Change password</span>
        </div>
        <form className="stack" style={{ maxWidth: 340 }} onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Current password</label>
            <input className="input" type="password" name="currentPassword" required disabled={saving} />
          </div>
          <div className="field">
            <label className="field-label">New password</label>
            <input className="input" type="password" name="newPassword" required disabled={saving} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }} disabled={saving}>
            Update password
          </button>
        </form>
      </div>
      <div className="card card-pad">
        <div className="card-header">
          <span className="card-title">Verification</span>
        </div>
        <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
          Email: we send a confirmation link to your address; it proves the address is yours and unlocks inviting people by email. Phone: real SMS needs a paid provider, so the phone check stays a demo (the code is shown to you here) and proves nothing.
        </p>
        <div className="row" style={{ gap: 'var(--sp-4)' }}>
          <VerifyRow channel="phone" verified={state.user.phoneVerified} onVerify={openVerify} />
          <VerifyRow channel="email" verified={state.user.emailVerified} onVerify={openVerify} />
        </div>
      </div>
    </div>
  );
}

function VerifyRow({ channel, verified, onVerify }) {
  return (
    <div className="row" style={{ gap: 'var(--sp-2)' }}>
      <span className={`badge ${verified ? 'badge-success' : 'badge-neutral'}`}>
        {channel} {verified ? 'verified' : 'unverified'}
      </span>
      {!verified ? (
        <button className="btn btn-sm" onClick={() => onVerify(channel)}>
          {channel === 'email' ? 'Send confirmation link' : 'Verify now'}
        </button>
      ) : null}
    </div>
  );
}
