// Small, dependency-free validation helpers.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (value) =>
  typeof value === 'string' && value.length <= 320 && EMAIL_PATTERN.test(value.trim());

export const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// A valid password: at least 8 characters, not absurdly long.
export const isValidPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && value.length <= 200;

// A finite, non-negative number within an inclusive range.
export const numberInRange = (value, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
};

// Returns { ok, value } for a numeric form field, coercing strings.
export const parseNumber = (value, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    return { ok: false };
  }
  return { ok: true, value: n };
};
