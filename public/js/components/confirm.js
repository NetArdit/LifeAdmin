import { openModal, closeModal } from './modal.js';
import { escapeHtml } from './toast.js';

// `title`, `message` and `confirmLabel` are PLAIN TEXT and are HTML-escaped here.
// Callers interpolate user-controlled names (task titles, bill names, family
// names); before Phase 8.3 this rendered them as raw HTML, so a task titled
// `<img src=x onerror=...>` executed script when its delete dialog opened.
export function confirmDialog({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', danger = true }) {
  return new Promise((resolve) => {
    openModal({
      title: escapeHtml(title),
      bodyHtml: `<p class="text-sm" style="color:var(--text-secondary)">${escapeHtml(message)}</p>`,
      footerHtml: `
        <button class="btn" data-cancel>Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${escapeHtml(confirmLabel)}</button>
      `,
      onMount: (root) => {
        // resolve() BEFORE closeModal(): closeModal() always triggers this
        // modal's onClose (below), which also resolves(false) — a settled
        // Promise ignores every resolve() after the first, so calling
        // closeModal() first was silently locking every confirmDialog
        // result to false regardless of which button was clicked. Found via
        // browser-verified testing of Tasks' delete flow (Phase 2) — this
        // bug is pre-existing (unchanged since the original codebase) and
        // affects every confirmDialog call app-wide, not just Tasks.
        root.querySelector('[data-cancel]').addEventListener('click', () => {
          resolve(false);
          closeModal();
        });
        root.querySelector('[data-confirm]').addEventListener('click', () => {
          resolve(true);
          closeModal();
        });
      },
      onClose: () => resolve(false),
    });
  });
}
