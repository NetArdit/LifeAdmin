import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function AddMemberFields() {
  return (
    <form id="member-form" className="stack">
      <p className="text-sm muted">Members are identified by phone number (names can be identical).</p>
      <div className="field">
        <label className="field-label">Phone number</label>
        <input className="input" name="phone" placeholder="+383 44 123 456" required />
      </div>
      <div className="field">
        <label className="field-label">Display name (optional)</label>
        <input className="input" name="displayName" placeholder="e.g. Mom" />
      </div>
    </form>
  );
}

export function openAddMemberModal({ api, toast, familyId, onAdded }) {
  let root = null;
  openModal({
    title: 'Add a family member',
    bodyHtml: '<div id="member-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="add-member-save">Add member</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#member-form-mount'));
      root.render(createElement(AddMemberFields));

      document.getElementById('add-member-save').addEventListener('click', async () => {
        const form = document.getElementById('member-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.phone.trim()) return toast('Phone number is required.', 'error');
        try {
          await api.post(`/api/family/${familyId}/members`, fd);
          toast('Member added', 'success');
          closeModal();
          onAdded();
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
