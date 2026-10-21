const ApiError = require('../utils/ApiError');
const { config } = require('../config/env');

function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  // SQLite constraint violations that slipped past validation
  if (typeof err.message === 'string' && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: 'This record already exists.' });
  }
  if (typeof err.message === 'string' && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({ error: 'A referenced record does not exist.' });
  }

  if (err instanceof ApiError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  if (!config.isTest) console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Something went wrong on our side. Please try again.',
    ...(config.isProduction ? {} : { debug: err.message }),
  });
}

module.exports = { notFound, errorHandler };
