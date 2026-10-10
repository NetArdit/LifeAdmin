import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

const CATEGORIES = ['learning', 'fitness', 'financial', 'career', 'habit', 'personal'];

function GoalFormFields() {
  return (
    <form id="goal-form" className="stack">
      <div className="field">
        <label className="field-label">Title</label>
        <input className="input" name="title" required />
      </div>
      <div className="field">
        <label className="field-label">Description (optional)</label>
        <textarea className="textarea" name="description" />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Category</label>
          <select className="select" name="category">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Target date</label>
          <input className="input" type="date" name="targetDate" />
        </div>
      </div>
    </form>
  );
}

// Same hybrid pattern established for BillSense/Tasks/Family's modals.
export function openGoalFormModal({ api, toast, onSaved }) {
  let root = null;
  openModal({
    title: 'New goal',
    bodyHtml: '<div id="goal-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="goal-save">Create goal</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#goal-form-mount'));
      root.render(createElement(GoalFormFields));

      document.getElementById('goal-save').addEventListener('click', async () => {
        const form = document.getElementById('goal-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.title.trim()) return toast('Title is required.', 'error');
        try {
          await api.post('/api/goals', { title: fd.title.trim(), description: fd.description || null, category: fd.category, targetDate: fd.targetDate || null });
          toast('Goal created', 'success');
          closeModal();
          onSaved();
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
