import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

function NewDecisionFields() {
  return (
    <form id="decision-form">
      <div className="field">
        <label className="field-label">What are you trying to decide?</label>
        <textarea className="textarea" name="question" placeholder="Should I buy this laptop? Should I move apartments? Should I take this job?" required />
      </div>
    </form>
  );
}

// Same hybrid pattern established across every other page's modals.
// Navigates to the new decision's detail view on success, same as the
// original (`location.hash = '#/decisionflow/${decision.id}'`).
export function openNewDecisionModal({ api, toast }) {
  let root = null;
  openModal({
    title: 'Start a new decision',
    bodyHtml: '<div id="decision-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="save-decision-btn">Start</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#decision-form-mount'));
      root.render(createElement(NewDecisionFields));

      document.getElementById('save-decision-btn').addEventListener('click', async () => {
        const question = document.querySelector('#decision-form [name=question]').value.trim();
        if (!question) return toast('Describe the decision first.', 'error');
        try {
          const { decision } = await api.post('/api/decisions', { question });
          closeModal();
          location.hash = `#/decisionflow/${decision.id}`;
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
