import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function MilestoneFormFields() {
  return (
    <form id="ms-form" className="stack">
      <div className="field">
        <label className="field-label">Title</label>
        <input className="input" name="title" required />
      </div>
      <div className="field">
        <label className="field-label">Due date (optional)</label>
        <input className="input" type="date" name="dueDate" />
      </div>
    </form>
  );
}

export function openMilestoneFormModal({ api, toast, goalId, onSaved }) {
  let root = null;
  openModal({
    title: 'Add a milestone',
    bodyHtml: '<div id="ms-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="ms-save">Add</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#ms-form-mount'));
      root.render(createElement(MilestoneFormFields));

      document.getElementById('ms-save').addEventListener('click', async () => {
        const form = document.getElementById('ms-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.title.trim()) return toast('Title is required.', 'error');
        await api.post(`/api/goals/${goalId}/milestones`, { title: fd.title.trim(), dueDate: fd.dueDate || null });
        closeModal();
        onSaved();
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
