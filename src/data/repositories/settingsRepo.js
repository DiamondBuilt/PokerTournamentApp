import { db } from '../db';

const SETTINGS_KEY = 'app';

export const DEFAULT_SETTINGS = {
  defaultBuyIn: 100,
  defaultTheme: 'dark',
  notificationsEnabled: true,
  soundEnabled: true,
  activeSeasonId: null,
  lastBackupAt: null,
};

/**
 * Key-value settings stored as a single row keyed `app`, so future settings
 * groups can be added without a schema migration.
 */
export const settingsRepo = {
  async get() {
    const row = await db.settings.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(row?.value || {}) };
  },

  async patch(partial) {
    const current = await settingsRepo.get();
    const value = { ...current, ...partial };
    await db.settings.put({ key: SETTINGS_KEY, value });
    return value;
  },

  /** Replace the whole settings value (used by backup import). */
  async replace(value) {
    const merged = { ...DEFAULT_SETTINGS, ...(value || {}) };
    await db.settings.put({ key: SETTINGS_KEY, value: merged });
    return merged;
  },
};
