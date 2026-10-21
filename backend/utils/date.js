const { config } = require('../config/env');

/** Today's date as YYYY-MM-DD in the university's timezone (default Asia/Karachi). */
function todayISO(timeZone = config.APP_TIMEZONE) {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Adds `days` to a YYYY-MM-DD string and returns a YYYY-MM-DD string. */
function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

module.exports = { todayISO, addDays };
