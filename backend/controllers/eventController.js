const ApiError = require('../utils/ApiError');
const EventModel = require('../models/eventModel');
const RegistrationModel = require('../models/registrationModel');
const UserModel = require('../models/userModel');
const { CATEGORIES, parseId, validateEvent, hasErrors } = require('../utils/validators');
const { todayISO } = require('../utils/date');

async function requireEvent(idParam) {
  const id = parseId(idParam);
  if (!id) throw ApiError.badRequest('Event id must be a positive integer.');
  const event = await EventModel.findById(id);
  if (!event) throw ApiError.notFound('Event not found.');
  return event;
}

/** GET /api/events?search=&category=&when=upcoming|past&sort=date_asc|date_desc|popular|newest&limit= */
async function listEvents(req, res) {
  const { search, category, when, sort } = req.query;
  const errors = {};

  if (category && !CATEGORIES.includes(category)) errors.category = 'Unknown category.';
  if (when && !['upcoming', 'past', 'all'].includes(when)) errors.when = 'when must be upcoming, past or all.';
  if (sort && !['date_asc', 'date_desc', 'popular', 'newest'].includes(sort)) errors.sort = 'Invalid sort option.';
  let limit;
  if (req.query.limit !== undefined) {
    limit = parseId(req.query.limit);
    if (!limit || limit > 100) errors.limit = 'limit must be between 1 and 100.';
  }
  if (hasErrors(errors)) throw ApiError.badRequest('Invalid query parameters.', errors);

  const events = await EventModel.findAll({
    search: typeof search === 'string' ? search.trim().slice(0, 100) : undefined,
    category,
    when: when === 'all' ? undefined : when,
    today: todayISO(),
    sort,
    limit,
  });
  res.json({ events, count: events.length });
}

/** GET /api/events/:id — includes the caller's registration if logged in. */
async function getEvent(req, res) {
  const event = await requireEvent(req.params.id);
  const today = todayISO();
  let registration = null;
  if (req.user) registration = await RegistrationModel.findByUserAndEvent(req.user.id, event.id);
  res.json({
    event: { ...event, is_past: event.date < today },
    registration,
    is_registered: Boolean(registration),
  });
}

/** POST /api/events (admin) */
async function createEvent(req, res) {
  const { value, errors } = validateEvent(req.body);
  if (hasErrors(errors)) throw ApiError.badRequest('Please fix the highlighted fields.', errors);
  const event = await EventModel.create(value);
  res.status(201).json({ message: 'Event created successfully.', event });
}

/** PUT /api/events/:id (admin) — partial updates allowed. */
async function updateEvent(req, res) {
  const existing = await requireEvent(req.params.id);
  const { value, errors } = validateEvent(req.body, { partial: true });
  if (hasErrors(errors)) throw ApiError.badRequest('Please fix the highlighted fields.', errors);

  if (value.capacity !== undefined && value.capacity < existing.registered_count) {
    throw ApiError.conflict(
      `Capacity cannot be lower than the ${existing.registered_count} students already registered.`
    );
  }
  const event = await EventModel.update(existing.id, value);
  res.json({ message: 'Event updated successfully.', event });
}

/** DELETE /api/events/:id (admin) — its registrations are deleted in the same transaction. */
async function deleteEvent(req, res) {
  const event = await requireEvent(req.params.id);
  await EventModel.delete(event.id);
  res.json({ message: `"${event.title}" was deleted.`, removedRegistrations: event.registered_count });
}

/** GET /api/stats — public numbers for the home page. */
async function publicStats(_req, res) {
  const today = todayISO();
  const [totalEvents, upcomingEvents, totalRegistrations, totalStudents, categories] = await Promise.all([
    EventModel.count(),
    EventModel.countUpcoming(today),
    RegistrationModel.count(),
    UserModel.countByRole('student'),
    EventModel.countsByCategory(),
  ]);
  res.json({ totalEvents, upcomingEvents, totalRegistrations, totalStudents, categories });
}

/** GET /api/categories */
function listCategories(_req, res) {
  res.json({ categories: CATEGORIES });
}

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent, publicStats, listCategories, requireEvent };
