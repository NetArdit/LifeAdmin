// "Continue with Google": the OAuth 2.0 / OpenID Connect authorization-code flow with PKCE (S256), a random
// `state` tied to this browser by a cookie, and a `nonce`. Everything secret stays on the server.
//
// The ID token is received straight from Google's token endpoint over TLS in exchange for the code, so, as
// OpenID Connect Core 3.1.3.7 allows, the TLS channel stands in for checking its signature; the claims are
// all checked (issuer, audience, expiry, nonce, verified email).
//
// Account linking (a policy the owner set; do not loosen it without asking): a Google identity joins an
// existing password account ONLY when that account's email is verified too. If it is not, nobody is signed
// in and the person is told to sign in with their password first. This is what stops someone who registered
// another person's address (unverified) from inheriting that person's Google sign-in.
const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { createSession, setSessionCookie, hashPassword, hashToken } = require('../lib/auth');
const { resetBaseUrl } = require('../lib/passwordReset');

const router = express.Router();

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const STATE_COOKIE = 'la_oauth';
const ATTEMPT_TTL_MS = 10 * 60 * 1000;

function isConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && resetBaseUrl());
}

// The token endpoint can be pointed at a local mock ONLY outside production (the tests do), so a stray
// variable can never send the client secret elsewhere.
function tokenUrl() {
  const override = (process.env.GOOGLE_TOKEN_URL || '').trim();
  return override && process.env.NODE_ENV !== 'production' ? override : TOKEN_URL;
}

function redirectUri() {
  return `${resetBaseUrl()}/api/auth/google/callback`;
}

function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/google', maxAge: ATTEMPT_TTL_MS };
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function back(res, error) {
  // Nothing about the person or the failure's inner cause travels in the address: only a short code.
  res.redirect(302, error ? `/?auth_error=${encodeURIComponent(error)}` : '/');
}

router.get(
  '/start',
  asyncRoute(async (req, res) => {
    if (!isConfigured()) return back(res, 'google_unavailable');
    const state = b64url(crypto.randomBytes(32));
    const verifier = b64url(crypto.randomBytes(48));
    const nonce = b64url(crypto.randomBytes(16));
    const now = Date.now();
    await db.run('DELETE FROM oauth_attempts WHERE expires_at <= ?', [now]);
    await db.run('INSERT INTO oauth_attempts (state_hash, code_verifier, nonce, expires_at, created_at) VALUES (?, ?, ?, ?, ?)', [
      hashToken(state),
      verifier,
      nonce,
      now + ATTEMPT_TTL_MS,
      now,
    ]);
    res.cookie(STATE_COOKIE, state, cookieOptions());
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: b64url(crypto.createHash('sha256').update(verifier).digest()),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    res.redirect(302, `${AUTH_URL}?${params}`);
  })
);

function decodeClaims(idToken) {
  try {
    return JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

async function exchange(code, verifier) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri(),
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });
  const r = await fetch(tokenUrl(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(10000) });
  if (!r.ok) return null;
  const data = await r.json();
  return data && data.id_token ? data.id_token : null;
}

router.get(
  '/callback',
  asyncRoute(async (req, res) => {
    const { code, state, error } = req.query;
    const cookieState = req.cookies ? req.cookies[STATE_COOKIE] : null;
    res.clearCookie(STATE_COOKIE, { ...cookieOptions(), maxAge: undefined });
    if (!isConfigured()) return back(res, 'google_unavailable');
    if (error) return back(res, error === 'access_denied' ? 'google_cancelled' : 'google_failed');
    if (typeof code !== 'string' || typeof state !== 'string' || !cookieState) return back(res, 'google_failed');
    // The state must be the very one this browser was given, and be known, unused and fresh.
    const a = Buffer.from(state);
    const b = Buffer.from(cookieState);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return back(res, 'google_failed');
    const attempt = await db.get('DELETE FROM oauth_attempts WHERE state_hash = ? RETURNING *', [hashToken(state)]);
    if (!attempt || Number(attempt.expires_at) <= Date.now()) return back(res, 'google_failed');

    let claims = null;
    try {
      const idToken = await exchange(code, attempt.code_verifier);
      claims = idToken ? decodeClaims(idToken) : null;
    } catch {
      claims = null;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      !claims ||
      !ISSUERS.includes(claims.iss) ||
      claims.aud !== process.env.GOOGLE_CLIENT_ID ||
      !(Number(claims.exp) > nowSec) ||
      claims.nonce !== attempt.nonce ||
      typeof claims.sub !== 'string' ||
      !claims.sub ||
      typeof claims.email !== 'string'
    ) {
      return back(res, 'google_failed');
    }
    if (claims.email_verified !== true) return back(res, 'google_unverified');
    const email = claims.email.trim().toLowerCase();

    let userId;
    const known = await db.get('SELECT user_id FROM google_identities WHERE google_sub = ?', [claims.sub]);
    if (known) {
      userId = known.user_id;
    } else {
      const existing = await db.get('SELECT id, email_verified FROM users WHERE email = ?', [email]);
      if (existing) {
        // Verified on both sides, or nothing.
        if (!existing.email_verified) return back(res, 'google_link_needs_signin');
        userId = existing.id;
        await db.run('INSERT INTO google_identities (user_id, google_sub, email) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', [userId, claims.sub, email]);
      } else {
        // A password nobody knows: the account is entered through Google, or through "Forgot password".
        const unusable = await hashPassword(crypto.randomBytes(32).toString('hex'));
        const first = String(claims.given_name || claims.name || email.split('@')[0]).trim().slice(0, 60) || 'Friend';
        const last = String(claims.family_name || '').trim().slice(0, 60);
        try {
          await db.tx(async () => {
            const r = await db.run('INSERT INTO users (first_name, last_name, email, phone, password_hash, email_verified) VALUES (?, ?, ?, NULL, ?, 1)', [first, last, email, unusable]);
            userId = r.lastInsertRowid;
            await db.run('INSERT INTO google_identities (user_id, google_sub, email) VALUES (?, ?, ?)', [userId, claims.sub, email]);
          });
        } catch {
          return back(res, 'google_failed');
        }
      }
    }
    const session = await createSession(userId);
    setSessionCookie(res, session);
    back(res, null);
  })
);

module.exports = router;
module.exports.isConfigured = isConfigured;
