import { create } from 'zustand';
import { SettingsRepository } from '../services/SettingsRepository';
import { showError } from '../lib/toast';

interface SettingsState {
  currency: string;
  theme: 'light' | 'dark' | 'system';

  // Actions
  loadSettings: () => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: '$',
  theme: 'system',

  loadSettings: async () => {
    try {
      const settings = await SettingsRepository.getAllSettings();
      set({
        currency: settings.currency ?? '$',
        theme: (settings.theme as 'light' | 'dark' | 'system') ?? 'system',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  setCurrency: async (currency) => {
    try {
      await SettingsRepository.setSetting('currency', currency);
      set({ currency });
    } catch (error) {
      console.error('Failed to save currency:', error);
      showError('Save Failed', 'Could not update currency setting.');
    }
  },

  setTheme: async (theme) => {
    try {
      await SettingsRepository.setSetting('theme', theme);
      set({ theme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },
}));
