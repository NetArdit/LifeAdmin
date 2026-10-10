import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function CreateFamilyFields() {
  return (
    <form id="family-form" className="stack">
      <div className="field">
        <label className="field-label">Circle name</label>
        <input className="input" name="name" placeholder="The Smiths" required />
      </div>
    </form>
  );
}

// Same hybrid pattern established for Tasks (Phase 2): the existing vanilla
// modal shell provides the chrome, React owns only the field markup, and
// the save button (plain HTML in footerHtml, wired imperatively) reads the
// form directly — byte-for-byte the same logic as the original
// openCreateFamily(), just with JSX instead of a template string for the body.
export function openCreateFamilyModal({ api, toast, onCreated }) {
  let root = null;
  openModal({
    title: 'Create a circle',
    bodyHtml: '<div id="family-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="create-family-save">Create</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#family-form-mount'));
      root.render(createElement(CreateFamilyFields));

      document.getElementById('create-family-save').addEventListener('click', async () => {
        const name = document.querySelector('#family-form [name=name]').value.trim();
        if (!name) return toast('Circle name is required.', 'error');
        try {
          const { family } = await api.post('/api/family', { name });
          closeModal();
          toast('Circle created', 'success');
          onCreated(family);
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
