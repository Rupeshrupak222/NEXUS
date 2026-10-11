import db from '../database/db.js';

export const auditRepository = {
  async log({ id, actorUserId, actorName, role, action, resourceType, resourceId, details, ipAddress }) {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, actor_name, role, action, resource_type, resource_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, actorUserId || 'SYSTEM', actorName || 'System Process', role || 'SYSTEM', action, resourceType, resourceId || null, details || null, ipAddress || '127.0.0.1', now);
  },

  async findAll({ limit = 50, action = '', resourceType = '' }) {
    let whereClauses = [];
    let params = [];

    if (action) {
      whereClauses.push('action = ?');
      params.push(action);
    }
    if (resourceType) {
      whereClauses.push('resource_type = ?');
      params.push(resourceType);
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    return await db.prepare(`
      SELECT * FROM audit_logs
      ${whereSql}
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(...params, limit);
  }
};
