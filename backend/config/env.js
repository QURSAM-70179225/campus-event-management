const path = require('path');

// Load backend/.env if present. dotenv is optional so pure-database scripts and
// model tests still run before `npm install` has been executed.
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
} catch {
  /* dotenv not installed — rely on real environment variables */
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

function resolveDbPath(value) {
  if (!value) return path.join(__dirname, '..', 'database', 'campus_events.db');
  if (value === ':memory:') return value;
  return path.isAbsolute(value) ? value : path.join(__dirname, '..', value);
}

const JWT_SECRET = process.env.JWT_SECRET || (isTest ? 'test-only-secret-not-for-production' : '');

const config = {
  NODE_ENV,
  isProduction,
  isTest,
  PORT: Number(process.env.PORT) || 5000,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_PATH: resolveDbPath(process.env.DB_PATH),
  // When set, the app uses this Turso (hosted SQLite) database instead of the local file.
  TURSO_DATABASE_URL: (process.env.TURSO_DATABASE_URL || '').trim(),
  TURSO_AUTH_TOKEN: (process.env.TURSO_AUTH_TOKEN || '').trim(),
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  APP_TIMEZONE: process.env.APP_TIMEZONE || 'Asia/Karachi',
  SEED_SAMPLE_DATA: (process.env.SEED_SAMPLE_DATA || 'false').toLowerCase() === 'true',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || (isTest ? 4 : 10),
};

/** Fails fast when the server would otherwise start in an insecure state. */
function assertServerConfig() {
  if (!config.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set a long random JWT_SECRET.'
    );
  }
  if (config.isProduction && config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
  if (config.TURSO_DATABASE_URL && !config.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing. Create a token in the Turso dashboard.');
  }
}

module.exports = { config, assertServerConfig };
