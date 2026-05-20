import { create } from 'zustand';
import { SettingsRepository } from '../services/SettingsRepository';

interface SettingsState {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  templateHintDismissed: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  dismissTemplateHint: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: '$',
  theme: 'system',
  templateHintDismissed: true,

  loadSettings: async () => {
    try {
      const settings = await SettingsRepository.getAllSettings();
      set({
        currency: settings.currency ?? '$',
        theme: (settings.theme as 'light' | 'dark' | 'system') ?? 'system',
        templateHintDismissed: settings.template_hint_dismissed === '1',
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

  dismissTemplateHint: async () => {
    try {
      await SettingsRepository.setSetting('template_hint_dismissed', '1');
      set({ templateHintDismissed: true });
    } catch (error) {
      console.error('Failed to dismiss template hint:', error);
    }
  },
}));
