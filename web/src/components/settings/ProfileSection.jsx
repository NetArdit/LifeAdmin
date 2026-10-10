import { useState } from 'react';

// Direct port of renderProfile() from the original public/js/pages/settings.js.
// Uncontrolled form (defaultValue + FormData at submit), same as every
// other form in the app since Tasks (Phase 2). `saving` is a defensive
// disable-while-pending control (not a fix for a reproduced bug — see
// PHASE_8_SETTINGS_MIGRATION_REPORT.md), consistent with the same pattern
// added to Assistant's forms in Phase 7.
export function ProfileSection({ ctx }) {
  const { api, toast, state } = ctx;
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const fd = Object.fromEntries(new FormData(e.target).entries());
    setSaving(true);
    try {
      const { user } = await api.patch('/api/settings/profile', fd);
      state.user = user;
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Profile</span>
      </div>
      <form className="stack" style={{ maxWidth: 360 }} onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="field">
            <label className="field-label">First name</label>
            <input className="input" name="firstName" defaultValue={state.user.firstName} disabled={saving} />
          </div>
          <div className="field">
            <label className="field-label">Last name</label>
            <input className="input" name="lastName" defaultValue={state.user.lastName} disabled={saving} />
          </div>
        </div>
        <div className="field">
          <label className="field-label">Email</label>
          <input className="input" value={state.user.email} disabled readOnly />
          <span className="field-hint">{state.user.emailVerified ? 'Verified' : 'Not verified'}</span>
        </div>
        <div className="field">
          <label className="field-label">Phone</label>
          <input className="input" value={state.user.phone} disabled readOnly />
          <span className="field-hint">{state.user.phoneVerified ? 'Verified' : 'Not verified'}</span>
        </div>
        <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }} disabled={saving}>
          Save changes
        </button>
      </form>
    </div>
  );
}
