const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts +38344123456, 044123456, (044) 123-456, etc. Normalizes to digits w/ optional leading +.
const PHONE_CLEAN_RE = /[^\d+]/g;

function isEmail(v) {
  return typeof v === 'string' && EMAIL_RE.test(v.trim());
}

function normalizePhone(v) {
  if (typeof v !== 'string') return '';
  let cleaned = v.trim().replace(PHONE_CLEAN_RE, '');
  return cleaned;
}

function isPhone(v) {
  const cleaned = normalizePhone(v);
  return cleaned.length >= 7 && cleaned.length <= 16;
}

function isNonEmpty(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.status = 400;
  }
}

module.exports = { isEmail, isPhone, normalizePhone, isNonEmpty, ValidationError };
