import { api, ApiError } from '../api.js';

// The auth screen is still the original vanilla implementation (it was never
// part of the page migration). Phase 8.2 adds two modes to it — 'forgot' and
// 'reset' — using the same markup/classes as login and signup.
const RESET_HASH = /^#\/reset-password\/([A-Za-z0-9_-]+)/;

// The link in the email-confirmation message. Like the reset token it lives in the fragment, which is never sent anywhere.
const VERIFY_HASH = /^#\/verify-email\/([A-Za-z0-9_-]+)/;

// Why a Google sign-in came back without a session (the server sends a short code only).
const AUTH_ERRORS = {
  google_unavailable: 'Google sign-in is not available right now. Use your email and password.',
  google_cancelled: 'Google sign-in was cancelled.',
  google_failed: 'Google sign-in did not work. Please try again.',
  google_unverified: 'Google has not confirmed that email address, so it cannot be used here.',
  google_link_needs_signin: 'An account with this email already exists and its email is not confirmed yet. Sign in with your password first, confirm your email in Settings, then use Google.',
};

export async function mount(root, onAuthed) {
  const initialToken = (RESET_HASH.exec(location.hash) || [])[1] || null;
  const verifyToken = (VERIFY_HASH.exec(location.hash) || [])[1] || null;
  let resetToken = initialToken;
  let mode = verifyToken ? 'verify' : initialToken ? 'reset' : 'login';
  let notice = '';
  let googleOn = false;
  try {
    googleOn = !!(await api.get('/api/config')).googleConfigured;
  } catch {}
  const authError = new URLSearchParams(location.search).get('auth_error');
  if (authError) {
    notice = AUTH_ERRORS[authError] || AUTH_ERRORS.google_failed;
    history.replaceState(null, '', location.pathname + location.hash);
  }
  render();

  function render() {
    root.innerHTML = `
      <div class="auth-shell">
        <div class="auth-visual">
          <div class="auth-brand"><span class="brand-mark" style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-weight:800;">L</span>LifeAdmin</div>
          <div>
            <h1>Tell LifeAdmin what's happening in your life.</h1>
            <p>It helps you organize what should happen next — tasks, bills, shared responsibilities, decisions and goals, in one calm place.</p>
          </div>
          <p style="font-size:var(--fs-xs);color:rgba(255,255,255,0.55)">Private by default · Only you and your circle see your data</p>
        </div>
        <div class="auth-form-side">
          <div class="auth-card">
            <div id="auth-form-container"></div>
          </div>
        </div>
      </div>
    `;
    renderForm();
  }

  function renderForm() {
    const container = document.getElementById('auth-form-container');
    if (mode === 'reset') return renderReset(container);
    if (mode === 'verify') return renderVerify(container);
    container.innerHTML = mode === 'login' ? loginHtml() : mode === 'forgot' ? forgotHtml() : signupHtml();
    wireForm();
  }

  function noticeHtml() {
    return notice ? `<p class="text-sm" role="status" style="color:var(--accent-600);margin-bottom:var(--sp-4)">${notice}</p>` : '';
  }

  function loginHtml() {
    const n = noticeHtml();
    notice = '';
    return `
      <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">Welcome back</h2>
      <p class="muted text-sm" style="margin-bottom:var(--sp-6)">Sign in to your LifeAdmin.</p>
      ${n}
      <form id="auth-form" class="stack" novalidate>
        ${field('identifier', 'Email or phone', 'text', '', 'you@example.com or +383...')}
        ${field('password', 'Password', 'password')}
        <div id="form-error" class="field-error" role="alert" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-btn">Sign in</button>
      </form>
      ${googleButton()}
      <p class="auth-switch"><button type="button" id="forgot-link">Forgot your password?</button></p>
      <p class="auth-switch">New to LifeAdmin? <button type="button" id="switch-mode">Create an account</button></p>
    `;
  }

  function signupHtml() {
    return `
      <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">Create your account</h2>
      <p class="muted text-sm" style="margin-bottom:var(--sp-6)">Set up your personal LifeAdmin in under a minute.</p>
      <form id="auth-form" class="stack" novalidate>
        <div class="grid-2">
          ${field('firstName', 'First name', 'text')}
          ${field('lastName', 'Last name', 'text')}
        </div>
        ${field('email', 'Email', 'email')}
        ${field('phone', 'Phone number (optional)', 'tel', '', '+383 44 123 456')}
        ${field('password', 'Password', 'password', '', 'At least 8 characters')}
        ${field('confirmPassword', 'Confirm password', 'password')}
        <div id="form-error" class="field-error" role="alert" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-btn">Create account</button>
      </form>
      ${googleButton()}
      <p class="auth-switch">Already have an account? <button type="button" id="switch-mode">Sign in</button></p>
    `;
  }

  // A plain link: the browser leaves for Google and comes back to the server's callback, which sets the session.
  function googleButton() {
    // Always shown: a Google (Gmail) account signs in or signs up in one press, with no email and password to type.
    // Until the site's Google keys are set the server answers with a clear message instead (google_unavailable).
    void googleOn;
    return `<p class="muted text-sm" style="text-align:center;margin:var(--sp-4) 0 var(--sp-2)">or</p>
      <a class="btn btn-block btn-lg" id="google-btn" href="/api/auth/google/start"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.2-13.6-9.9l-7.8 6.1C6.500 42.600 14.600 48 24 48z"/></svg> Sign in with Google</a>`;
  }

  function forgotHtml() {
    return `
      <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">Reset your password</h2>
      <p class="muted text-sm" style="margin-bottom:var(--sp-6)">Enter the email address for your account and we'll send you a link to choose a new password.</p>
      <form id="auth-form" class="stack" novalidate>
        ${field('email', 'Email', 'email')}
        <div id="form-error" class="field-error" role="alert" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-btn">Send reset link</button>
      </form>
      <p class="auth-switch"><button type="button" id="switch-mode">Back to sign in</button></p>
    `;
  }

  function field(name, label, type, value = '', placeholder = '') {
    return `
      <div class="field">
        <label class="field-label" for="f-${name}">${label}</label>
        <input class="input" id="f-${name}" name="${name}" type="${type}" value="${value}" placeholder="${placeholder}" autocomplete="${type === 'password' ? 'new-password' : 'on'}" />
        <div class="field-error" data-error-for="${name}" style="display:none"></div>
      </div>
    `;
  }

  // ---- reset (arrived via the emailed link) ----------------------------------
  // The token lives in the URL fragment, which browsers never send to the
  // server or in a Referer header; it is removed from the address bar once the
  // reset succeeds.
  async function renderReset(container) {
    container.innerHTML = `<div class="loading-line" role="status"><span class="spinner"></span> Checking your reset link…</div>`;
    try {
      await api.post('/api/auth/reset-password/check', { token: resetToken });
    } catch (err) {
      container.innerHTML = `
        <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">This link can't be used</h2>
        <p class="field-error" role="alert" style="display:block;margin:var(--sp-4) 0">${err instanceof ApiError ? escapeText(err.message) : 'Something went wrong. Please try again.'}</p>
        <button type="button" class="btn btn-primary btn-block btn-lg" id="request-new">Request a new link</button>
        <p class="auth-switch"><button type="button" id="back-login">Back to sign in</button></p>
      `;
      document.getElementById('request-new').addEventListener('click', () => leaveReset('forgot'));
      document.getElementById('back-login').addEventListener('click', () => leaveReset('login'));
      return;
    }
    container.innerHTML = `
      <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">Choose a new password</h2>
      <p class="muted text-sm" style="margin-bottom:var(--sp-6)">Use at least 8 characters. You'll be signed out everywhere and asked to sign in again.</p>
      <form id="auth-form" class="stack" novalidate>
        ${field('password', 'New password', 'password', '', 'At least 8 characters')}
        ${field('confirmPassword', 'Confirm new password', 'password')}
        <div id="form-error" class="field-error" role="alert" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-btn">Update password</button>
      </form>
      <p class="auth-switch"><button type="button" id="back-login">Back to sign in</button></p>
    `;
    document.getElementById('back-login').addEventListener('click', () => leaveReset('login'));
    wireForm();
  }

  // ---- email confirmation (arrived via the emailed link) ---------------------
  async function renderVerify(container) {
    container.innerHTML = `<div class="loading-line" role="status"><span class="spinner"></span> Confirming your email…</div>`;
    let title = 'Email confirmed';
    let text = 'Thank you. Your email address is confirmed.';
    let failed = false;
    try {
      await api.post('/api/auth/verify-email', { token: verifyToken });
    } catch (err) {
      failed = true;
      title = "This link can't be used";
      text = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
    }
    container.innerHTML = `
      <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">${escapeText(title)}</h2>
      <p class="text-sm" role="${failed ? 'alert' : 'status'}" style="margin:var(--sp-4) 0 var(--sp-6)">${escapeText(text)}</p>
      <button type="button" class="btn btn-primary btn-block btn-lg" id="verify-continue">Continue</button>
    `;
    document.getElementById('verify-continue').addEventListener('click', () => {
      // The token must not stay in the address bar or the history.
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
    });
  }

  function leaveReset(nextMode) {
    resetToken = null;
    // replaceState (not location.hash =) so no hashchange fires and the token
    // doesn't linger in history.
    history.replaceState(null, '', location.pathname + location.search);
    mode = nextMode;
    renderForm();
  }

  function escapeText(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function wireForm() {
    const switchBtn = document.getElementById('switch-mode');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        mode = mode === 'login' ? 'signup' : 'login';
        renderForm();
      });
    }
    const forgotLink = document.getElementById('forgot-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', () => {
        mode = 'forgot';
        renderForm();
      });
    }

    const form = document.getElementById('auth-form');
    const idleLabel = () =>
      ({ login: 'Sign in', signup: 'Create account', forgot: 'Send reset link', reset: 'Update password' }[mode]);
    const busyLabel = () =>
      ({ login: 'Signing in…', signup: 'Creating account…', forgot: 'Sending…', reset: 'Updating…' }[mode]);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> ${busyLabel()}`;

      const data = Object.fromEntries(new FormData(form).entries());
      try {
        if (mode === 'forgot') {
          const result = await api.post('/api/auth/forgot-password', { email: data.email });
          document.getElementById('auth-form-container').innerHTML = `
            <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">Check your email</h2>
            <p class="text-sm" role="status" style="margin:var(--sp-4) 0 var(--sp-6)">${escapeText(result.message)}</p>
            <button type="button" class="btn btn-block btn-lg" id="back-login">Back to sign in</button>
          `;
          document.getElementById('back-login').addEventListener('click', () => {
            mode = 'login';
            renderForm();
          });
          return;
        }
        if (mode === 'reset') {
          await api.post('/api/auth/reset-password', { token: resetToken, password: data.password, confirmPassword: data.confirmPassword });
          notice = 'Your password has been updated. Sign in with your new password.';
          leaveReset('login');
          return;
        }
        if (mode === 'signup') {
          // The answer is the same whether or not the address already had an account, and starts no session.
          const result = await api.post('/api/auth/signup', data);
          notice = result.message + ' You can sign in now.';
          mode = 'login';
          renderForm();
          return;
        }
        const result = await api.post('/api/auth/login', data);
        onAuthed(result.user);
      } catch (err) {
        if (err instanceof ApiError) {
          showFieldErrors(err.fields);
          showFormError(err.message);
        } else {
          showFormError('Something went wrong. Please try again.');
        }
        btn.disabled = false;
        btn.textContent = idleLabel();
      }
    });
  }

  function clearErrors() {
    document.querySelectorAll('[data-error-for]').forEach((e) => {
      e.style.display = 'none';
      e.textContent = '';
    });
    document.querySelectorAll('.input').forEach((i) => i.classList.remove('has-error'));
    const fe = document.getElementById('form-error');
    fe.style.display = 'none';
  }

  function showFieldErrors(fields = {}) {
    for (const [name, message] of Object.entries(fields)) {
      const el = document.querySelector(`[data-error-for="${name}"]`);
      const input = document.getElementById(`f-${name}`);
      if (el) {
        el.textContent = message;
        el.style.display = 'block';
      }
      if (input) input.classList.add('has-error');
    }
  }

  function showFormError(message) {
    const fe = document.getElementById('form-error');
    fe.textContent = message;
    fe.style.display = 'block';
  }
}
