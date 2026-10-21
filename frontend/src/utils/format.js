/** Parses 'YYYY-MM-DD' as a local calendar date (no timezone shift). */
export function parseDate(isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Local Date for an event's date + 'HH:MM' time. */
export function eventDateTime(event) {
  const d = parseDate(event.date);
  const [h, min] = String(event.time || '00:00').split(':').map(Number);
  d.setHours(h || 0, min || 0, 0, 0);
  return d;
}

export const formatDate = (isoDate, opts = {}) =>
  parseDate(isoDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  });

export const formatLongDate = (isoDate) =>
  parseDate(isoDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function formatTime(time) {
  const [h, m] = String(time).split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** SQLite datetime('now') values are UTC 'YYYY-MM-DD HH:MM:SS'. */
export function formatTimestamp(value) {
  if (!value) return '';
  const d = new Date(`${value.replace(' ', 'T')}Z`);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const isPast = (event) => event.date < todayISO();

export const plural = (n, word, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;
