/**
 * Inserts sample University of Lahore events.
 *   npm run db:seed            adds sample events only if the events table is empty
 *   npm run db:seed -- --force adds them even if events already exist
 *
 * Uses Turso when TURSO_DATABASE_URL is set in backend/.env, otherwise the local file.
 * No user accounts are seeded — create the first admin with `npm run create-admin`.
 */
const { initFromConfig, closeDatabase, getDb } = require('./db');
const { buildSampleEvents } = require('./sampleEvents');
const EventModel = require('../models/eventModel');

/** Seeds events into an already-open database. Returns the number inserted. */
async function seedEvents({ force = false } = {}) {
  if (!force && (await EventModel.count()) > 0) return 0;
  const events = buildSampleEvents();
  for (const e of events) await EventModel.create(e);
  return events.length;
}

async function main() {
  await initFromConfig();
  console.log(`📦 Using ${getDb().describe()}`);
  const inserted = await seedEvents({ force: process.argv.includes('--force') });
  console.log(
    inserted
      ? `🌱 Seeded ${inserted} sample events.`
      : 'ℹ️  Events already exist — skipped seeding (use `npm run db:seed -- --force` to add anyway).'
  );
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(`❌ ${err.message}`);
      process.exitCode = 1;
    })
    .finally(closeDatabase);
}

module.exports = { seedEvents };
