import { create } from 'zustand';
import { initDatabase } from '../services/db';
import { useExpenseStore } from './useExpenseStore';
import { useCategoryStore } from './useCategoryStore';
import { useSettingsStore } from './useSettingsStore';
import { useAnalyticsStore } from './useAnalyticsStore';
import { useTemplateStore } from './useTemplateStore';

interface AppState {
  isAppReady: boolean;
  initError: string | null;

  // Actions
  initializeApp: () => Promise<void>;
}

/**
 * App-level store that orchestrates initialization.
 * Initializes the database, then loads all sub-stores in parallel.
 */
export const useAppStore = create<AppState>((set) => ({
  isAppReady: false,
  initError: null,

  initializeApp: async () => {
    try {
      // Step 1: Initialize database (migrations)
      await initDatabase();

      // Step 2: Load all stores in parallel
      await Promise.all([
        useSettingsStore.getState().loadSettings(),
        useCategoryStore.getState().loadCategories(),
        useExpenseStore.getState().loadExpenses(),
        useAnalyticsStore.getState().loadAnalytics(),
        useTemplateStore.getState().loadTemplates(),
      ]);

      set({ isAppReady: true, initError: null });
    } catch (error) {
      console.error('App initialization failed:', error);
      set({
        isAppReady: false,
        initError: `Initialization failed: ${error}`,
      });
    }
  },
}));
