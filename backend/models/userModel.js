const { getDb } = require('../database/db');

const PUBLIC_FIELDS = 'id, name, email, role, created_at';

const UserModel = {
  async create({ name, email, passwordHash, role = 'student' }) {
    const result = await getDb().run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
      name,
      email.toLowerCase(),
      passwordHash,
      role,
    ]);
    return UserModel.findById(result.lastInsertRowid);
  },

  findById(id, db = getDb()) {
    return db.get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [id]);
  },

  /** Includes password_hash — only for authentication. */
  findByEmailWithHash(email) {
    return getDb().get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  },

  async emailExists(email) {
    return Boolean(await getDb().get('SELECT 1 AS found FROM users WHERE email = ?', [email.toLowerCase()]));
  },

  async setRole(id, role) {
    await getDb().run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return UserModel.findById(id);
  },

  async updatePassword(id, passwordHash) {
    await getDb().run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  },

  async countByRole(role) {
    return (await getDb().get('SELECT COUNT(*) AS n FROM users WHERE role = ?', [role])).n;
  },
};

module.exports = UserModel;
