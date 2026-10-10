import { createElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

// Same content/flow as openVerifyFlow() from the original
// public/js/pages/settings.js (request a demo OTP, show it, confirm it),
// rebuilt on the standard hybrid modal pattern instead of the original's
// doubly ad-hoc direct DOM manipulation (it replaced both `.modal-body`
// AND manually removed/rebuilt `.modal-footer` outside openModal's own
// onMount lifecycle) — the same kind of replacement made for Assistant's
// weekly-review modal in Phase 7, for the same consistency reasoning.
function VerifyModalBody({ api, channel }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    api
      .post(`/api/auth/verify/${channel}/request`, {})
      .then((result) => setState({ message: result.message, demoCode: result.demoCode }))
      .catch((err) => setState({ error: err.message }));
  }, [api, channel]);

  if (state.loading) {
    return (
      <div className="loading-line">
        <span className="spinner" /> Requesting code…
      </div>
    );
  }
  if (state.error) return <p className="field-error">{state.error}</p>;

  return (
    <>
      <div style={{ background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        <p className="text-xs muted" style={{ marginBottom: 4 }}>{state.message}</p>
        <p className="text-sm">
          Demo code: <strong style={{ letterSpacing: '0.1em', fontSize: 'var(--fs-md)' }}>{state.demoCode}</strong>
        </p>
      </div>
      <form id="verify-form" className="stack">
        <div className="field">
          <label className="field-label">Enter the code</label>
          <input className="input" name="code" maxLength={6} required />
        </div>
      </form>
    </>
  );
}

export function openVerifyModal({ api, toast, state, channel, onVerified }) {
  let root = null;
  openModal({
    title: `Verify your ${channel}`,
    bodyHtml: '<div id="verify-modal-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="verify-confirm-btn">Confirm</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#verify-modal-mount'));
      root.render(createElement(VerifyModalBody, { api, channel }));

      document.getElementById('verify-confirm-btn').addEventListener('click', async () => {
        // Defensive: the code field only exists once the OTP request has
        // resolved (a few hundred ms at most) — a click before that is a
        // safe no-op rather than a crash on a missing element.
        const codeInput = document.querySelector('#verify-form [name=code]');
        if (!codeInput) return;
        const code = codeInput.value.trim();
        if (!code) return toast('Enter the code.', 'error');
        const btn = document.getElementById('verify-confirm-btn');
        btn.disabled = true; // defensive: prevent a duplicate confirm while this resolves
        try {
          const r = await api.post(`/api/auth/verify/${channel}/confirm`, { code });
          state.user = r.user;
          toast(`${channel} verified`, 'success');
          closeModal();
          onVerified();
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
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
