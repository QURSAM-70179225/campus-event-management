const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { config } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

/** Builds the Express app. Kept separate from server.js so tests can import it. */
function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs behind Render/Railway proxies (for rate limiting)

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server tools (no Origin header) and configured frontends.
        if (!origin || config.CLIENT_ORIGINS.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '100kb' }));
  if (!config.isTest) app.use(morgan(config.isProduction ? 'combined' : 'dev'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api', require('./routes/authRoutes'));
  app.use('/api', require('./routes/eventRoutes'));
  app.use('/api', require('./routes/registrationRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
