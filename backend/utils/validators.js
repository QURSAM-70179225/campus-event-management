/**
 * Input validation helpers. Each validator returns { value, errors } where
 * `value` is the cleaned payload and `errors` maps field names to messages.
 */

const CATEGORIES = [
  'Seminars',
  'Workshops',
  'Sports',
  'Competitions',
  'Conferences',
  'Student Society Activities',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Positive integer id from a route param or body field, or null. */
function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function validateSignup(body = {}) {
  const errors = {};
  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : undefined;

  if (name.length < 2 || name.length > 100) errors.name = 'Name must be 2–100 characters.';
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
  if (password.length < 8 || password.length > 72) {
    errors.password = 'Password must be 8–72 characters.';
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return { value: { name, email, password }, errors };
}

function validateLogin(body = {}) {
  const errors = {};
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return { value: { email, password }, errors };
}

/**
 * Validates an event payload. With `partial: true` (used by PUT) only the
 * supplied fields are validated; omitted fields keep their current values.
 */
function validateEvent(body = {}, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('title')) {
    value.title = str(body.title);
    if (value.title.length < 3 || value.title.length > 150) errors.title = 'Title must be 3–150 characters.';
  }
  if (!partial || has('description')) {
    value.description = str(body.description);
    if (value.description.length < 10 || value.description.length > 5000) {
      errors.description = 'Description must be 10–5000 characters.';
    }
  }
  if (!partial || has('date')) {
    value.date = str(body.date);
    if (!isValidDate(value.date)) errors.date = 'Date must be a valid date in YYYY-MM-DD format.';
  }
  if (!partial || has('time')) {
    value.time = str(body.time);
    if (!TIME_RE.test(value.time)) errors.time = 'Time must be in 24-hour HH:MM format.';
  }
  if (!partial || has('location')) {
    value.location = str(body.location);
    if (value.location.length < 2 || value.location.length > 200) errors.location = 'Location must be 2–200 characters.';
  }
  if (!partial || has('category')) {
    value.category = str(body.category);
    if (!CATEGORIES.includes(value.category)) errors.category = `Category must be one of: ${CATEGORIES.join(', ')}.`;
  }
  if (!partial || has('capacity')) {
    value.capacity = Number(body.capacity);
    if (!Number.isInteger(value.capacity) || value.capacity < 1 || value.capacity > 100000) {
      errors.capacity = 'Capacity must be a whole number between 1 and 100000.';
    }
  }
  if (has('image_url') || !partial) {
    const url = str(body.image_url);
    value.image_url = url || null;
    if (url && (!isHttpUrl(url) || url.length > 2000)) errors.image_url = 'Image URL must be a valid http(s) URL.';
  }

  if (partial && Object.keys(value).length === 0) {
    errors._ = 'Provide at least one field to update.';
  }
  return { value, errors };
}

const hasErrors = (errors) => Object.keys(errors).length > 0;

module.exports = {
  CATEGORIES,
  parseId,
  isValidDate,
  validateSignup,
  validateLogin,
  validateEvent,
  hasErrors,
};
