const ApiError = require('../utils/ApiError');
const RegistrationModel = require('../models/registrationModel');
const EventModel = require('../models/eventModel');
const { parseId } = require('../utils/validators');
const { todayISO } = require('../utils/date');

/** POST /api/register { event_id } — students only. */
async function register(req, res) {
  const eventId = parseId(req.body?.event_id ?? req.body?.eventId);
  if (!eventId) throw ApiError.badRequest('event_id is required.', { event_id: 'A valid event id is required.' });

  const registration = await RegistrationModel.register(req.user.id, eventId, todayISO());
  const event = await EventModel.findById(eventId);
  res.status(201).json({
    message: `You're registered for "${event.title}"!`,
    registration,
    event,
  });
}

/** GET /api/my-registrations — the logged-in user's registrations with event details. */
async function myRegistrations(req, res) {
  const today = todayISO();
  const registrations = (await RegistrationModel.findByUser(req.user.id)).map((r) => ({
    ...r,
    status: r.event_date < today ? 'attended' : 'confirmed',
  }));
  res.json({ registrations, count: registrations.length });
}

/**
 * GET /api/registrations — role-aware:
 *   student → their own registrations
 *   admin   → every registration (optional ?event_id= filter)
 */
async function listRegistrations(req, res) {
  if (req.user.role !== 'admin') return myRegistrations(req, res);

  let eventId;
  if (req.query.event_id !== undefined) {
    eventId = parseId(req.query.event_id);
    if (!eventId) throw ApiError.badRequest('event_id must be a positive integer.');
  }
  const registrations = await RegistrationModel.findAll({ eventId });
  res.json({ registrations, count: registrations.length });
}

/** DELETE /api/registrations/:id — owner (student) or any admin. */
async function cancelRegistration(req, res) {
  const id = parseId(req.params.id);
  if (!id) throw ApiError.badRequest('Registration id must be a positive integer.');

  const registration = await RegistrationModel.findById(id);
  if (!registration) throw ApiError.notFound('Registration not found.');

  const isOwner = registration.user_id === req.user.id;
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden('You can only cancel your own registrations.');
  if (isOwner && req.user.role !== 'admin' && registration.event_date < todayISO()) {
    throw ApiError.badRequest('Past event registrations cannot be cancelled.');
  }

  await RegistrationModel.delete(id);
  res.json({
    message: `Registration for "${registration.event_title}" was cancelled.`,
    event: await EventModel.findById(registration.event_id),
  });
}

module.exports = { register, myRegistrations, listRegistrations, cancelRegistration };
