import db from '../database/db.js';

export const settingsRepository = {
  async getAll() {
    const rows = await db.prepare('SELECT * FROM platform_settings').all();
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });
    return settings;
  },

  async get(key) {
    const row = await db.prepare('SELECT value FROM platform_settings WHERE key = ?').get(key);
    return row ? row.value : null;
  },

  async set(key, value) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO platform_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
    `).run(key, String(value), now);
  },

  async updateMultiple(settingsObj) {
    const now = new Date().toISOString();
    for (const [key, val] of Object.entries(settingsObj)) {
      await db.prepare(`
        INSERT INTO platform_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
      `).run(key, String(val), now);
    }
  }
};
