import db from '../database/db.js';

export const notificationRepository = {
  async findByUser(userId) {
    return await db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);
  },

  async getUnreadCount(userId) {
    const row = await db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId);
    return row ? row.count : 0;
  },

  async create({ id, userId, title, message, type = 'INFO', link = null }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, userId, title, message, type, link, now);
    return await db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  },

  async markAsRead(id, userId) {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  },

  async markAllAsRead(userId) {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  }
};
