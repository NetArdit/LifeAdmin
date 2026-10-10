import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon.jsx';

const PROMPT_CHIPS = [
  'Organize my week',
  "What needs my attention today?",
  'I have too much going on, help me prioritize',
  'What can I change to save money this month?',
];

// React port of renderChatTab()/renderMessages() from the original
// public/js/pages/assistant.js. Two deliberate reliability fixes made
// during this migration (see PHASE_7_ASSISTANT_MIGRATION_REPORT.md §Stage 2
// for the audit that found them):
//  1. The form/input is disabled while a request is in flight — the
//     original had no such guard on either Assistant form, so a user could
//     fire overlapping /api/ai/chat calls (each one a real AI-provider
//     cost if configured) and risk a slower earlier response overwriting a
//     faster later one. Disabling input while `sending` is true prevents
//     both the wasted cost and the staleness risk with the simplest
//     possible mechanism — no AbortController needed, since only one
//     request can ever be in flight from this UI now.
//  2. On failure, the just-typed text is restored into the input instead
//     of being silently lost (the original cleared the input optimistically
//     and never restored it on failure) — a small, evidence-justified
//     retry-friendliness fix, not a redesign.
export function ChatTab({ api, toast }) {
  const [messages, setMessages] = useState(null); // null = loading history
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const boxRef = useRef(null);

  // Additional daily-use fix (Daily Product Quality phase): the history
  // fetch had no .catch(). `messages` starts at null specifically to mean
  // "still loading" (see the render below), so if this request ever failed
  // — a network blip, or a 401 landing just before the central
  // session-expiry handler unmounts this page — it stayed null forever and
  // the "Loading conversation…" spinner never went away. Falls back to an
  // empty conversation (the same state a genuinely new conversation starts
  // in) and surfaces the real error via the existing toast, instead of a
  // silent infinite spinner.
  useEffect(() => {
    let cancelled = false;
    api
      .get('/api/ai/chat/history')
      .then(({ messages: history }) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        if (cancelled) return;
        setMessages([]);
        toast(err.message || 'Could not load your conversation history.', 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [api, toast]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, sending]);

  async function sendMessage(text) {
    if (!text || sending) return;
    setInputValue('');
    setMessages((m) => [...(m || []), { role: 'user', content: text }]);
    setSending(true);
    try {
      const result = await api.post('/api/ai/chat', { message: text });
      if (!result.ok) {
        toast(result.error, 'error');
        setMessages((m) => m.slice(0, -1));
        setInputValue(text);
        return;
      }
      setMessages((m) => [...m, { role: 'assistant', content: result.data.reply, suggestions: result.data.suggestions }]);
    } catch (err) {
      toast(err.message, 'error');
      setMessages((m) => m.slice(0, -1));
      setInputValue(text);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(inputValue.trim());
  }

  return (
    <div className="card card-pad">
      <div className="assistant-shell">
        {/* Visual Redesign Batch 10: the container itself is now the live
            region (aria-relevant="additions" so a screen reader announces
            only newly-appended messages, not the whole growing history on
            every update) — previously only the transient "Thinking…"
            placeholder had aria-live, so the real reply that replaced it
            was never itself announced. */}
        <div className="assistant-messages" ref={boxRef} aria-live="polite" aria-relevant="additions">
          {messages === null ? (
            <div className="loading-line">
              <span className="spinner" /> Loading conversation…
            </div>
          ) : messages.length === 0 && !sending ? (
            <div className="assistant-empty">
              <Icon name="assistant" cls="icon-lg" />
              <h3 style={{ marginTop: 'var(--sp-2)' }}>How can I help with your week?</h3>
              <div className="assistant-prompt-grid">
                {PROMPT_CHIPS.map((p) => (
                  <button key={p} className="assistant-prompt-chip" onClick={() => sendMessage(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div className={`assistant-msg ${m.role}`} key={i}>
                  <div className="bubble">{m.content}</div>
                  {m.suggestions && m.suggestions.length ? (
                    <div className="assistant-suggestions">
                      {m.suggestions.map((s) => (
                        <button key={s} className="pill" disabled={sending} onClick={() => sendMessage(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {sending ? (
                <div className="assistant-msg assistant">
                  <div className="bubble">
                    <span className="spinner" /> Thinking…
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            className="input"
            aria-label="Message the assistant"
            placeholder="Ask LifeAdmin anything about your week…"
            style={{ flex: 1 }}
            autoComplete="off"
            value={inputValue}
            disabled={sending}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button className="btn btn-primary btn-icon" type="submit" aria-label="Send" disabled={sending}>
            <Icon name="send" cls="icon-sm" />
          </button>
        </form>
      </div>
    </div>
  );
}
