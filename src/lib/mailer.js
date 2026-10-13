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
//            Resend-specific code lives in sendViaResend() below.
//   smtp   — any SMTP server that takes a login (Brevo's relay is the one the hosted
//            LifeAdmin uses): SMTP_HOST, SMTP_PORT (587 by default), SMTP_USER,
//            SMTP_PASS and MAIL_FROM. The ONLY SMTP-specific code is sendViaSmtp().
//
// Selection: MAIL_TRANSPORT ("outbox" | "none" | "resend" | "smtp") if set;
// otherwise in production "resend" when BOTH RESEND_API_KEY and MAIL_FROM are
// set, else "smtp" when SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM are all
// set, else "none"; outside production "outbox".
//
// Secrets: RESEND_API_KEY is read from the server environment only and is
// never logged or returned. MAIL_FROM must be an address on a domain verified
// in the Resend account — there is deliberately NO default sender.

const outbox = [];

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function transportName() {
  const explicit = (process.env.MAIL_TRANSPORT || '').trim().toLowerCase();
  if (explicit === 'outbox' || explicit === 'none' || explicit === 'resend' || explicit === 'smtp') return explicit;
  if (process.env.NODE_ENV === 'production') {
    if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) return 'resend';
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM) return 'smtp';
    return 'none';
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

let smtp = null;
async function sendViaSmtp({ to, subject, text, html }) {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass, MAIL_FROM: from } = process.env;
  if (!host || !user || !pass || !from) {
    console.error('[LifeAdmin] Mail transport is "smtp" but SMTP_HOST, SMTP_USER, SMTP_PASS and/or MAIL_FROM is not set; nothing was sent.');
    return { delivered: false, transport: 'smtp', error: 'not_configured' };
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  try {
    // Loaded on first use: an installation that sends no mail never loads it.
    smtp ??= require('nodemailer').createTransport({
      host,
      port,
      secure: port === 465,
      // On 587 the conversation is encrypted before the password is said.
      requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: timeoutMs(),
      greetingTimeout: timeoutMs(),
      socketTimeout: timeoutMs(),
    });
    await smtp.sendMail({ from, to, subject, text, ...(html ? { html } : {}) });
    return { delivered: true, transport: 'smtp' };
  } catch (err) {
    // The kind of failure only: a mail server's own words can repeat the address.
    console.error(`[LifeAdmin] The mail server did not take a message (${(err && (err.code || err.name)) || 'error'}).`);
    return { delivered: false, transport: 'smtp', error: err && err.responseCode ? 'provider_rejected' : 'provider_unreachable' };
  }
}

async function sendMail({ to, subject, text, html }) {
  const transport = transportName();
  if (transport === 'none') return { delivered: false, transport, error: 'no_provider' };
  if (transport === 'resend') return sendViaResend({ to, subject, text, html });
  if (transport === 'smtp') return sendViaSmtp({ to, subject, text, html });

  outbox.push({ to, subject, text, html, at: Date.now() });
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
    console.log(`[LifeAdmin mail:outbox] To: ${to}\nSubject: ${subject}\n${text}\n`);
  }
  return { delivered: true, transport };
}

// One line for the server console at start-up; null when real mail is configured.
function startupNotice() {
  const t = transportName();
  if (t === 'outbox') return 'Mail: no real email is sent in this mode (outbox). Reset links and codes are printed here in the server console. To send real mail set MAIL_TRANSPORT=smtp plus SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM and APP_BASE_URL in .env.';
  if (t === 'none') return 'Mail: no provider configured, nothing will be sent.';
  return null;
}

function getOutbox() {
  return outbox.slice();
}

function clearOutbox() {
  outbox.length = 0;
}

module.exports = { sendMail, getOutbox, clearOutbox, transportName, startupNotice };
