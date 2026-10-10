// Family invite codes (Hardening 1 / F-03).
//
// 12 characters from a 32-symbol alphabet = 60 bits from crypto.randomBytes.
// The alphabet leaves out 0/O/1/I so a code read aloud or typed by hand is not
// mistaken; it is all upper-case because the join route upper-cases input.
// Codes are secrets: they are never derived from ids, dates or names, and are
// never written to logs or activity entries.
//
// Codes issued before Hardening 1 (8 hex characters) remain valid until their
// owner regenerates them; the join throttle (authLimits.joinFail*) is what makes
// guessing those impractical.
const crypto = require('crypto');

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 symbols
const LENGTH = 12;

function generateInviteCode() {
  // 32 divides 256, so `byte % 32` has no modulo bias.
  const bytes = crypto.randomBytes(LENGTH);
  let out = '';
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// Codes that follow the old predictable demo pattern ("DEMO" + 4 digits).
function isWeakDemoCode(code) {
  return typeof code === 'string' && /^DEMO\d{4}$/.test(code);
}

module.exports = { generateInviteCode, isWeakDemoCode, INVITE_CODE_LENGTH: LENGTH };
