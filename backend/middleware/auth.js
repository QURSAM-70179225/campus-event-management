const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/auth');
const UserModel = require('../models/userModel');

function readBearer(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/**
 * Loads the user from the token. The user is re-read from the database so a
 * deleted account or changed role takes effect immediately.
 */
async function resolveUser(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid authentication token.'
    );
  }
  const user = await UserModel.findById(Number(payload.sub));
  if (!user) throw ApiError.unauthorized('Account no longer exists.');
  return user;
}

/** Requires a valid JWT; sets req.user. */
async function authenticate(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next(ApiError.unauthorized('Please log in to continue.'));
  try {
    req.user = await resolveUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Sets req.user when a valid token is present, but never blocks the request. */
async function optionalAuth(req, _res, next) {
  const token = readBearer(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

/** Role-based authorization. Use after `authenticate`. */
const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

module.exports = { authenticate, optionalAuth, requireRole };
