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

// A real day of the calendar, written YYYY-MM-DD. "2026-02-31" is not one, although JavaScript would
// quietly read it as the third of March.
function isDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// A date field that may be left empty.
function checkDate(value, field, label) {
  if (value === undefined || value === null || value === '') return;
  if (!isDate(value)) throw new ValidationError(`${label} is not a valid date.`, { [field]: 'Use a real date (YYYY-MM-DD)' });
}

class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
    this.status = 400;
  }
}

module.exports = { isEmail, isPhone, normalizePhone, isNonEmpty, isDate, checkDate, ValidationError };
