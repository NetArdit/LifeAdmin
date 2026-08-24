import { api, ApiError } from '../api.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../components/toast.js';

export function mount(root, onAuthed) {
  let mode = 'login';
  render();

  function render() {
    root.innerHTML = `
      <div class="auth-shell">
        <div class="auth-visual">
          <div class="auth-brand"><span class="brand-mark" style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-weight:800;">L</span>LifeAdmin</div>
          <div>
            <h1>Tell LifeAdmin what's happening in your life.</h1>
            <p>It helps you organize what should happen next — tasks, bills, family responsibilities, decisions and goals, in one calm place.</p>
          </div>
          <p style="font-size:var(--fs-xs);color:rgba(255,255,255,0.55)">Local-first · Your data stays on this machine</p>
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
    container.innerHTML = mode === 'login' ? loginHtml() : signupHtml();
    wireForm();
  }

  function loginHtml() {
    return `
      <h2 style="font-family:var(--font-serif);font-weight:500;font-size:1.7rem;margin-bottom:4px">Welcome back</h2>
      <p class="muted text-sm" style="margin-bottom:var(--sp-6)">Sign in to your LifeAdmin.</p>
      <form id="auth-form" class="stack" novalidate>
        ${field('identifier', 'Email or phone', 'text', '', 'you@example.com or +383...')}
        ${field('password', 'Password', 'password')}
        <div id="form-error" class="field-error" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-btn">Sign in</button>
      </form>
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
        ${field('phone', 'Phone number', 'tel', '', '+383 44 123 456')}
        ${field('password', 'Password', 'password', '', 'At least 8 characters')}
        ${field('confirmPassword', 'Confirm password', 'password')}
        <div id="form-error" class="field-error" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-btn">Create account</button>
      </form>
      <p class="auth-switch">Already have an account? <button type="button" id="switch-mode">Sign in</button></p>
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

  function wireForm() {
    document.getElementById('switch-mode').addEventListener('click', () => {
      mode = mode === 'login' ? 'signup' : 'login';
      renderForm();
    });

    const form = document.getElementById('auth-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> ${mode === 'login' ? 'Signing in…' : 'Creating account…'}`;

      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const result =
          mode === 'login'
            ? await api.post('/api/auth/login', data)
            : await api.post('/api/auth/signup', data);
        onAuthed(result.user);
      } catch (err) {
        if (err instanceof ApiError) {
          showFieldErrors(err.fields);
          showFormError(err.message);
        } else {
          showFormError('Something went wrong. Please try again.');
        }
        btn.disabled = false;
        btn.textContent = mode === 'login' ? 'Sign in' : 'Create account';
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
