import { createElement } from 'react';
import { reminderFromForm } from '../ReminderSelect.jsx';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';
import { TaskFormFields, initialFamilySelection } from './TaskFormFields.jsx';

// Opens the task create/edit form using the EXISTING vanilla modal shell
// (public/js/components/modal.js) — same backdrop, header, close button,
// Escape handling, and `.modal-panel { max-height:88vh; overflow-y:auto }`
// scroll behavior every other modal in the app already has, reused as-is
// rather than rebuilt. React owns only the form FIELDS (bodyHtml is an
// empty mount point); the footer buttons stay plain HTML wired the same
// imperative way the original did, because the save handler below reads
// the form via `new FormData(...)` — the same uncontrolled-form approach
// the original used — so there's no React state to share across a second
// root, and no need for one.
export function openTaskFormModal({ api, toast, state, existing, onSaved }) {
  const families = state.families || [];
  // Only the owner of an existing task may change who can see it.
  const isOwnerOrNew = !existing || existing.ownerId === state.user.id;
  let root = null;

  openModal({
    title: existing ? 'Edit task' : 'New task',
    bodyHtml: '<div id="task-form-mount"></div>',
    footerHtml: `
      <button class="btn" data-close>Cancel</button>
      <button class="btn btn-primary" id="save-task-btn">${existing ? 'Save changes' : 'Create task'}</button>
    `,
    size: 'lg',
    onMount: (modalRoot) => {
      const mountEl = modalRoot.querySelector('#task-form-mount');
      root = createRoot(mountEl);
      root.render(createElement(TaskFormFields, { existing, families, canChangeVisibility: isOwnerOrNew }));

      // Byte-for-byte the same payload logic as the original openTaskForm()'s
      // save handler (public/js/pages/tasks.js) — only the field markup moved
      // to JSX, not this logic.
      document.getElementById('save-task-btn').addEventListener('click', async () => {
        const form = document.getElementById('task-form');
        const fd = Object.fromEntries(new FormData(form).entries());
        if (!fd.title.trim()) {
          toast('Title is required.', 'error');
          return;
        }
        const payload = {
          title: fd.title.trim(),
          description: fd.description || null,
          priority: fd.priority,
          category: fd.category || 'general',
          dueDate: fd.dueDate || null,
          durationMinutes: fd.durationMinutes ? Number(fd.durationMinutes) : null,
          recurrence: fd.recurrence || null,
          notes: fd.notes || null,
          reminder: reminderFromForm(fd.reminder),
        };
        if (fd.dueDate && fd.startTimeOnly) {
          payload.startTime = new Date(`${fd.dueDate}T${fd.startTimeOnly}:00`).toISOString();
        }
        // Visibility is sent only when the person actually changed the Family choice.
        // A new task always states it. An EDIT that leaves the choice alone sends nothing,
        // so it can never change who can see the task (a private task stays private); and
        // only the owner may send it at all — everyone else edits content only.
        if (!existing) {
          if (fd.familyId) {
            payload.familyId = Number(fd.familyId);
            payload.visibility = 'family';
          } else {
            payload.visibility = 'private';
          }
        } else if (isOwnerOrNew && (fd.familyId || '') !== initialFamilySelection(existing)) {
          if (fd.familyId) {
            payload.familyId = Number(fd.familyId);
            payload.visibility = 'family';
          } else {
            payload.visibility = 'private';
          }
        }

        try {
          if (existing) {
            await api.patch(`/api/tasks/${existing.id}`, payload);
            toast('Task updated', 'success');
          } else {
            await api.post('/api/tasks', payload);
            toast('Task created', 'success');
          }
          closeModal();
          onSaved();
        } catch (err) {
          // Matches the original exactly: on failure the modal stays open
          // (no closeModal() here) so the user can fix the field and retry.
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
