// Shared limiter instances for auth-related endpoints (Phase 8.2). Fixed
// windows, in-memory — see ratelimit.js for the honest limits of that design.
const { createLimiter } = require('./ratelimit');

const FIFTEEN_MIN = 15 * 60 * 1000;

const limits = {
  // Failed logins only, per client IP + login identifier (success resets it).
  loginFail: createLimiter({ windowMs: FIFTEEN_MIN, max: 8 }),
  // Every forgot-password request counts, whether or not the account exists,
  // so the limiter can't be used to tell the two apart.
  forgotEmail: createLimiter({ windowMs: FIFTEEN_MIN, max: 3 }),
  forgotIp: createLimiter({ windowMs: FIFTEEN_MIN, max: 20 }),
  // Every reset-token check / reset submission, per client IP.
  reset: createLimiter({ windowMs: FIFTEEN_MIN, max: 15 }),
  // Failed verification-code confirmations, per user (a 6-digit code is
  // otherwise brute-forceable).
  otpConfirm: createLimiter({ windowMs: FIFTEEN_MIN, max: 10 }),
  // Failed family-invite-code joins (Hardening 1 / F-03). Only FAILURES count and a
  // success never resets the counter, so an attacker cannot interleave a known-good
  // code to earn fresh attempts. Keyed per user (survives shared/proxied IPs) and
  // per client IP (survives creating many accounts from one address).
  joinFailUser: createLimiter({ windowMs: FIFTEEN_MIN, max: 10 }),
  joinFailIp: createLimiter({ windowMs: FIFTEEN_MIN, max: 30 }),
};

function resetAllLimits() {
  for (const l of Object.values(limits)) l.resetAll();
}

function tooMany(res, limiter, key) {
  res.set('Retry-After', String(limiter.retryAfterSeconds(key)));
  return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
}

module.exports = { limits, resetAllLimits, tooMany };
