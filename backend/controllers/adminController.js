const ApiError = require('../utils/ApiError');
const EventModel = require('../models/eventModel');
const RegistrationModel = require('../models/registrationModel');
const UserModel = require('../models/userModel');
const { parseId } = require('../utils/validators');
const { todayISO } = require('../utils/date');

/** GET /api/admin/stats */
async function stats(_req, res) {
  const today = todayISO();
  const [
    totalEvents,
    upcomingEvents,
    totalStudents,
    totalAdmins,
    totalRegistrations,
    totalCapacity,
    categories,
    popularEvents,
    recentRegistrations,
  ] = await Promise.all([
    EventModel.count(),
    EventModel.countUpcoming(today),
    UserModel.countByRole('student'),
    UserModel.countByRole('admin'),
    RegistrationModel.count(),
    EventModel.totalCapacity(),
    EventModel.countsByCategory(),
    EventModel.findAll({ sort: 'popular', limit: 5, when: 'upcoming', today }),
    RegistrationModel.findAll({ limit: 8 }),
  ]);
  res.json({
    totalEvents,
    upcomingEvents,
    totalStudents,
    totalAdmins,
    totalRegistrations,
    totalCapacity,
    occupancyRate: totalCapacity ? Math.round((totalRegistrations / totalCapacity) * 1000) / 10 : 0,
    categories,
    popularEvents,
    recentRegistrations,
  });
}

/** GET /api/admin/registrations?event_id= — full details, optionally for one event. */
async function registrations(req, res) {
  let eventId;
  let event = null;
  if (req.query.event_id !== undefined) {
    eventId = parseId(req.query.event_id);
    if (!eventId) throw ApiError.badRequest('event_id must be a positive integer.');
    event = await EventModel.findById(eventId);
    if (!event) throw ApiError.notFound('Event not found.');
  }
  const list = await RegistrationModel.findAll({ eventId });
  res.json({ event, registrations: list, count: list.length });
}

module.exports = { stats, registrations };
