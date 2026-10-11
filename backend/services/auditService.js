import crypto from 'crypto';
import { auditRepository } from '../repositories/auditRepository.js';

export const auditService = {
  async log({ req, action, resourceType, resourceId, details, actorUser = null }) {
    const user = actorUser || (req && req.user ? req.user : null);
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';

    await auditRepository.log({
      id: crypto.randomUUID(),
      actorUserId: user ? user.id : 'ANONYMOUS',
      actorName: user ? user.name : 'Public / Guest',
      role: user ? user.role : 'GUEST',
      action,
      resourceType,
      resourceId,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress: String(ip)
    });
  },

  async getAuditLogs(filters = {}) {
    return await auditRepository.findAll(filters);
  }
};
