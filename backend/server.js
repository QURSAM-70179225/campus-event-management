const { config, assertServerConfig } = require('./config/env');
const { initFromConfig, closeDatabase, getDb } = require('./database/db');
const { seedEvents } = require('./database/seed');
const { createApp } = require('./app');

async function start() {
  assertServerConfig();
  await initFromConfig();

  if (config.SEED_SAMPLE_DATA) {
    const inserted = await seedEvents();
    if (inserted) console.log(`🌱 Database was empty — seeded ${inserted} sample events.`);
  }

  const app = createApp();
  const server = app.listen(config.PORT, () => {
    console.log(`🚀 Campus Events API running on http://localhost:${config.PORT}`);
    console.log(`   Database: ${getDb().describe()}`);
    console.log(`   Allowed frontend origin(s): ${config.CLIENT_ORIGINS.join(', ')}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down.`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error(`❌ Failed to start: ${err.message}`);
  process.exit(1);
});
