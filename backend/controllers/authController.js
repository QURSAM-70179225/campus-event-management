const ApiError = require('../utils/ApiError');
const UserModel = require('../models/userModel');
const { validateSignup, validateLogin, hasErrors } = require('../utils/validators');
const { hashPassword, verifyPassword, signToken, getDummyHash } = require('../utils/auth');

/** POST /api/signup — always creates a *student* account. */
async function signup(req, res) {
  const { value, errors } = validateSignup(req.body);
  if (hasErrors(errors)) throw ApiError.badRequest('Please fix the highlighted fields.', errors);

  if (await UserModel.emailExists(value.email)) {
    throw new ApiError(409, 'An account with this email already exists.', { email: 'Email is already registered.' });
  }

  const passwordHash = await hashPassword(value.password);
  const user = await UserModel.create({ name: value.name, email: value.email, passwordHash, role: 'student' });
  res.status(201).json({ message: 'Account created successfully.', token: signToken(user), user });
}

/** POST /api/login */
async function login(req, res) {
  const { value, errors } = validateLogin(req.body);
  if (hasErrors(errors)) throw ApiError.badRequest('Please fix the highlighted fields.', errors);

  const record = await UserModel.findByEmailWithHash(value.email);
  const ok = await verifyPassword(value.password, record ? record.password_hash : getDummyHash());
  if (!record || !ok) throw ApiError.unauthorized('Incorrect email or password.');

  const user = await UserModel.findById(record.id);
  res.json({ message: `Welcome back, ${user.name}!`, token: signToken(user), user });
}

/** GET /api/me */
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, me };
