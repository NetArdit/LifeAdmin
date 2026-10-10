import { createElement, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { openModal, closeModal } from '../../../../public/js/components/modal.js';
import { confirmDialog } from '../../../../public/js/components/confirm.js';
import { fmtDate, fmtDuration, PRIORITY_LABEL, STATUS_LABEL } from '../../../../public/js/format.js';
import { Icon } from '../Icon.jsx';

const PRIORITY_BADGE = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
const STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];

function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function CommentRow({ comment }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--sp-2)' }}>
      <div className="avatar avatar-sm">{initialsOf(comment.authorName)}</div>
      <div>
        <div className="text-sm">
          <strong>{comment.authorName}</strong> <span className="muted text-xs">{fmtDate(comment.createdAt)}</span>
        </div>
        <div className="text-sm">{comment.body}</div>
      </div>
    </div>
  );
}

// Direct port of openTaskDetail() from the original public/js/pages/tasks.js.
// Preserves two exact, easy-to-miss existing behaviors rather than "fixing"
// them, per the migration's parity mandate:
//  1. If the initial fetch fails, the original toasts the error and closes
//     the modal immediately (no in-modal error state) — reproduced exactly.
//  2. The Postpone and Delete handlers have NO try/catch in the original
//     (only the status-select and comment-form handlers do) — an existing,
//     narrow gap, not introduced here, not silently patched either. See
//     PHASE_2_TASKS_MIGRATION_REPORT.md for why it's carried forward as-is.
function TaskDetailContent({ taskId, api, toast, onEdit, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentValue, setCommentValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/tasks/${taskId}`);
      setTask(data.task);
      setComments(data.comments);
      setLoading(false);
    } catch (err) {
      toast(err.message, 'error');
      closeModal();
    }
  }, [api, taskId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // The vanilla version sets `.modal-title` imperatively once the task
  // loads (this modal opens with the generic title "Task"); reused here
  // for the same reason — the title lives in the vanilla modal shell, not
  // in this React root, and there was never a need to duplicate that shell.
  useEffect(() => {
    if (task) {
      const titleEl = document.querySelector('#modal-root .modal-title');
      if (titleEl) titleEl.textContent = task.title;
    }
  }, [task]);

  async function handleStatusChange(e) {
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: e.target.value });
      toast('Status updated', 'success');
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handlePostpone() {
    await api.post(`/api/tasks/${task.id}/postpone`, { days: 1 });
    toast('Postponed by 1 day', 'success');
    closeModal();
    onChanged();
  }

  async function handleDelete() {
    const ok = await confirmDialog({
      title: 'Delete task?',
      message: `"${task.title}" will be permanently deleted.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await api.del(`/api/tasks/${task.id}`);
    toast('Task deleted', 'success');
    closeModal();
    onChanged();
  }

  async function handleAddComment(e) {
    e.preventDefault();
    const body = commentValue.trim();
    if (!body) return;
    try {
      await api.post(`/api/tasks/${task.id}/comments`, { body });
      setCommentValue('');
      // The original re-opened the whole modal (re-fetch task + comments)
      // to show the new comment; refetching just this modal's data gets the
      // same end result without tearing the modal down and rebuilding it —
      // the same kind of improvement Phase 1 made to Dashboard's refetch.
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (loading) {
    return (
      <div className="loading-line">
        <span className="spinner" /> Loading…
      </div>
    );
  }
  if (!task) return null; // load() already toasted + closed the modal on failure

  return (
    <>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-4)' }}>
        <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
        <select className="select" style={{ width: 'auto', height: 32 }} value={task.status} onChange={handleStatusChange}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {task.dueDate ? (
          <span className="badge badge-neutral">
            <Icon name="calendar" cls="icon-sm" /> {fmtDate(task.dueDate)}
          </span>
        ) : null}
        {task.durationMinutes ? <span className="badge badge-neutral">{fmtDuration(task.durationMinutes)}</span> : null}
      </div>
      {task.description ? <p className="text-sm" style={{ marginBottom: 'var(--sp-4)' }}>{task.description}</p> : null}
      {task.notes ? (
        <p className="text-sm muted" style={{ marginBottom: 'var(--sp-4)' }}>
          <strong>Notes:</strong> {task.notes}
        </p>
      ) : null}
      <div className="row page-actions" style={{ marginBottom: 'var(--sp-5)' }}>
        <button className="btn btn-sm" onClick={handlePostpone}>
          <Icon name="clock" cls="icon-sm" /> Postpone 1 day
        </button>
        <button className="btn btn-sm" onClick={() => onEdit(task)}>
          <Icon name="edit" cls="icon-sm" /> Edit
        </button>
        <button className="btn btn-sm btn-danger" onClick={handleDelete}>
          <Icon name="trash" cls="icon-sm" /> Delete
        </button>
      </div>
      <hr className="divider" />
      <div className="section-title">Comments</div>
      <div className="stack" style={{ marginBottom: 'var(--sp-4)' }}>
        {comments.length ? comments.map((c) => <CommentRow key={c.id} comment={c} />) : <p className="muted text-sm">No comments yet.</p>}
      </div>
      <form className="row" onSubmit={handleAddComment}>
        <input
          className="input"
          placeholder="Write a comment…"
          style={{ flex: 1 }}
          value={commentValue}
          onChange={(e) => setCommentValue(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          <Icon name="send" cls="icon-sm" />
        </button>
      </form>
    </>
  );
}

export function openTaskDetailModal({ api, toast, taskId, onEdit, onChanged }) {
  let root = null;

  openModal({
    title: 'Task',
    bodyHtml: '<div id="task-detail-mount"></div>',
    size: 'lg',
    onMount: (modalRoot) => {
      const mountEl = modalRoot.querySelector('#task-detail-mount');
      root = createRoot(mountEl);
      root.render(
        createElement(TaskDetailContent, {
          taskId,
          api,
          toast,
          onEdit: (task) => {
            closeModal();
            onEdit(task);
          },
          onChanged,
        })
      );
    },
    onClose: () => {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  });
}
