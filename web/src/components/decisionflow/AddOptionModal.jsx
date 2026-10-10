import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function AddOptionFields() {
  return (
    <form id="opt-form">
      <div className="field">
        <label className="field-label">Option name</label>
        <input className="input" name="name" required />
      </div>
    </form>
  );
}

export function openAddOptionModal({ api, toast, decisionId, onSaved }) {
  let root = null;
  openModal({
    title: 'Add an option',
    bodyHtml: '<div id="opt-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="opt-save">Add</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#opt-form-mount'));
      root.render(createElement(AddOptionFields));

      document.getElementById('opt-save').addEventListener('click', async () => {
        const name = document.querySelector('#opt-form [name=name]').value.trim();
        if (!name) return toast('Name is required.', 'error');
        await api.post(`/api/decisions/${decisionId}/options`, { name });
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
