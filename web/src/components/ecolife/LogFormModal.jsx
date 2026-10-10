import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';

const CATEGORIES = ['transport', 'energy', 'food', 'shopping', 'waste', 'water'];
const ECO_CATEGORY_LABEL = { transport: 'Transport', energy: 'Energy', food: 'Food', shopping: 'Shopping', waste: 'Waste', water: 'Water' };

function LogFormFields() {
  return (
    <form id="eco-form" className="stack">
      <div className="field">
        <label className="field-label">Category</label>
        <select className="select" name="category">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {ECO_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field-label">What did you do?</label>
        <input className="input" name="action" placeholder="e.g. Took the bus instead of driving" required />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Quantity (optional)</label>
          <input className="input" type="number" step="0.1" name="quantity" />
        </div>
        <div className="field">
          <label className="field-label">Unit</label>
          <input className="input" name="unit" placeholder="km, kg, kWh…" />
        </div>
      </div>
    </form>
  );
}

// Same hybrid pattern as BillSense's BillFormModal — vanilla shell, React
// body, plain-HTML footer wired imperatively.
export function openLogFormModal({ api, toast, onSaved }) {
  let root = null;
  openModal({
    title: 'Log an eco action',
    bodyHtml: '<div id="eco-form-mount"></div>',
    footerHtml: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="eco-save">Log it</button>`,
    onMount: (modalRoot) => {
      root = createRoot(modalRoot.querySelector('#eco-form-mount'));
      root.render(createElement(LogFormFields));

      document.getElementById('eco-save').addEventListener('click', async () => {
        const form = document.getElementById('eco-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.action.trim()) return toast('Describe the action.', 'error');
        const payload = { category: fd.category, action: fd.action.trim(), quantity: fd.quantity ? Number(fd.quantity) : null, unit: fd.unit || null };
        try {
          await api.post('/api/ecolife', payload);
          toast('Logged', 'success');
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
