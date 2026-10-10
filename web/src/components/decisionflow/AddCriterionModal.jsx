import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function AddCriterionFields() {
  return (
    <form id="crit-form" className="stack">
      <div className="field">
        <label className="field-label">Criterion name</label>
        <input className="input" name="name" placeholder="e.g. Cost, Risk, Convenience" required />
      </div>
      <div className="field">
        <label className="field-label">Weight (1-5)</label>
        <input className="input" type="number" name="weight" min="1" max="5" defaultValue="3" />
      </div>
    </form>
  );
}

export function openAddCriterionModal({ api, toast, decisionId, onSaved }) {
  let root = null;
  openModal({
    title: 'Add a criterion',
    bodyHtml: '<div id="crit-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="crit-save">Add</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#crit-form-mount'));
      root.render(createElement(AddCriterionFields));

      document.getElementById('crit-save').addEventListener('click', async () => {
        const form = document.getElementById('crit-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.name.trim()) return toast('Name is required.', 'error');
        await api.post(`/api/decisions/${decisionId}/criteria`, { name: fd.name.trim(), weight: Number(fd.weight) });
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
