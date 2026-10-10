import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal } from '../../../../public/js/components/modal.js';

// Replaces the original's two-step confirmDialog() + native prompt() with
// one proper modal (the hybrid pattern used everywhere else) that asks for
// the password directly. This is a UI-only change: the backend contract
// (DELETE /api/settings/account with {password} in the body) is identical,
// including the family-owner block from Phase 2.5 — not touched, not
// reinterpreted. See PHASE_8_SETTINGS_MIGRATION_REPORT.md for why the
// native prompt() was judged a real, evidence-based UX/design defect
// (unstyled, inconsistent across browsers, outside the design system) for
// the single highest-stakes action in the app.
function DeleteAccountFields() {
  return (
    <form id="delete-account-form" className="stack">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        This permanently deletes your account and everything you own. This cannot be undone.
      </p>
      <div className="field">
        <label className="field-label">Enter your password to confirm</label>
        <input className="input" type="password" name="password" required autoFocus />
      </div>
    </form>
  );
}

export function openDeleteAccountModal({ api, toast }) {
  let root = null;
  openModal({
    title: 'Delete your account?',
    bodyHtml: '<div id="delete-account-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-danger" id="delete-account-confirm-btn">Delete everything</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#delete-account-mount'));
      root.render(createElement(DeleteAccountFields));

      document.getElementById('delete-account-confirm-btn').addEventListener('click', async () => {
        const input = document.querySelector('#delete-account-form [name=password]');
        const password = input.value;
        if (!password) return toast('Enter your password.', 'error');
        const btn = document.getElementById('delete-account-confirm-btn');
        btn.disabled = true; // defensive: prevent a duplicate delete request while this resolves
        try {
          await api.del('/api/settings/account', { password });
          // Matches the original exactly: a full reload, which naturally
          // re-runs app.js's boot() -> GET /api/auth/me, which now correctly
          // returns null (session was cleared server-side) and routes to
          // the auth screen — no separate client-side redirect needed.
          location.reload();
        } catch (err) {
          // Kept open on failure (unlike the original, which had no modal
          // left open to show this in) so the family-owner-block message
          // or a wrong-password message stays visible and the user can
          // immediately retry without reopening the flow from scratch.
          toast(err.message, 'error');
          btn.disabled = false;
          input.value = '';
          input.focus();
        }
      });
    },
    onClose: () => {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  });
}
