/**
 * Creates the database tables.
 *   npm run db:init     create tables if they don't exist
 *   npm run db:reset    DELETE ALL DATA, recreate the tables and seed sample events
 *
 * Works on the local SQLite file, or on Turso when TURSO_DATABASE_URL is set in backend/.env.
 */
const { initFromConfig, closeDatabase, getDb } = require('./db');

const DROP_ALL = `
  DROP TABLE IF EXISTS registrations;
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS users;
`;

async function main() {
  const reset = process.argv.includes('--reset');
  await initFromConfig();
  const db = getDb();
  console.log(`📦 Using ${db.describe()}`);

  if (reset) {
    await db.exec(DROP_ALL);
    // Re-open so the schema is applied to the now-empty database.
    await closeDatabase();
    await initFromConfig();
    console.log('🗑️  All tables dropped and recreated.');
  }

  const tables = (
    await getDb().all("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%' ORDER BY name")
  ).map((t) => t.name);
  console.log(`✅ Database ready. Tables: ${tables.join(', ')}`);
}

main()
  .catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
