const { getDb, transaction } = require('../database/db');
const ApiError = require('../utils/ApiError');

const DETAIL_SELECT = `
  SELECT r.id, r.user_id, r.event_id, r.registration_date,
         e.title AS event_title, e.date AS event_date, e.time AS event_time,
         e.location AS event_location, e.category AS event_category,
         e.capacity AS event_capacity, e.image_url AS event_image_url,
         u.name AS student_name, u.email AS student_email
  FROM registrations r
  JOIN events e ON e.id = r.event_id
  JOIN users  u ON u.id = r.user_id
`;

const RegistrationModel = {
  /**
   * Registers a user for an event atomically. Inside one write transaction it
   * checks the event exists, is not in the past, is not already joined and
   * still has a free seat, then inserts. Throws ApiError on any rule failure.
   */
  register(userId, eventId, today) {
    return transaction(async (tx) => {
      const event = await tx.get('SELECT id, date, capacity FROM events WHERE id = ?', [eventId]);
      if (!event) throw ApiError.notFound('Event not found.');
      if (today && event.date < today) {
        throw ApiError.badRequest('Registration is closed — this event has already taken place.');
      }

      const existing = await tx.get('SELECT id FROM registrations WHERE user_id = ? AND event_id = ?', [userId, eventId]);
      if (existing) throw ApiError.conflict('You are already registered for this event.');

      const { n: taken } = await tx.get('SELECT COUNT(*) AS n FROM registrations WHERE event_id = ?', [eventId]);
      if (taken >= event.capacity) throw ApiError.conflict('Sorry, this event is fully booked.');

      const result = await tx.run('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)', [userId, eventId]);
      // Read back through the same transaction (not the shared connection).
      return RegistrationModel.findById(result.lastInsertRowid, tx);
    });
  },

  findById(id, db = getDb()) {
    return db.get(`${DETAIL_SELECT} WHERE r.id = ?`, [id]);
  },

  findByUser(userId) {
    return getDb().all(`${DETAIL_SELECT} WHERE r.user_id = ? ORDER BY e.date ASC, e.time ASC`, [userId]);
  },

  findByUserAndEvent(userId, eventId) {
    return getDb().get('SELECT * FROM registrations WHERE user_id = ? AND event_id = ?', [userId, eventId]);
  },

  /** All registrations, newest first; optionally for one event. */
  findAll({ eventId, limit } = {}) {
    let sql = DETAIL_SELECT;
    const params = [];
    if (eventId) {
      sql += ' WHERE r.event_id = ?';
      params.push(eventId);
    }
    sql += ' ORDER BY r.registration_date DESC, r.id DESC';
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    return getDb().all(sql, params);
  },

  async delete(id) {
    return (await getDb().run('DELETE FROM registrations WHERE id = ?', [id])).changes > 0;
  },

  async count() {
    return (await getDb().get('SELECT COUNT(*) AS n FROM registrations')).n;
  },

  async countForEvent(eventId) {
    return (await getDb().get('SELECT COUNT(*) AS n FROM registrations WHERE event_id = ?', [eventId])).n;
  },
};

module.exports = RegistrationModel;
