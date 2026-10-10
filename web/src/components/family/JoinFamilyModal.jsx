import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function JoinFamilyFields() {
  return (
    <form id="join-family-form" className="stack">
      <div className="field">
        <label className="field-label">Invite code</label>
        <input className="input" name="code" placeholder="e.g. K7M2QX9P4RTA" style={{ textTransform: 'uppercase' }} required />
      </div>
    </form>
  );
}

// Same pattern as CreateFamilyModal.jsx. This is the Phase 0 join-by-code
// fix's frontend half, ported to React with identical behavior — including
// accepting a lowercase-typed code (the backend uppercases it server-side).
export function openJoinFamilyModal({ api, toast, onJoined }) {
  let root = null;
  openModal({
    title: 'Join a family',
    bodyHtml: '<div id="join-family-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="join-family-save">Join</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#join-family-form-mount'));
      root.render(createElement(JoinFamilyFields));

      document.getElementById('join-family-save').addEventListener('click', async () => {
        const code = document.querySelector('#join-family-form [name=code]').value.trim();
        if (!code) return toast('Enter an invite code.', 'error');
        try {
          const { family } = await api.post('/api/family/join', { code });
          closeModal();
          toast(`Joined ${family.name}`, 'success');
          onJoined(family);
        } catch (err) {
          toast(err.message, 'error');
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
