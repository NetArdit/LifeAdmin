import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';
import { confirmDialog } from '../../../../public/js/components/confirm.js';
import { BillFormFields } from './BillFormFields.jsx';

// Same hybrid pattern as Tasks/Family's modals: the vanilla modal shell
// provides chrome, React owns only the field markup, and the footer buttons
// stay plain HTML wired imperatively, reading the form via `new
// FormData(...)` — byte-for-byte the same save/delete logic as the original
// openBillForm() in public/js/pages/billsense.js, just with JSX for the body.
//
// The Delete button's confirmDialog() call opens a second, nested modal on
// the same shared #modal-root — this is exactly the case
// PHASE_4_BILLSENSE_MIGRATION_REPORT.md's "Bugs Found" section documents:
// public/js/components/modal.js previously dropped the outer modal's
// onClose (root.unmount() below) whenever a nested modal opened, silently
// leaking this React root on every bill deletion. Fixed at the shared
// modal.js level this phase (not worked around here) since the bug is in
// the shared mechanism, not specific to BillSense.
export function openBillFormModal({ api, toast, existing, onSaved }) {
  let root = null;

  const footerHtml = `
    ${existing ? `<button class="btn btn-danger" id="delete-bill-btn" style="margin-right:auto">Delete</button>` : ''}
    <button class="btn" data-close>Cancel</button>
    <button class="btn btn-primary" id="save-bill-btn">${existing ? 'Save changes' : 'Add bill'}</button>
  `;

  openModal({
    title: existing ? 'Edit bill' : 'Add a bill',
    bodyHtml: '<div id="bill-form-mount"></div>',
    footerHtml,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#bill-form-mount'));
      root.render(createElement(BillFormFields, { existing }));

      document.getElementById('save-bill-btn').addEventListener('click', async () => {
        const form = document.getElementById('bill-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        const payload = {
          name: fd.name.trim(),
          amount: Number(fd.amount),
          currency: fd.currency || 'EUR',
          category: fd.category,
          recurrence: fd.recurrence,
          dueDate: fd.dueDate,
          notes: fd.notes || null,
        };
        try {
          if (existing) await api.patch(`/api/bills/${existing.id}`, payload);
          else await api.post('/api/bills', payload);
          toast(existing ? 'Bill updated' : 'Bill added', 'success');
          closeModal();
          onSaved();
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      const delBtn = document.getElementById('delete-bill-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async () => {
          const ok = await confirmDialog({ title: 'Delete bill?', message: `"${existing.name}" will be permanently deleted.`, confirmLabel: 'Delete' });
          if (!ok) return;
          await api.del(`/api/bills/${existing.id}`);
          toast('Bill deleted', 'success');
          onSaved();
        });
      }
    },
    onClose: () => {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  });
}
