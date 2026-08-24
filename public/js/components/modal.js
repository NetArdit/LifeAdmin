import { icon } from './icons.js';

const root = document.getElementById('modal-root');
let closeHandler = null;

export function openModal({ title, bodyHtml, footerHtml = '', size = '', onMount, onClose }) {
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel ${size === 'lg' ? 'modal-lg' : ''}" role="dialog" aria-modal="true" aria-label="${title || ''}">
      <div class="modal-header">
        <div class="modal-title">${title || ''}</div>
        <button class="icon-btn" data-close aria-label="Close">${icon('x')}</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;
  root.classList.add('open');
  document.body.style.overflow = 'hidden';

  closeHandler = () => {
    root.classList.remove('open');
    root.innerHTML = '';
    document.body.style.overflow = '';
    if (onClose) onClose();
    document.removeEventListener('keydown', onKey);
  };

  root.querySelectorAll('[data-close]').forEach((elm) => elm.addEventListener('click', closeHandler));
  function onKey(e) {
    if (e.key === 'Escape') closeHandler();
  }
  document.addEventListener('keydown', onKey);

  if (onMount) onMount(root);
  return closeHandler;
}

export function closeModal() {
  if (closeHandler) closeHandler();
}
