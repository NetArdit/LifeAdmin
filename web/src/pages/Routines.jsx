import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { confirmDialog } from '../../../public/js/components/confirm.js';

// Routines: things done again and again. A reminder says it is time; it never says it was done. "Done" is a
// tick the person makes (and can take back); a day without one reads "Missed", not "Done".
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const KINDS = [
  ['exercise', 'Exercise'],
  ['meditation', 'Meditation'],
  ['medication', 'Medication (you name it)'],
  ['other', 'Other'],
];
const STATUS = {
  upcoming: ['Upcoming', 'badge-neutral'],
  due: ['Due now', 'badge-warning'],
  missed: ['Missed', 'badge-danger'],
  done: ['Done (you ticked it)', 'badge-success'],
};
const EMPTY = { title: '', details: '', kind: 'exercise', time: '07:30', days: [] };

function whenLabel(r) {
  const days = r.days.length === 0 || r.days.length === 7 ? 'Every day' : DAY_ORDER.filter((d) => r.days.includes(d)).map((d) => DAY_NAMES[d]).join(', ');
  return `${days} at ${r.time}`;
}

function nextLabel(r) {
  if (!r.enabled) return 'Paused';
  if (!r.nextAt) return '';
  try {
    return `Next: ${new Intl.DateTimeFormat(undefined, { timeZone: r.timezone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(r.nextAt))}`;
  } catch {
    return '';
  }
}

function RoutineForm({ initial, saving, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleDay = (d) => set({ days: form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d] });

  async function submit(e) {
    e.preventDefault();
    const problems = {};
    if (!form.title.trim()) problems.title = 'Give it a name.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) problems.time = 'Pick a time.';
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const fields = await onSave({ ...form, days: form.days.length === 7 ? [] : form.days });
    if (fields) setErrors(fields);
  }

  return (
    <form className="card card-pad stack" onSubmit={submit} style={{ marginBottom: 'var(--sp-4)' }}>
      <div className="card-header">
        <span className="card-title">{initial.id ? 'Edit routine' : 'New routine'}</span>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="routine-title">Name</label>
        <input id="routine-title" className="input" value={form.title} maxLength={80} placeholder="e.g. Morning run" onChange={(e) => set({ title: e.target.value })} disabled={saving} />
        {errors.title ? <span className="field-error">{errors.title}</span> : null}
      </div>
      <div className="grid-2">
        <div className="field">
          <label className="field-label" htmlFor="routine-kind">Kind</label>
          <select id="routine-kind" className="select" value={form.kind} onChange={(e) => set({ kind: e.target.value })} disabled={saving}>
            {KINDS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="routine-time">Time</label>
          <input id="routine-time" className="input" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} disabled={saving} />
          {errors.time ? <span className="field-error">{errors.time}</span> : null}
        </div>
      </div>
      <div className="field">
        <span className="field-label" id="routine-days-label">Days (none selected: every day)</span>
        <div className="row" role="group" aria-labelledby="routine-days-label" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          {DAY_ORDER.map((d) => (
            <button key={d} type="button" className={`pill ${form.days.includes(d) ? 'active' : ''}`} aria-pressed={form.days.includes(d)} onClick={() => toggleDay(d)} disabled={saving}>
              {DAY_NAMES[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="routine-details">Details (optional)</label>
        <textarea id="routine-details" className="textarea" value={form.details} maxLength={500} onChange={(e) => set({ details: e.target.value })} disabled={saving} />
      </div>
      {form.kind === 'medication' ? (
        <p className="text-xs muted" role="note">
          You type what you take and when. A reminder is not medical advice, LifeAdmin never suggests a medicine or a dose, and a reminder does not show that you took it: you tick it yourself. Ask your doctor or pharmacist about your treatment.
        </p>
      ) : null}
      <div className="row" style={{ gap: 'var(--sp-2)' }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button className="btn" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

export function Routines({ ctx }) {
  const { api, toast } = ctx;
  const [routines, setRoutines] = useState(null);
  const [today, setToday] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | EMPTY | a routine
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const [list, t] = await Promise.all([api.get('/api/routines'), api.get('/api/routines/today')]);
      setRoutines(list.routines);
      setToday(t.items);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);

  async function save(values) {
    if (saving) return null; // a double tap must not make two
    setSaving(true);
    try {
      const body = { title: values.title, details: values.details, kind: values.kind, time: values.time, days: values.days };
      if (values.id) await api.patch(`/api/routines/${values.id}`, body);
      else await api.post('/api/routines', body);
      toast('Routine saved', 'success');
      setEditing(null);
      await load();
      return null;
    } catch (err) {
      toast((err && err.message) || 'Could not save the routine', 'error');
      return (err && err.fields) || {};
    } finally {
      setSaving(false);
    }
  }

  async function act(id, fn, okMessage) {
    if (busy) return;
    setBusy(id);
    try {
      await fn();
      if (okMessage) toast(okMessage, 'success');
      await load();
    } catch (err) {
      toast((err && err.message) || 'That did not work', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function remove(r) {
    const ok = await confirmDialog({ title: 'Delete this routine?', message: 'Its reminders stop. Nothing else changes.', confirmLabel: 'Delete' });
    if (ok) act(r.id, () => api.del(`/api/routines/${r.id}`), 'Routine deleted');
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load this page</h3>
          <p>{error.message}</p>
          <button className="btn" onClick={load}>Try again</button>
        </div>
      </div>
    );
  }
  if (!routines) {
    return (
      <div className="page">
        <div className="loading-line"><span className="spinner" /> Loading…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Routines</h1>
          <p className="page-subtitle">Things you do again and again, with a reminder at the time you choose.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY })} disabled={!!editing}>
            <Icon name="plus" cls="icon-sm" /> New routine
          </button>
        </div>
      </div>

      {editing ? <RoutineForm initial={editing} saving={saving} onSave={save} onCancel={() => setEditing(null)} /> : null}

      <div className="card card-pad" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="card-header">
          <span className="card-title">Today</span>
        </div>
        <p className="text-xs muted" style={{ marginBottom: 'var(--sp-3)' }}>
          A reminder only tells you it is time. It does not show that you did it: tick it yourself. What you did not tick shows as missed.
        </p>
        {today.length === 0 ? (
          <p className="text-sm muted">Nothing is planned for today.</p>
        ) : (
          <div className="stack">
            {today.map((i) => {
              const [label, cls] = STATUS[i.status] || STATUS.upcoming;
              const key = `${i.routineId}-${i.date}`;
              return (
                <div key={key} className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="text-sm" style={{ fontWeight: 650 }}>{i.day === 'yesterday' ? 'Yesterday ' : ''}{i.time} · {i.title}</div>
                    <span className={`badge ${cls}`}>{label}</span>
                    {i.note ? <p className="text-xs muted" style={{ marginTop: 4 }}>{i.note}</p> : null}
                  </div>
                  {i.status === 'done' ? (
                    <button className="btn btn-sm" disabled={busy === key} onClick={() => act(key, () => api.del(`/api/routines/${i.routineId}/checkin/${i.date}`))}>
                      Undo
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-primary" disabled={busy === key} onClick={() => act(key, () => api.post(`/api/routines/${i.routineId}/checkin`, { date: i.date }))}>
                      I did it
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card card-pad">
        <div className="card-header">
          <span className="card-title">Your routines</span>
        </div>
        {routines.length === 0 ? (
          <div className="empty-state">
            <Icon name="clock" cls="icon-lg" />
            <h3>No routines yet</h3>
            <p>Add one, for example a morning walk, ten minutes of meditation, or a medicine you take.</p>
          </div>
        ) : (
          <div className="stack">
            {routines.map((r) => (
              <div key={r.id} className="card card-pad" style={{ opacity: r.enabled ? 1 : 0.7 }}>
                <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="text-sm" style={{ fontWeight: 650 }}>{r.title}</div>
                    <div className="text-xs muted">{whenLabel(r)} · {r.timezone}</div>
                    <div className="text-xs muted">{nextLabel(r)}</div>
                    {r.details ? <p className="text-sm" style={{ marginTop: 4 }}>{r.details}</p> : null}
                    {r.note ? <p className="text-xs muted" style={{ marginTop: 4 }}>{r.note}</p> : null}
                  </div>
                  <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" disabled={busy === r.id} onClick={() => act(r.id, () => api.patch(`/api/routines/${r.id}`, { enabled: !r.enabled }), r.enabled ? 'Paused' : 'Resumed')}>
                      {r.enabled ? 'Pause' : 'Resume'}
                    </button>
                    <button className="btn btn-sm" onClick={() => setEditing({ id: r.id, title: r.title, details: r.details, kind: r.kind, time: r.time, days: r.days })}>
                      Edit
                    </button>
                    <button className="btn btn-sm" disabled={busy === r.id} onClick={() => remove(r)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs muted" style={{ marginTop: 'var(--sp-3)' }}>
          Reminders appear in the bell inside the app. To get them on your phone too, turn on device notifications in <a href="#/settings">Settings</a>; delivery to a phone that is off or has no connection is not guaranteed.
        </p>
      </div>
    </div>
  );
}
