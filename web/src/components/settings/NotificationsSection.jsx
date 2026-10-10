import { useState } from 'react';

const ITEMS = [
  ['task', 'Task reminders & deadlines'],
  ['comment', 'Comments on shared items'],
  ['chat', 'Circle chat messages'],
  ['bill', 'Bill due dates'],
];

// Visual Redesign Batch 11: these toggles are now genuinely enforced —
// src/lib/notify.js checks notif_prefs before creating a notification row
// (previously persisted and displayed here but never actually read by
// anything, a verified real gap).
//
// Batch 11B: re-verified against current source (repository-wide search
// for notifyUser()/notifyFamily() call sites) that no code path anywhere
// creates a notification of type 'decision' or 'ai' — those two toggles
// were removed from this list rather than kept as a correctly-wired
// preference for a notification category that doesn't exist yet. Per the
// stricter truthfulness bar for this closure pass, a preference with zero
// currently-observable effect is not shown, even when its underlying
// enforcement mechanism is itself honest. Nothing server-side needed to
// change: notifPrefs is a free-form JSON object, and these keys simply
// stop being sent by this UI going forward — a stored users.notif_prefs
// blob that still happens to contain a leftover 'decision'/'ai' key from
// before this change is inert (nothing reads those keys), not misleading,
// since no UI displays or lets anyone toggle them anymore. If a real
// 'decision' or 'ai' notification producer is ever added, its preference
// row belongs back here at that point, not before.
//
// The previous "Enable browser notifications" button requested real OS
// notification permission via Notification.requestPermission() but no
// code anywhere in the app ever calls `new Notification(...)` — granting
// permission had no further effect. Removed rather than left as a control
// that does something (a real permission grant) in service of an outcome
// (desktop notification delivery) that doesn't exist — the app's real,
// working notification delivery is the in-app bell (polled, unrelated to
// this permission).
export function NotificationsSection({ ctx }) {
  const { api, toast, state } = ctx;
  const [prefs, setPrefs] = useState(() => state.user.notifPrefs || {});

  async function handleToggle(key, checked) {
    const notifPrefs = { ...prefs, [key]: checked };
    setPrefs(notifPrefs);
    await api.patch('/api/settings/preferences', { notifPrefs });
    state.user.notifPrefs = notifPrefs;
    toast('Preferences saved', 'success');
  }

  return (
    <div className="card card-pad">
      <div className="card-header">
        <span className="card-title">Notification preferences</span>
      </div>
      <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
        Controls which in-app notifications (the bell icon) you receive. Turning one off stops that notification from being created for you.
      </p>
      <div className="stack">
        {ITEMS.map(([key, label]) => (
          <label className="checkbox-row" key={key}>
            <input
              type="checkbox"
              checked={prefs[key] !== false}
              onChange={(e) => handleToggle(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
