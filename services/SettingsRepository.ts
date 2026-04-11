import { db } from './db';

/**
 * Repository for app settings stored in the `settings` key-value table.
 * All settings access should go through this — never raw SQL from the store.
 */
export const SettingsRepository = {
  async getSetting(key: string): Promise<string | null> {
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      key
    );
    return result?.value ?? null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      key,
      value
    );
  },

  async getAllSettings(): Promise<Record<string, string>> {
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT * FROM settings'
    );
    return rows.reduce(
      (acc, row) => {
        acc[row.key] = row.value;
        return acc;
      },
      {} as Record<string, string>
    );
  },

  async deleteSetting(key: string): Promise<void> {
    await db.runAsync('DELETE FROM settings WHERE key = ?', key);
  },
};
