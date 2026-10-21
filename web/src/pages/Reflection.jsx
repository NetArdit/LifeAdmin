import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { confirmDialog } from '../../../public/js/components/confirm.js';

// Reflection: talk a personal topic through with the AI and, if it helps, turn it into one small thing to save.
// The AI never saves anything: a suggestion is shown here as an editable preview, and only "Save" (after your
// own look at every field) creates it. The server checks it all again.
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const CATEGORIES = ['learning', 'fitness', 'financial', 'career', 'habit', 'personal'];
const ROUTINE_KINDS = ['exercise', 'meditation', 'medication', 'other'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const KIND_LABEL = { task: 'Task', goal: 'Goal', routine: 'Routine' };

function Proposal({ proposal, onAccept, onReject, onRevise, busy }) {
  const [fields, setFields] = useState(proposal.fields);
  const [errors, setErrors] = useState({});
  const [revising, setRevising] = useState(false);
  const [instruction, setInstruction] = useState('');
  const set = (patch) => setFields((f) => ({ ...f, ...patch }));
  const open = proposal.status === 'pending';
  const dateKey = proposal.kind === 'task' ? 'dueDate' : proposal.kind === 'goal' ? 'targetDate' : null;
  const needs = (k) => proposal.needsInput.includes(k) && !fields[k];

  async function save() {
    const e = await onAccept(proposal, fields);
    setErrors(e || {});
  }

  return (
    <div className="card card-pad stack" style={{ marginTop: 'var(--sp-2)' }} role="group" aria-label={`Suggested ${KIND_LABEL[proposal.kind]}`}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
        <strong className="text-sm">Suggested {KIND_LABEL[proposal.kind].toLowerCase()} — not saved yet</strong>
        {!open ? <span className="badge badge-neutral">{proposal.status === 'accepted' ? 'Saved' : proposal.status === 'rejected' ? 'Dismissed' : 'Replaced'}</span> : null}
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`p-title-${proposal.id}`}>{proposal.kind === 'routine' ? 'Name' : 'Title'}</label>
        <input id={`p-title-${proposal.id}`} className="input" value={fields.title} maxLength={proposal.kind === 'routine' ? 80 : 120} disabled={!open} onChange={(e) => set({ title: e.target.value })} />
        {errors.title ? <span className="field-error">{errors.title}</span> : null}
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`p-desc-${proposal.id}`}>{proposal.kind === 'routine' ? 'Details' : 'Description'} (optional)</label>
        <textarea id={`p-desc-${proposal.id}`} className="textarea" value={(proposal.kind === 'routine' ? fields.details : fields.description) || ''} maxLength={500} disabled={!open} onChange={(e) => set(proposal.kind === 'routine' ? { details: e.target.value } : { description: e.target.value })} />
      </div>
      {proposal.kind === 'task' ? (
        <div className="field">
          <label className="field-label" htmlFor={`p-pri-${proposal.id}`}>Priority</label>
          <select id={`p-pri-${proposal.id}`} className="select" value={fields.priority} disabled={!open} onChange={(e) => set({ priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      ) : null}
      {proposal.kind === 'goal' ? (
        <div className="field">
          <label className="field-label" htmlFor={`p-cat-${proposal.id}`}>Category</label>
          <select id={`p-cat-${proposal.id}`} className="select" value={fields.category} disabled={!open} onChange={(e) => set({ category: e.target.value })}>
            {CATEGORIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      ) : null}
      {dateKey ? (
        <div className="field">
          <label className="field-label" htmlFor={`p-date-${proposal.id}`}>{proposal.kind === 'task' ? 'Due date' : 'Target date'} (optional)</label>
          <input id={`p-date-${proposal.id}`} className="input" type="date" value={fields[dateKey] || ''} disabled={!open} onChange={(e) => set({ [dateKey]: e.target.value || null })} />
          {needs(dateKey) ? <span className="field-hint">Needs your input: the AI never picks a date for you. Leave it empty if you do not want one.</span> : null}
          {errors[dateKey] ? <span className="field-error">{errors[dateKey]}</span> : null}
        </div>
      ) : null}
      {proposal.kind === 'routine' ? (
        <>
          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor={`p-kind-${proposal.id}`}>Kind</label>
              <select id={`p-kind-${proposal.id}`} className="select" value={fields.kind} disabled={!open} onChange={(e) => set({ kind: e.target.value })}>
                {ROUTINE_KINDS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor={`p-time-${proposal.id}`}>Time</label>
              <input id={`p-time-${proposal.id}`} className="input" type="time" value={fields.time} disabled={!open} onChange={(e) => set({ time: e.target.value })} />
              {proposal.needsInput.includes('time') ? <span className="field-hint">Needs your input: you did not say when. Check this time.</span> : null}
            </div>
          </div>
          <div className="row" role="group" aria-label="Days" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            {DAY_ORDER.map((d) => (
              <button key={d} type="button" className={`pill ${fields.days.includes(d) ? 'active' : ''}`} aria-pressed={fields.days.includes(d)} disabled={!open} onClick={() => set({ days: fields.days.includes(d) ? fields.days.filter((x) => x !== d) : [...fields.days, d] })}>
                {DAY_NAMES[d]}
              </button>
            ))}
          </div>
          <p className="text-xs muted">No day selected means every day.</p>
        </>
      ) : null}
      {open ? (
        <>
          <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>Save this</button>
            <button className="btn btn-sm" disabled={busy} onClick={() => setRevising((v) => !v)}>Revise</button>
            <button className="btn btn-sm" disabled={busy} onClick={() => onReject(proposal)}>Not now</button>
          </div>
          {revising ? (
            <form
              className="row"
              style={{ gap: 'var(--sp-2)' }}
              onSubmit={(e) => {
                e.preventDefault();
                if (instruction.trim()) {
                  onRevise(proposal, instruction.trim());
                  setInstruction('');
                  setRevising(false);
                }
              }}
            >
              <input className="input" aria-label="How should it change?" placeholder="How should it change?" value={instruction} maxLength={500} onChange={(e) => setInstruction(e.target.value)} />
              <button className="btn btn-sm" type="submit" disabled={busy}>Ask</button>
            </form>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Insights({ api, toast, status, onChanged }) {
  const [asking, setAsking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const d = status.disclosure;

  async function setEnabled(enabled) {
    if (busy) return;
    setBusy(true);
    try {
      await api.patch('/api/reflection/insights', { enabled, acknowledged: enabled ? confirmed : undefined });
      setAsking(false);
      setConfirmed(false);
      if (!enabled) setResult(null);
      onChanged();
    } catch (err) {
      toast((err && err.message) || 'Could not change that', 'error');
    } finally {
      setBusy(false);
    }
  }
  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      setResult(await api.post('/api/reflection/insights/run', {}));
    } catch (err) {
      toast((err && err.message) || 'Could not make the summary', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 'var(--sp-4)' }}>
      <div className="card-header">
        <span className="card-title">Insights from my data</span>
        <span className={`badge ${status.insightsEnabled ? 'badge-success' : 'badge-neutral'}`}>{status.insightsEnabled ? 'On' : 'Off'}</span>
      </div>
      {!status.insightsEnabled && !asking ? (
        <>
          <p className="text-sm muted">Off by default. If you turn it on, Reflection can use a small summary of your own tasks, goals and bills to give you suggestions.</p>
          <button className="btn btn-sm" style={{ marginTop: 'var(--sp-2)' }} onClick={() => setAsking(true)}>Read what is used and turn on…</button>
        </>
      ) : null}
      {!status.insightsEnabled && asking ? (
        <div className="stack">
          <p className="text-sm"><strong>What is used:</strong></p>
          <ul className="text-sm" style={{ paddingLeft: 'var(--sp-5)' }}>
            {d.uses.map((u) => <li key={u}>{u}</li>)}
          </ul>
          <p className="text-sm"><strong>Not used:</strong> {d.doesNotUse.join(' ')}</p>
          <p className="text-sm">{d.provider}</p>
          <label className="checkbox-row">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I understand which data is used and that an external AI provider processes it.
          </label>
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <button className="btn btn-primary btn-sm" disabled={!confirmed || busy} onClick={() => setEnabled(true)}>Turn on</button>
            <button className="btn btn-sm" onClick={() => setAsking(false)}>Cancel</button>
          </div>
        </div>
      ) : null}
      {status.insightsEnabled ? (
        <div className="stack">
          <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={run}>{busy ? 'Working…' : 'Show my summary'}</button>
            <button className="btn btn-sm" disabled={busy} onClick={() => setEnabled(false)}>Turn off</button>
          </div>
          {result ? (
            <div className="stack" aria-live="polite">
              <div>
                <p className="text-xs muted">From your data</p>
                <ul className="text-sm" style={{ paddingLeft: 'var(--sp-5)' }}>{result.facts.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
              {result.calculations.length ? (
                <div>
                  <p className="text-xs muted">Calculated by the app</p>
                  <ul className="text-sm" style={{ paddingLeft: 'var(--sp-5)' }}>{result.calculations.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
              ) : null}
              <div>
                <p className="text-xs muted">Suggestions (ideas from the AI, not facts)</p>
                {result.suggestions.length ? <ul className="text-sm" style={{ paddingLeft: 'var(--sp-5)' }}>{result.suggestions.map((f) => <li key={f}>{f}</li>)}</ul> : <p className="text-sm muted">{result.suggestionsNote}</p>}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Reflection({ ctx }) {
  const { api, toast } = ctx;
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await api.get('/api/reflection/status'));
      setConversations((await api.get('/api/reflection/conversations')).conversations);
    } catch (err) {
      setError(err);
    }
  }, [api]);
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);
  useEffect(() => {
    if (endRef.current && endRef.current.scrollIntoView) endRef.current.scrollIntoView({ block: 'nearest' });
  }, [messages, proposals]);

  async function openConversation(id) {
    setConvId(id);
    if (!id) {
      setMessages([]);
      setProposals([]);
      return;
    }
    try {
      const r = await api.get(`/api/reflection/conversations/${id}`);
      setMessages(r.messages);
      setProposals(r.proposals);
    } catch (err) {
      toast((err && err.message) || 'Could not open it', 'error');
    }
  }

  async function send(message, reviseProposalId) {
    if (sending || !message.trim()) return;
    setSending(true);
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: 'user', content: message }]);
    setText('');
    try {
      const r = await api.post('/api/reflection/message', { conversationId: convId || undefined, message, reviseProposalId });
      if (r.ok === false) {
        toast(r.error || 'The AI could not answer. Please try again.', 'error');
        if (r.conversationId) await openConversation(r.conversationId);
        return;
      }
      await openConversation(r.conversationId);
      if (r.note) toast(r.note, 'info');
      setConversations((await api.get('/api/reflection/conversations')).conversations);
    } catch (err) {
      toast((err && err.message) || 'Could not send that', 'error');
      if (convId) await openConversation(convId);
    } finally {
      setSending(false);
    }
  }

  async function accept(proposal, fields) {
    if (busy) return null;
    setBusy(true);
    try {
      const r = await api.post(`/api/reflection/proposals/${proposal.id}/accept`, { fields });
      toast(r.alreadyAccepted ? 'It was already saved.' : `${KIND_LABEL[proposal.kind]} saved`, 'success');
      await openConversation(convId);
      return null;
    } catch (err) {
      toast((err && err.message) || 'Could not save it', 'error');
      const out = {};
      for (const [k, v] of Object.entries((err && err.fields) || {})) out[k] = v;
      return out;
    } finally {
      setBusy(false);
    }
  }
  async function reject(proposal) {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/api/reflection/proposals/${proposal.id}/reject`, {});
      await openConversation(convId);
    } catch (err) {
      toast((err && err.message) || 'Could not do that', 'error');
    } finally {
      setBusy(false);
    }
  }
  async function removeConversation() {
    const ok = await confirmDialog({ title: 'Delete this conversation?', message: 'The messages and suggestions are deleted for good. Anything you already saved from it stays.', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.del(`/api/reflection/conversations/${convId}`);
      await openConversation(null);
      await loadStatus();
    } catch (err) {
      toast((err && err.message) || 'Could not delete it', 'error');
    }
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="alert" cls="icon-lg" />
          <h3>Couldn&apos;t load this page</h3>
          <p>{error.message}</p>
          <button className="btn" onClick={() => { setError(null); loadStatus(); }}>Try again</button>
        </div>
      </div>
    );
  }
  if (!status) {
    return (
      <div className="page">
        <div className="loading-line"><span className="spinner" /> Loading…</div>
      </div>
    );
  }
  const usable = status.configured && status.aiEnabled;
  const lastAssistant = [...messages].map((m, i) => [m, i]).filter(([m]) => m.role === 'assistant').map(([, i]) => i).pop();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reflection</h1>
          <p className="page-subtitle">Think a personal topic through and turn it into one small step.</p>
        </div>
      </div>
      <p className="text-sm" role="note" style={{ marginBottom: 'var(--sp-4)' }}>{status.notice}</p>

      <Insights api={api} toast={toast} status={status} onChanged={loadStatus} />

      <div className="card card-pad">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          <span className="card-title">Conversation</span>
          <span className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <select className="select" style={{ width: 'auto', maxWidth: 180 }} aria-label="Conversations" value={convId || ''} onChange={(e) => openConversation(e.target.value ? Number(e.target.value) : null)}>
              <option value="">New conversation</option>
              {conversations.map((c) => <option key={c.id} value={c.id}>{c.title || 'Conversation'}</option>)}
            </select>
            {convId ? <button className="btn btn-sm" onClick={removeConversation}>Delete</button> : null}
          </span>
        </div>
        {!usable ? (
          <p className="text-sm muted">{!status.aiEnabled ? 'AI features are turned off in Settings.' : 'The AI is not available right now.'}</p>
        ) : null}
        <div className="stack" style={{ marginBottom: 'var(--sp-3)' }} aria-live="polite">
          {messages.length === 0 ? <p className="text-sm muted">What is on your mind? Your conversation is private to you.</p> : null}
          {messages.map((m, i) => (
            <div key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
              <div className="chat-bubble" style={m.role === 'user' ? { background: 'var(--brand)', color: 'var(--text-on-brand)' } : undefined}>{m.content}</div>
              {i === lastAssistant ? proposals.filter((p) => p.status === 'pending').map((p) => (
                <Proposal key={p.id} proposal={p} onAccept={accept} onReject={reject} onRevise={(pr, instruction) => send(instruction, pr.id)} busy={busy || sending} />
              )) : null}
            </div>
          ))}
          {proposals.filter((p) => p.status !== 'pending').map((p) => (
            <Proposal key={p.id} proposal={p} onAccept={accept} onReject={reject} onRevise={() => {}} busy />
          ))}
          <div ref={endRef} />
        </div>
        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <textarea className="textarea" aria-label="Your message" style={{ minHeight: 44, height: 44 }} value={text} maxLength={status.maxMessageLength} placeholder="Write here…" disabled={!usable || sending} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary" type="submit" disabled={!usable || sending || !text.trim()}>{sending ? 'Thinking…' : 'Send'}</button>
        </form>
      </div>
    </div>
  );
}
