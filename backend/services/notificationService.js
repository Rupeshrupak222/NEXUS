import crypto from 'crypto';
import { notificationRepository } from '../repositories/notificationRepository.js';

export const notificationService = {
  async getUserNotifications(userId) {
    const list = await notificationRepository.findByUser(userId);
    const unreadCount = await notificationRepository.getUnreadCount(userId);
    return {
      notifications: list,
      unreadCount
    };
  },

  async markAsRead(id, userId) {
    await notificationRepository.markAsRead(id, userId);
    return { success: true };
  },

  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { success: true };
  },

  async createNotification({ userId, title, message, type = 'INFO', link = null }) {
    return await notificationRepository.create({
      id: crypto.randomUUID(),
      userId,
      title,
      message,
      type,
      link
    });
  }
};
