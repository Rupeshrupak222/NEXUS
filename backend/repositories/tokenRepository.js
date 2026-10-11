import db from '../database/db.js';

export const tokenRepository = {
  // Activation Tokens
  async createActivationToken({ id, userId, tokenHash, expiresAt }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO account_activation_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, tokenHash, expiresAt, now);
  },

  async findValidActivationToken(tokenHash) {
    const now = new Date().toISOString();
    return await db.prepare(`
      SELECT t.*, u.email, u.name, u.status as user_status
      FROM account_activation_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > ?
    `).get(tokenHash, now);
  },

  async markActivationTokenUsed(id) {
    const now = new Date().toISOString();
    await db.prepare('UPDATE account_activation_tokens SET used_at = ? WHERE id = ?').run(now, id);
  },

  // Password Reset Tokens
  async createResetToken({ id, userId, tokenHash, expiresAt }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, tokenHash, expiresAt, now);
  },

  async findValidResetToken(tokenHash) {
    const now = new Date().toISOString();
    return await db.prepare(`
      SELECT t.*, u.email, u.name
      FROM password_reset_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > ?
    `).get(tokenHash, now);
  },

  async markResetTokenUsed(id) {
    const now = new Date().toISOString();
    await db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').run(now, id);
  },

  // Email outbox
  async saveEmailOutbox({ id, toEmail, subject, templateName, htmlBody }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO email_outbox (id, to_email, subject, template_name, html_body, status, sent_at)
      VALUES (?, ?, ?, ?, ?, 'SENT', ?)
    `).run(id, toEmail, subject, templateName, htmlBody, now);
  },

  async getEmailOutbox(limit = 20) {
    return await db.prepare('SELECT * FROM email_outbox ORDER BY sent_at DESC LIMIT ?').all(limit);
  }
};
