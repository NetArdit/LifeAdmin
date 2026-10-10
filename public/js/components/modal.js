import { icon } from './icons.js';

const root = document.getElementById('modal-root');
let closeHandler = null;
let pendingOnClose = null;
// Focus management (Phase 8.3): remember what had focus before the first
// modal opened, move focus into the dialog, keep Tab inside it, and give focus
// back on close. Previously focus stayed on the (now inert-looking) page
// behind the dialog.
let opener = null;
let currentOnKey = null;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function openModal({ title, bodyHtml, footerHtml = '', size = '', onMount, onClose }) {
  // This root only ever holds one modal's markup — opening a new one (e.g.
  // confirmDialog() called from a destructive-action button inside an
  // already-open modal) overwrites it outright, and the modal being
  // replaced is never coming back. Its own onClose (e.g. a React-rendered
  // modal body's root.unmount()) still needs to run exactly once, so it
  // fires here, before the markup is replaced, instead of being silently
  // dropped when `closeHandler` below gets reassigned to the new modal's.
  if (pendingOnClose) {
    const prev = pendingOnClose;
    pendingOnClose = null;
    prev();
  }

  if (!root.classList.contains('open')) opener = document.activeElement;
  if (currentOnKey) {
    document.removeEventListener('keydown', currentOnKey);
    currentOnKey = null;
  }

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

  pendingOnClose = onClose || null;
  closeHandler = () => {
    root.classList.remove('open');
    root.innerHTML = '';
    document.body.style.overflow = '';
    if (onClose) onClose();
    pendingOnClose = null;
    document.removeEventListener('keydown', onKey);
    if (currentOnKey === onKey) currentOnKey = null;
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
    opener = null;
  };

  root.querySelectorAll('[data-close]').forEach((elm) => elm.addEventListener('click', closeHandler));
  function onKey(e) {
    if (e.key === 'Escape') return closeHandler();
    if (e.key !== 'Tab') return;
    const panel = root.querySelector('.modal-panel');
    if (!panel) return;
    const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return e.preventDefault();
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (!panel.contains(active)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
  currentOnKey = onKey;
  document.addEventListener('keydown', onKey);

  if (onMount) onMount(root);

  // Initial focus: the first control in the body (form field), else the first
  // footer button (Cancel, for confirm dialogs), else the close button. Runs
  // after mount so React-rendered bodies exist; skipped if the body already
  // took focus itself (e.g. autoFocus).
  const panelAtOpen = root.querySelector('.modal-panel');
  setTimeout(() => {
    const panel = root.querySelector('.modal-panel');
    if (!panel || panel !== panelAtOpen || panel.contains(document.activeElement)) return;
    const target =
      panel.querySelector('.modal-body input:not([type=hidden]):not([disabled]),.modal-body select:not([disabled]),.modal-body textarea:not([disabled])') ||
      panel.querySelector('.modal-footer button:not([disabled])') ||
      panel.querySelector('.modal-body button:not([disabled])') ||
      panel.querySelector('[data-close]');
    if (target) target.focus();
  }, 0);
  return closeHandler;
}

export function closeModal() {
  if (closeHandler) closeHandler();
}
