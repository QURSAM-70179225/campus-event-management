const { getDb, transaction } = require('../database/db');

// Every event row is returned with its live registration count and remaining seats.
const SELECT_WITH_SEATS = `
  SELECT e.*,
         COUNT(r.id)                AS registered_count,
         e.capacity - COUNT(r.id)   AS available_seats
  FROM events e
  LEFT JOIN registrations r ON r.event_id = e.id
`;

const SORTS = {
  date_asc: 'e.date ASC, e.time ASC',
  date_desc: 'e.date DESC, e.time DESC',
  popular: 'registered_count DESC, e.date ASC',
  newest: 'e.created_at DESC, e.id DESC',
};

const UPDATABLE = ['title', 'description', 'date', 'time', 'location', 'category', 'capacity', 'image_url'];

const EventModel = {
  /**
   * @param {object} opts
   * @param {string} [opts.search]   case-insensitive match on title
   * @param {string} [opts.category] exact category
   * @param {'upcoming'|'past'} [opts.when]
   * @param {string} [opts.today]    YYYY-MM-DD used for upcoming/past
   * @param {string} [opts.sort]     date_asc | date_desc | popular | newest
   * @param {number} [opts.limit]
   */
  findAll({ search, category, when, today, sort = 'date_asc', limit } = {}) {
    const where = [];
    const params = [];
    if (search) {
      where.push("e.title LIKE ? ESCAPE '\\'");
      params.push(`%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    }
    if (category) {
      where.push('e.category = ?');
      params.push(category);
    }
    if (when === 'upcoming') {
      where.push('e.date >= ?');
      params.push(today);
    } else if (when === 'past') {
      where.push('e.date < ?');
      params.push(today);
    }

    let sql = SELECT_WITH_SEATS;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ` GROUP BY e.id ORDER BY ${SORTS[sort] || SORTS.date_asc}`;
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    return getDb().all(sql, params);
  },

  findById(id, db = getDb()) {
    return db.get(`${SELECT_WITH_SEATS} WHERE e.id = ? GROUP BY e.id`, [id]);
  },

  async create(data) {
    const result = await getDb().run(
      `INSERT INTO events (title, description, date, time, location, category, capacity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.description, data.date, data.time, data.location, data.category, data.capacity, data.image_url ?? null]
    );
    return EventModel.findById(result.lastInsertRowid);
  },

  /** Updates only the provided columns (whitelisted). */
  async update(id, data) {
    const keys = Object.keys(data).filter((k) => UPDATABLE.includes(k));
    if (keys.length) {
      const sets = keys.map((k) => `${k} = ?`).join(', ');
      await getDb().run(`UPDATE events SET ${sets} WHERE id = ?`, [...keys.map((k) => data[k]), id]);
    }
    return EventModel.findById(id);
  },

  /**
   * Deletes an event and its registrations together. The schema also has
   * ON DELETE CASCADE; deleting explicitly keeps the behaviour identical on
   * hosts where foreign-key enforcement is configured differently.
   */
  delete(id) {
    return transaction(async (tx) => {
      await tx.run('DELETE FROM registrations WHERE event_id = ?', [id]);
      const result = await tx.run('DELETE FROM events WHERE id = ?', [id]);
      return result.changes > 0;
    });
  },

  async count() {
    return (await getDb().get('SELECT COUNT(*) AS n FROM events')).n;
  },

  async countUpcoming(today) {
    return (await getDb().get('SELECT COUNT(*) AS n FROM events WHERE date >= ?', [today])).n;
  },

  countsByCategory() {
    return getDb().all(
      `SELECT e.category, COUNT(DISTINCT e.id) AS events, COUNT(r.id) AS registrations
       FROM events e LEFT JOIN registrations r ON r.event_id = e.id
       GROUP BY e.category ORDER BY e.category`
    );
  },

  async totalCapacity() {
    return (await getDb().get('SELECT COALESCE(SUM(capacity), 0) AS n FROM events')).n;
  },
};

module.exports = EventModel;
