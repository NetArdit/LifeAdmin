// Thin fetch wrapper. Always sends cookies, always expects JSON, and throws
// a normalized ApiError so callers can show useful messages.

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

// Session-expiry fix (Daily Product Quality phase): every authenticated
// request goes through this one function, so this is the single place a
// 401 can be turned into "return to sign in" for the whole app, instead of
// every page/hook that calls api.get/post/... having to notice a 401 and
// redirect itself. api.js stays a small, app-agnostic fetch wrapper — it
// has no idea what "the app" or "the login screen" are — so it only exposes
// a place to register a callback; app.js (which owns that knowledge) wires
// one up once at boot. See app.js's handleSessionExpired() for what the
// callback actually does and why a plain callback (not a bigger
// state-management layer) is enough here.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(method, url, body) {
  const opts = {
    method,
    headers: {},
    credentials: 'same-origin',
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new ApiError('Network error — is the server running?', 0);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(message, res.status, data && data.fields);
  }
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body === undefined ? {} : body),
  patch: (url, body) => request('PATCH', url, body === undefined ? {} : body),
  del: (url, body) => request('DELETE', url, body),
};
