import db from '../database/db.js';

export const userRepository = {
  async findById(id) {
    return await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  async findByEmail(email) {
    return await db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  },

  async create({ id, name, email, passwordHash, role, status = 'ACTIVE', emailVerified = 1 }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, status, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email, passwordHash, role, status, emailVerified ? 1 : 0, now, now);
    return await this.findById(id);
  },

  async updatePassword(id, passwordHash) {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE users SET password_hash = ?, status = 'ACTIVE', email_verified = 1, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, now, id);
    return await this.findById(id);
  },

  async updateStatus(id, status) {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE users SET status = ?, updated_at = ? WHERE id = ?
    `).run(status, now, id);
    return await this.findById(id);
  },

  async updateProfile(id, { name }) {
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE users SET name = ?, updated_at = ? WHERE id = ?
    `).run(name, now, id);
    return await this.findById(id);
  },

  async updateLastLogin(id) {
    const now = new Date().toISOString();
    await db.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`).run(now, id);
  }
};
