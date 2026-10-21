/**
 * Database access layer with two interchangeable backends:
 *
 *   • Local   — a SQLite file via Node's built-in `node:sqlite` (default; used on your laptop and in tests)
 *   • Turso   — hosted SQLite (libSQL) via `@libsql/client`, used when TURSO_DATABASE_URL is set.
 *               This is how the free deployment keeps its data: Render's free filesystem is wiped
 *               on every restart, but the data lives in Turso.
 *
 * Both expose the same promise-based API:
 *   db.all(sql, params)  → array of row objects
 *   db.get(sql, params)  → first row object or null
 *   db.run(sql, params)  → { changes, lastInsertRowid }
 *   db.exec(sql)         → runs several statements (schema)
 *   db.transaction(async (tx) => { ... })  — tx has all/get/run; commits or rolls back
 */
const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
let adapter = null;

/* ------------------------------------------------------------------ */
/* Local SQLite file (node:sqlite)                                      */
/* ------------------------------------------------------------------ */

function loadNodeSqlite() {
  try {
    return require('node:sqlite');
  } catch {
    throw new Error(
      `The local database uses Node's built-in SQLite (node:sqlite), which needs Node.js 22.13 or newer. ` +
        `You are running ${process.version}. Install the current Node.js LTS from https://nodejs.org.`
    );
  }
}

function createLocalAdapter(dbPath) {
  const { DatabaseSync } = loadNodeSqlite();
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const conn = new DatabaseSync(dbPath);
  conn.exec('PRAGMA foreign_keys = ON;');
  conn.exec('PRAGMA busy_timeout = 5000;');
  if (dbPath !== ':memory:') conn.exec('PRAGMA journal_mode = WAL;');

  const ops = {
    all: (sql, params = []) => conn.prepare(sql).all(...params),
    get: (sql, params = []) => conn.prepare(sql).get(...params) ?? null,
    run: (sql, params = []) => {
      const r = conn.prepare(sql).run(...params);
      return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
    },
  };

  // There is one connection, and a transaction contains `await`s. Running every
  // operation through a queue stops another request's query from slipping into an
  // open transaction. Each operation is synchronous and fast, so queuing costs nothing.
  let queue = Promise.resolve();
  const serial = (fn) => {
    const result = queue.then(fn);
    queue = result.catch(() => {});
    return result;
  };
  const txOps = {
    all: async (sql, params) => ops.all(sql, params),
    get: async (sql, params) => ops.get(sql, params),
    run: async (sql, params) => ops.run(sql, params),
  };

  return {
    kind: 'local',
    describe: () => (dbPath === ':memory:' ? 'in-memory SQLite' : `SQLite file ${dbPath}`),
    all: (sql, params) => serial(() => ops.all(sql, params)),
    get: (sql, params) => serial(() => ops.get(sql, params)),
    run: (sql, params) => serial(() => ops.run(sql, params)),
    exec: (sql) => serial(() => conn.exec(sql)),
    transaction: (fn) =>
      serial(async () => {
        // BEGIN IMMEDIATE takes the write lock before any check runs.
        conn.exec('BEGIN IMMEDIATE');
        try {
          const result = await fn(txOps);
          conn.exec('COMMIT');
          return result;
        } catch (err) {
          conn.exec('ROLLBACK');
          throw err;
        }
      }),
    close: async () => conn.close(),
  };
}

/* ------------------------------------------------------------------ */
/* Turso (libSQL over HTTPS)                                            */
/* ------------------------------------------------------------------ */

const isBusy = (err) => /SQLITE_BUSY|database is locked/i.test(`${err?.code ?? ''} ${err?.message ?? ''}`);

function createRemoteAdapter(url, authToken) {
  // The /web build talks to Turso over HTTPS using fetch — no native modules needed.
  const { createClient } = require('@libsql/client/web');
  const client = createClient({ url, authToken });

  // libSQL returns rows as array-like objects; convert them to plain { column: value } objects.
  const toRows = (rs) => rs.rows.map((row) => Object.fromEntries(rs.columns.map((col, i) => [col, row[i]])));
  const makeOps = (execute) => ({
    all: async (sql, args = []) => toRows(await execute({ sql, args })),
    get: async (sql, args = []) => toRows(await execute({ sql, args }))[0] ?? null,
    run: async (sql, args = []) => {
      const rs = await execute({ sql, args });
      return {
        changes: rs.rowsAffected,
        lastInsertRowid: rs.lastInsertRowid === undefined ? undefined : Number(rs.lastInsertRowid),
      };
    },
  });

  return {
    kind: 'turso',
    describe: () => `Turso database ${new URL(url.replace(/^libsql:/, 'https:')).host}`,
    ...makeOps((stmt) => client.execute(stmt)),
    exec: (sql) => client.executeMultiple(sql),
    transaction: async (fn) => {
      // 'write' mode starts with BEGIN IMMEDIATE on the server, so the capacity
      // check and the insert can't interleave with another writer. If another
      // write holds the lock, the whole transaction is retried after a short wait
      // (it was rolled back, so re-running it is safe).
      for (let attempt = 1; ; attempt++) {
        let tx;
        try {
          tx = await client.transaction('write');
          const result = await fn(makeOps((stmt) => tx.execute(stmt)));
          await tx.commit();
          return result;
        } catch (err) {
          if (tx) await tx.rollback().catch(() => {});
          if (isBusy(err) && attempt < 8) {
            await new Promise((r) => setTimeout(r, 40 * attempt + Math.random() * 40));
            continue;
          }
          throw err;
        } finally {
          tx?.close();
        }
      }
    },
    close: async () => client.close(),
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

function readSchema({ withPragmas }) {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  // PRAGMA lines are connection settings; Turso manages its own.
  return withPragmas ? sql : sql.replace(/^\s*PRAGMA[^;]*;\s*$/gim, '');
}

/**
 * Opens the database and makes sure the tables exist.
 * @param {{ url?: string, authToken?: string, dbPath?: string }} target
 *   `url` (Turso) wins over `dbPath` (local file or ':memory:').
 */
async function initDatabase({ url, authToken, dbPath } = {}) {
  if (adapter) return adapter;
  const next = url ? createRemoteAdapter(url, authToken) : createLocalAdapter(dbPath || ':memory:');
  await next.exec(readSchema({ withPragmas: next.kind === 'local' }));
  adapter = next;
  return adapter;
}

/** Opens the database configured in backend/.env. */
function initFromConfig() {
  const { config } = require('../config/env');
  return initDatabase({ url: config.TURSO_DATABASE_URL, authToken: config.TURSO_AUTH_TOKEN, dbPath: config.DB_PATH });
}

function getDb() {
  if (!adapter) throw new Error('Database not initialised. Call initDatabase() first.');
  return adapter;
}

function transaction(fn) {
  return getDb().transaction(fn);
}

async function closeDatabase() {
  if (adapter) {
    const current = adapter;
    adapter = null;
    await current.close();
  }
}

module.exports = { initDatabase, initFromConfig, getDb, transaction, closeDatabase };
