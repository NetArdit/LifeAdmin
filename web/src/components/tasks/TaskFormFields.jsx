import { PRIORITY_LABEL } from '../../../../public/js/format.js';

const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const RECURRENCES = ['daily', 'weekdays', 'weekly', 'monthly'];

function localHm(isoStr) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Direct port of openTaskForm()'s bodyHtml template from the original
// public/js/pages/tasks.js. Deliberately UNCONTROLLED (defaultValue, not
// value+onChange) — the original read the form via `new FormData(form)` at
// submit time and had no per-keystroke validation or cross-field logic, so
// there's nothing controlled state would buy here; TaskFormModal.jsx reads
// this same form the same way. This also reproduces one exact, easy-to-miss
// existing quirk on purpose: when creating a new task, no <option> has
// `defaultValue`/`selected`, so the Priority select falls back to the
// browser default — the FIRST listed option, "Critical" — exactly like the
// original template (no option had `selected` for a new task either). Not
// "fixed" to default to Medium here, because that would be inventing
// different behavior, not preserving it.
// What the Family select shows when the form opens. A task that is PRIVATE must open on
// "Private (only me)" even if it still carries a family id (an assigned task, or one the
// owner made private) — otherwise saving an unrelated edit would silently share it
// again. Only a task that is actually family-visible preselects its family.
export function initialFamilySelection(existing) {
  return existing && existing.visibility === 'family' && existing.familyId != null ? String(existing.familyId) : '';
}

// `canChangeVisibility`: only a task's owner may change who can see it (the server
// enforces this regardless); for anyone else the Family select is not shown at all.
export function TaskFormFields({ existing, families, canChangeVisibility = true }) {
  return (
    <form id="task-form" className="stack">
      <div className="field">
        <label className="field-label">Title</label>
        <input className="input" name="title" required defaultValue={existing?.title || ''} />
      </div>
      <div className="field">
        <label className="field-label">Description</label>
        <textarea className="textarea" name="description" defaultValue={existing?.description || ''} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Priority</label>
          <select className="select" name="priority" defaultValue={existing?.priority}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Category</label>
          <input className="input" name="category" defaultValue={existing ? existing.category || '' : 'general'} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Due date</label>
          <input className="input" type="date" name="dueDate" defaultValue={existing?.dueDate || ''} />
        </div>
        <div className="field">
          <label className="field-label">Start time (optional)</label>
          <input
            className="input"
            type="time"
            name="startTimeOnly"
            defaultValue={existing?.startTime ? localHm(existing.startTime) : ''}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Duration (minutes)</label>
          <input
            className="input"
            type="number"
            min="5"
            step="5"
            name="durationMinutes"
            defaultValue={existing?.durationMinutes || ''}
          />
        </div>
        <div className="field">
          <label className="field-label">Recurrence</label>
          <select className="select" name="recurrence" defaultValue={existing?.recurrence || ''}>
            <option value="">None</option>
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      {families.length && canChangeVisibility ? (
        <div className="field">
          <label className="field-label">Family</label>
          <select className="select" name="familyId" defaultValue={initialFamilySelection(existing)}>
            <option value="">Private (only me)</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — visible to family
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="field">
        <label className="field-label">Notes</label>
        <textarea className="textarea" name="notes" defaultValue={existing?.notes || ''} />
      </div>
    </form>
  );
}
