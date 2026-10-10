// Provider-neutral mail interface.
//
//   sendMail({ to, subject, text, html? }) -> { delivered, transport, error? }
//
// It never throws and never returns provider response bodies: callers get a
// boolean-ish result and a short generic error code, nothing more.
//
// Transports:
//   outbox — development/test. Messages are kept in memory (getOutbox()); in
//            `development` the text is also printed to the server console so a
//            developer can follow a reset link locally. Silent under NODE_ENV=test.
//   none   — sends nothing (production default when Resend is not configured).
//   resend — Resend's HTTPS API (https://resend.com/docs/api-reference/emails/send-email),
//            called with Node's built-in fetch (no SDK/dependency). The ONLY
//            provider-specific code lives in sendViaResend() below.
//
// Selection: MAIL_TRANSPORT ("outbox" | "none" | "resend") if set; otherwise
// in production "resend" when BOTH RESEND_API_KEY and MAIL_FROM are set, else
// "none"; outside production "outbox".
//
// Secrets: RESEND_API_KEY is read from the server environment only and is
// never logged or returned. MAIL_FROM must be an address on a domain verified
// in the Resend account — there is deliberately NO default sender.

const outbox = [];

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function transportName() {
  const explicit = (process.env.MAIL_TRANSPORT || '').trim().toLowerCase();
  if (explicit === 'outbox' || explicit === 'none' || explicit === 'resend') return explicit;
  if (process.env.NODE_ENV === 'production') {
    return process.env.RESEND_API_KEY && process.env.MAIL_FROM ? 'resend' : 'none';
  }
  return 'outbox';
}

// The API base can be overridden ONLY outside production (tests point it at a
// local mock server); in production the real endpoint is always used, so a
// stray env var can never redirect the API key elsewhere.
function resendEndpoint() {
  const override = (process.env.RESEND_API_BASE || '').trim().replace(/\/+$/, '');
  if (override && process.env.NODE_ENV !== 'production') return `${override}/emails`;
  return RESEND_ENDPOINT;
}

function timeoutMs() {
  const n = Number(process.env.MAIL_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 10000;
}

async function sendViaResend({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    console.error('[LifeAdmin] Mail transport is "resend" but RESEND_API_KEY and/or MAIL_FROM is not set; nothing was sent.');
    return { delivered: false, transport: 'resend', error: 'not_configured' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const res = await fetch(resendEndpoint(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, ...(html ? { html } : {}) }),
      signal: controller.signal,
    });
    if (!res.ok) {
      // Only the status code is logged: never the response body (may echo
      // request details) and never the key or message content.
      console.error(`[LifeAdmin] Email provider rejected a message (HTTP ${res.status}).`);
      return { delivered: false, transport: 'resend', error: 'provider_rejected' };
    }
    return { delivered: true, transport: 'resend' };
  } catch (err) {
    console.error(`[LifeAdmin] Email provider request failed (${err && err.name === 'AbortError' ? 'timeout' : 'network error'}).`);
    return { delivered: false, transport: 'resend', error: 'provider_unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

async function sendMail({ to, subject, text, html }) {
  const transport = transportName();
  if (transport === 'none') return { delivered: false, transport, error: 'no_provider' };
  if (transport === 'resend') return sendViaResend({ to, subject, text, html });

  outbox.push({ to, subject, text, html, at: Date.now() });
  if (process.env.NODE_ENV === 'development') {
    console.log(`[LifeAdmin mail:outbox] To: ${to}\nSubject: ${subject}\n${text}\n`);
  }
  return { delivered: true, transport };
}

function getOutbox() {
  return outbox.slice();
}

function clearOutbox() {
  outbox.length = 0;
}

module.exports = { sendMail, getOutbox, clearOutbox, transportName };
