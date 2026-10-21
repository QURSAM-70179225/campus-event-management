const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

/** bcrypt hashing (bcryptjs is a pure-JavaScript bcrypt implementation — no native build on Windows). */
const hashPassword = (plain) => bcrypt.hash(plain, config.BCRYPT_ROUNDS);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Compared against when an email is unknown, so login takes the same time
// whether or not the account exists (avoids leaking which emails are registered).
let dummyHash;
const getDummyHash = () => (dummyHash ||= bcrypt.hashSync('timing-equaliser-password', config.BCRYPT_ROUNDS));

function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

/** Returns the decoded payload or throws (expired / malformed / bad signature). */
function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

module.exports = { hashPassword, verifyPassword, getDummyHash, signToken, verifyToken };
