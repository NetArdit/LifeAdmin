import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function AddMemberFields() {
  return (
    <form id="member-form" className="stack">
      <div className="field">
        <label className="field-label">Invite by email</label>
        <input className="input" name="email" type="email" inputMode="email" autoComplete="off" placeholder="name@example.com" />
        <span className="field-hint">They get an invitation to accept with their confirmed email address.</span>
      </div>
      <p className="text-xs muted">Or add someone by phone number instead (leave the email empty):</p>
      <div className="field">
        <label className="field-label">Phone number</label>
        <input className="input" name="phone" placeholder="+383 44 123 456" />
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
    title: 'Invite a member',
    bodyHtml: '<div id="member-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="add-member-save">Send</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#member-form-mount'));
      root.render(createElement(AddMemberFields));

      document.getElementById('add-member-save').addEventListener('click', async () => {
        const form = document.getElementById('member-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        const email = (fd.email || '').trim();
        if (!email && !fd.phone.trim()) return toast('Enter an email address or a phone number.', 'error');
        const btn = document.getElementById('add-member-save');
        btn.disabled = true;
        try {
          if (email) {
            const r = await api.post(`/api/family/${familyId}/invitations`, { email });
            toast(r.message || 'Invitation sent', 'success');
          } else {
            await api.post(`/api/family/${familyId}/members`, { phone: fd.phone, displayName: fd.displayName });
            toast('Member added', 'success');
          }
          closeModal();
          onAdded();
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
