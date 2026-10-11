import { settingsRepository } from '../repositories/settingsRepository.js';
import { auditService } from './auditService.js';

export const settingsService = {
  async getSettings() {
    return await settingsRepository.getAll();
  },

  async updateSettings(newSettings, adminUser, req = null) {
    await settingsRepository.updateMultiple(newSettings);

    await auditService.log({
      req,
      action: 'PLATFORM_SETTINGS_UPDATED',
      resourceType: 'SETTINGS',
      resourceId: 'GLOBAL',
      details: newSettings,
      actorUser: adminUser
    });

    return await settingsRepository.getAll();
  }
};
