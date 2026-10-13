import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon.jsx';
import { MuteCircle } from './MuteCircle.jsx';
import { initials, fmtRelative } from '../../../../public/js/format.js';

// Direct port of renderChat()/chatBubble() from the original
// public/js/pages/family.js. Preserves the exact polling behavior: a full
// re-fetch of all (up to 200) messages every 6 seconds — the backend
// supports an incremental `since` param, but the original never used it,
// so this doesn't either (using it would be inventing more-efficient
// behavior the original never had, not parity). Auto-scroll only fires if
// the user was already scrolled to the bottom (or on first load) — someone
// scrolled up reading history doesn't get yanked back down by a poll tick.
export function ChatTab({ api, toast, myUserId, familyId }) {
  const [messages, setMessages] = useState(null); // null = not yet loaded
  const [inputValue, setInputValue] = useState('');
  const boxRef = useRef(null);
  const firstLoadDone = useRef(false);

  // Additional daily-use fix (Daily Product Quality phase): this had no
  // try/catch, unlike handleSubmit below. Two real consequences: (1) every
  // failed poll tick (a transient network blip, or a 401 landing just
  // before the central session-expiry handler unmounts this page) threw an
  // unhandled promise rejection every 6 seconds; (2) if the very FIRST load
  // failed, `messages` stayed at its initial `null` ("still loading")
  // forever and the "Loading messages…" spinner never went away. A later
  // poll tick failing after messages have already loaded once now just
  // skips that tick silently and retries on the next one, rather than
  // wiping out messages already on screen or surfacing a disruptive error
  // for what's usually a momentary blip.
  const load = useCallback(async () => {
    try {
      const { messages: rows } = await api.get(`/api/chat/${familyId}/messages`);
      const box = boxRef.current;
      const wasAtBottom = box ? box.scrollTop + box.clientHeight >= box.scrollHeight - 40 : true;
      setMessages(rows);
      requestAnimationFrame(() => {
        if (boxRef.current && (wasAtBottom || !firstLoadDone.current)) {
          boxRef.current.scrollTop = boxRef.current.scrollHeight;
          firstLoadDone.current = true;
        }
      });
    } catch {
      setMessages((prev) => (prev === null ? [] : prev));
    }
  }, [api, familyId]);

  useEffect(() => {
    firstLoadDone.current = false;
    setMessages(null);
    load();
    const timer = setInterval(load, 6000);
    return () => clearInterval(timer);
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    setInputValue('');
    try {
      await api.post(`/api/chat/${familyId}/messages`, { body: val });
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="card card-pad">
      <div style={{ marginBottom: 'var(--sp-3)' }}>
        <MuteCircle api={api} toast={toast} familyId={familyId} />
      </div>
      <div className="chat-window">
        <div className="chat-messages" ref={boxRef}>
          {messages === null ? (
            <div className="loading-line">
              <span className="spinner" /> Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <p>No messages yet. Say hello.</p>
            </div>
          ) : (
            messages.map((m) => <ChatBubble key={m.id} message={m} myId={myUserId} />)
          )}
        </div>
        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            className="input"
            placeholder="Message the circle…"
            style={{ flex: 1 }}
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button className="btn btn-primary btn-icon" type="submit" aria-label="Send">
            <Icon name="send" cls="icon-sm" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({ message, myId }) {
  const self = message.authorId === myId;
  return (
    <div className={`chat-bubble-row ${self ? 'self' : ''}`}>
      {!self ? <div className="avatar avatar-sm">{initials(...message.authorName.split(' '))}</div> : null}
      <div>
        <div className="chat-bubble">{message.body}</div>
        <div className="chat-meta">
          {!self ? message.authorName + ' · ' : ''}
          {fmtRelative(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
