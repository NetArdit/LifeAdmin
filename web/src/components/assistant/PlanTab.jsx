import { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { fmtDayLabel } from '../../../../public/js/format.js';

// React port of renderPlanTab()/renderPlanResult() from the original
// public/js/pages/assistant.js. Same duplicate-submission guard as
// ChatTab.jsx (disable while `sending`) for the same audited reason — see
// PHASE_7_ASSISTANT_MIGRATION_REPORT.md.
export function PlanTab({ ctx }) {
  const { api, toast } = ctx;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // null | {error} | {plan, preview}
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setResult(null);
    setApplied(false);
    try {
      const res = await api.post('/api/ai/plan', { text: trimmed });
      if (!res.ok) {
        setResult({ error: res.error });
        return;
      }
      setResult({ plan: res.plan, preview: res.preview });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSending(false);
    }
  }

  // Matches the original exactly: no try/catch around this specific call
  // (an existing, narrow gap — the same category already documented for
  // Tasks' postpone/delete handlers in Phase 2 — preserved, not silently
  // patched, since it doesn't block verifying any mandated parity check).
  //
  // Each placed block's "HH:MM" is turned into a real instant HERE, in the
  // browser, the same way TaskFormModal.jsx already does for a manually
  // created task (new Date(`${date}T${hh:mm}:00`).toISOString()) — the
  // browser's own local timezone is the only reliable representation of the
  // user's timezone anywhere in this app (see PHASE_PLAN_SCHEDULER_
  // RELIABILITY_REPORT.md). The server no longer guesses this from its own
  // timezone.
  async function handleApply() {
    setApplying(true);
    const preview = {};
    for (const [date, day] of Object.entries(result.preview)) {
      preview[date] = {
        ...day,
        placed: day.placed.map((b) => ({
          ...b,
          startISO: new Date(`${date}T${b.start}:00`).toISOString(),
          endISO: new Date(`${date}T${b.end}:00`).toISOString(),
        })),
      };
    }
    const res = await api.post('/api/ai/plan/apply', { preview });
    toast(`Added ${res.created} tasks to your schedule`, 'success');
    setApplied(true);
    setApplying(false);
  }

  return (
    <div className="card card-pad">
      <p className="text-sm muted" style={{ marginBottom: 'var(--sp-3)' }}>
        Describe your week in your own words. LifeAdmin protects sleep, meals and rest automatically — it won't schedule every free minute.
      </p>
      <form className="stack" onSubmit={handleSubmit}>
        <textarea
          className="textarea"
          aria-label="Describe your week"
          rows={4}
          placeholder="From Monday until Friday I want to study JavaScript. I'm free 8-10 in the morning, then I work until 18:00. After work I need an hour to rest and eat, but I still want to study another hour."
          value={text}
          disabled={sending}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={sending}>
          <Icon name="sparkle" cls="icon-sm" /> Build my plan
        </button>
      </form>
      <div style={{ marginTop: 'var(--sp-5)' }}>
        {sending ? (
          <div className="loading-line">
            <span className="spinner" /> Reasoning about your week — protecting sleep, meals and rest…
          </div>
        ) : result?.error ? (
          <p className="field-error">{result.error}</p>
        ) : result ? (
          <PlanResult plan={result.plan} preview={result.preview} applying={applying} applied={applied} onApply={handleApply} />
        ) : null}
      </div>
    </div>
  );
}

function PlanResult({ plan, preview, applying, applied, onApply }) {
  const days = Object.keys(preview).sort();

  if (!days.length) {
    return <p className="muted text-sm">No schedulable activities were found in that description. Try mentioning specific things you want time for.</p>;
  }

  return (
    <>
      <div className="section-title">Reasoning</div>
      <ul className="stack" style={{ gap: 4, marginBottom: 'var(--sp-5)' }}>
        {(plan.notes || []).length ? plan.notes.map((n, i) => <li className="text-sm muted" key={i}>{n}</li>) : <li className="muted text-sm">—</li>}
      </ul>
      <div className="section-title">Proposed schedule</div>
      {days.map((date) => (
        <div className="plan-preview-day" key={date}>
          <strong className="text-sm">{fmtDayLabel(date)}</strong>
          {preview[date].placed.length ? (
            preview[date].placed.map((b, i) => (
              <div className="plan-block" key={i}>
                <span className="plan-block-time">{b.start}–{b.end}</span>
                <span>{b.label}</span>
              </div>
            ))
          ) : (
            <p className="muted text-xs">Nothing placed.</p>
          )}
          {preview[date].warnings.map((w, i) => (
            <p className="text-xs" style={{ color: 'var(--warning-600)' }} key={i}>
              <Icon name="alert" cls="icon-sm" /> {w}
            </p>
          ))}
        </div>
      ))}
      <button className="btn btn-primary" style={{ marginTop: 'var(--sp-3)' }} disabled={applying || applied} onClick={onApply}>
        {applying ? <span className="spinner" /> : <Icon name="check" cls="icon-sm" />} {applying ? 'Adding…' : applied ? 'Added to your tasks' : 'Add these to my tasks'}
      </button>
    </>
  );
}
