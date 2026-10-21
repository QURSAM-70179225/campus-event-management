const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateSignupForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Enter your full name (at least 2 characters).';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (password.length > 72) errors.password = 'Use 72 characters or fewer.';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Include at least one letter and one number.';
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

/** 0–4 score used for the password strength bar. */
export function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function validateEventForm(values) {
  const errors = {};
  if (values.title.trim().length < 3) errors.title = 'Title must be at least 3 characters.';
  if (values.description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
  if (!values.date) errors.date = 'Choose a date.';
  if (!values.time) errors.time = 'Choose a start time.';
  if (values.location.trim().length < 2) errors.location = 'Enter the venue.';
  if (!values.category) errors.category = 'Choose a category.';
  const cap = Number(values.capacity);
  if (!Number.isInteger(cap) || cap < 1) errors.capacity = 'Capacity must be a whole number of at least 1.';
  if (values.image_url.trim()) {
    try {
      const u = new URL(values.image_url.trim());
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
    } catch {
      errors.image_url = 'Enter a full image URL starting with https://';
    }
  }
  return errors;
}
