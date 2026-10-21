// Shared limiter instances for auth-related endpoints. Fixed windows, counted in the database so that every
// running copy of the application shares one count (see ratelimit.js).
const { createLimiter } = require('./ratelimit');

const FIFTEEN_MIN = 15 * 60 * 1000;

const limits = {
  // Failed logins only, per client IP + login identifier (success resets it).
  loginFail: createLimiter({ name: 'loginFail', windowMs: FIFTEEN_MIN, max: 8 }),
  // Every forgot-password request counts, whether or not the account exists,
  // so the limiter can't be used to tell the two apart.
  forgotEmail: createLimiter({ name: 'forgotEmail', windowMs: FIFTEEN_MIN, max: 3 }),
  forgotIp: createLimiter({ name: 'forgotIp', windowMs: FIFTEEN_MIN, max: 20 }),
  // Every signup attempt counts, whether or not the address has an account.
  signupEmail: createLimiter({ name: 'signupEmail', windowMs: FIFTEEN_MIN, max: 3 }),
  signupIp: createLimiter({ name: 'signupIp', windowMs: FIFTEEN_MIN, max: 20 }),
  // Every email-confirmation click, per client IP (the token is 256 bits; this only bounds the noise).
  verifyConfirm: createLimiter({ name: 'verifyConfirm', windowMs: FIFTEEN_MIN, max: 30 }),
  // Resending the confirmation link, per signed-in user.
  verifyResend: createLimiter({ name: 'verifyResend', windowMs: FIFTEEN_MIN, max: 3 }),
  // Circle invitations sent by one person (every request counts).
  inviteEmail: createLimiter({ name: 'inviteEmail', windowMs: 60 * 60 * 1000, max: 20 }),
  // Reflection with the AI: messages and insight requests per person (they cost provider quota).
  reflectionMsg: createLimiter({ name: 'reflectionMsg', windowMs: 10 * 60 * 1000, max: 12 }),
  reflectionDay: createLimiter({ name: 'reflectionDay', windowMs: 24 * 60 * 60 * 1000, max: 120 }),
  reflectionInsights: createLimiter({ name: 'reflectionInsights', windowMs: 60 * 60 * 1000, max: 5 }),
  // Every reset-token check / reset submission, per client IP.
  reset: createLimiter({ name: 'reset', windowMs: FIFTEEN_MIN, max: 15 }),
  // Failed verification-code confirmations, per user (a 6-digit code is
  // otherwise brute-forceable).
  otpConfirm: createLimiter({ name: 'otpConfirm', windowMs: FIFTEEN_MIN, max: 10 }),
  // Failed family-invite-code joins (Hardening 1 / F-03). Only FAILURES count and a
  // success never resets the counter, so an attacker cannot interleave a known-good
  // code to earn fresh attempts. Keyed per user (survives shared/proxied IPs) and
  // per client IP (survives creating many accounts from one address).
  joinFailUser: createLimiter({ name: 'joinFailUser', windowMs: FIFTEEN_MIN, max: 10 }),
  joinFailIp: createLimiter({ name: 'joinFailIp', windowMs: FIFTEEN_MIN, max: 30 }),
};

async function resetAllLimits() {
  for (const l of Object.values(limits)) await l.resetAll();
}

async function tooMany(res, limiter, key) {
  res.set('Retry-After', String(await limiter.retryAfterSeconds(key)));
  return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
}

module.exports = { limits, resetAllLimits, tooMany };
