import { openModal, closeModal } from './modal.js';

export function confirmDialog({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', danger = true }) {
  return new Promise((resolve) => {
    openModal({
      title,
      bodyHtml: `<p class="text-sm" style="color:var(--text-secondary)">${message}</p>`,
      footerHtml: `
        <button class="btn" data-cancel>Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${confirmLabel}</button>
      `,
      onMount: (root) => {
        root.querySelector('[data-cancel]').addEventListener('click', () => {
          closeModal();
          resolve(false);
        });
        root.querySelector('[data-confirm]').addEventListener('click', () => {
          closeModal();
          resolve(true);
        });
      },
      onClose: () => resolve(false),
    });
  });
}
