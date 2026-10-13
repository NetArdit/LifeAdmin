// Shared test infrastructure. Zero new dependencies — uses Node's built-in
// test runner (`node:test`), built-in `fetch`, and a disposable SQLite file
// per test file (via LIFEADMIN_DB_PATH, see src/db/index.js) so tests never
// touch the real data/lifeadmin.db. Node's test runner isolates each test
// file in its own process by default, so requiring '../server' fresh per
// file (after setting the env var) gives each file its own database.

const path = require('path');
const fs = require('fs');
const os = require('os');

function freshDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-test-'));
  return path.join(dir, 'test.db');
}

// Starts the app on an ephemeral port against a fresh, empty database.
// Returns { base, close } — call close() in an `after` hook.
async function startApp() {
  const dbPath = freshDbPath();
  process.env.LIFEADMIN_DB_PATH = dbPath;
  process.env.NODE_ENV = 'test';
  // A developer's own .env may hold a real AI key. The suite must never use it: set (empty) before the
  // server loads .env, a value that is already there is not replaced.
  if (process.env.GROQ_API_KEY === undefined) process.env.GROQ_API_KEY = '';
  if (process.env.ANTHROPIC_API_KEY === undefined) process.env.ANTHROPIC_API_KEY = '';
  delete require.cache[require.resolve('../server')];
  const app = require('../server');

  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({
        base: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((res) => {
            server.close(() => {
              try {
                fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
              } catch {}
              res();
            });
          }),
      });
    });
    server.on('error', reject);
  });
}

// A tiny cookie-jar-aware HTTP client. Node's global fetch does not persist
// cookies across requests on its own, so this captures Set-Cookie from each
// response and replays it — mirroring what a real browser session does for
// the httpOnly session cookie the app relies on for auth.
function makeClient(base) {
  let cookie = '';

  async function request(method, urlPath, body) {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    const opts = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(base + urlPath, opts);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { status: res.status, data };
  }

  return {
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b === undefined ? {} : b),
    patch: (p, b) => request('PATCH', p, b === undefined ? {} : b),
    // Deliberately mirrors the (now-fixed) frontend api.del(url, body) shape —
    // pass no body to simulate an unauthenticated-style bare DELETE.
    del: (p, b) => request('DELETE', p, b),
    // The session cookie, for a request the test makes itself (a picture, read as bytes).
    cookie: () => cookie,
    clearCookie: () => {
      cookie = '';
    },
  };
}

let userCounter = 0;
function uniqueUser(overrides = {}) {
  userCounter += 1;
  const n = userCounter;
  return {
    firstName: 'Test',
    lastName: `User${n}`,
    email: `test.user${n}.${Date.now()}@example.test`,
    phone: `+3834400${String(1000 + n).slice(-4)}`,
    password: 'testpass123',
    confirmPassword: 'testpass123',
    ...overrides,
  };
}

async function signUp(client, overrides = {}) {
  const payload = uniqueUser(overrides);
  const res = await client.post('/api/auth/signup', payload);
  return { res, payload };
}

module.exports = { startApp, makeClient, uniqueUser, signUp };
