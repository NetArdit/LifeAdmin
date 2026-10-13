// The reminder of one item (a task, a bill, a goal): follow my usual choice, none, or a time before it is due.
// One select, not a panel: the usual choice is set once in Settings, and most items never need another.

const OPTIONS = [
  ['default', 'As usual (my setting)'],
  ['none', 'No reminder'],
  ['0', 'When it is due'],
  ['60', '1 hour before'],
  ['300', '5 hours before'],
  ['720', '12 hours before'],
  ['1440', '1 day before'],
  ['4320', '3 days before'],
  ['7200', '5 days before'],
  ['10080', '1 week before'],
];

/** What the select holds for an item as the server describes it. */
function valueOf(reminder) {
  if (!reminder || reminder.mode === 'default') return 'default';
  if (reminder.mode === 'none') return 'none';
  return String(reminder.minutesBefore);
}

/** What the server is sent for a value of the select. */
export function reminderFromForm(value) {
  if (!value || value === 'default') return { mode: 'default' };
  if (value === 'none') return { mode: 'none' };
  return { mode: 'custom', minutesBefore: Number(value) };
}

export function ReminderSelect({ existing, hint }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor="item-reminder">Remind me</label>
      <select id="item-reminder" className="select" name="reminder" defaultValue={valueOf(existing)}>
        {OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {hint ? <p className="text-sm muted" style={{ marginTop: 'var(--sp-1)' }}>{hint}</p> : null}
    </div>
  );
}
