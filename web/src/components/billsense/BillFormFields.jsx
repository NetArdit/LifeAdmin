const CATEGORIES = ['electricity', 'water', 'internet', 'phone', 'rent', 'subscription', 'insurance', 'loan', 'other'];
const RECURRENCES = ['none', 'weekly', 'monthly', 'yearly'];

// Direct port of openBillForm()'s bodyHtml from the original
// public/js/pages/billsense.js. Uncontrolled (defaultValue), read via
// `new FormData(form)` at save time — same as Tasks' TaskFormFields and for
// the same reason: the original had no per-keystroke validation, so there's
// nothing controlled state would add. No family selector — the original
// form never had one; see PHASE_4_BILLSENSE_MIGRATION_REPORT.md §"Family
// authorization model" for why that's current, intentional product
// behavior and not a gap this migration should fill in.
export function BillFormFields({ existing }) {
  return (
    <form id="bill-form" className="stack">
      <div className="field">
        <label className="field-label">Name</label>
        <input className="input" name="name" required defaultValue={existing ? existing.name : ''} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Amount</label>
          <input className="input" type="number" step="0.01" min="0.01" name="amount" required defaultValue={existing ? existing.amount : ''} />
        </div>
        <div className="field">
          <label className="field-label">Currency</label>
          <input className="input" name="currency" defaultValue={existing ? existing.currency : 'EUR'} />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Category</label>
          <select className="select" name="category" defaultValue={existing?.category}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Recurrence</label>
          <select className="select" name="recurrence" defaultValue={existing?.recurrence}>
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="field-label">Due date</label>
        <input className="input" type="date" name="dueDate" required defaultValue={existing?.dueDate || ''} />
      </div>
      <div className="field">
        <label className="field-label">Notes</label>
        <textarea className="textarea" name="notes" defaultValue={existing ? existing.notes || '' : ''} />
      </div>
    </form>
  );
}
