import { create } from 'zustand';
import { RecurringTemplate } from '../types';
import { RecurringRepository } from '../services/RecurringRepository';
import { useExpenseStore } from './useExpenseStore';

interface RecurringState {
  templates: RecurringTemplate[];
  isLoading: boolean;

  loadTemplates: () => Promise<void>;
  toggleActive: (id: number, currentActive: boolean) => Promise<void>;
  deleteTemplate: (id: number) => Promise<boolean>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  templates: [],
  isLoading: false,

  loadTemplates: async () => {
    set({ isLoading: true });
    try {
      const templates = await RecurringRepository.getAllTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      console.error('Failed to load recurring templates:', error);
      set({ isLoading: false });
    }
  },

  toggleActive: async (id, currentActive) => {
    if (currentActive) {
      await RecurringRepository.deactivateTemplate(id);
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, is_active: false } : t
        ),
      }));
    } else {
      await RecurringRepository.reactivateTemplate(id);
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, is_active: true } : t
        ),
      }));
    }
  },

  deleteTemplate: async (id) => {
    // Optimistic — remove instantly, restore at original index on failure
    const templates = get().templates;
    const deletedIndex = templates.findIndex((t) => t.id === id);
    const deletedTemplate = templates[deletedIndex];
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }));
    try {
      await RecurringRepository.deleteTemplate(id);
      // Refresh expenses + analytics so UI reflects removed instances
      await useExpenseStore.getState().refreshExpenses();
      return true;
    } catch (error) {
      console.error('Failed to delete recurring template:', error);
      if (deletedTemplate && deletedIndex !== -1) {
        set((state) => {
          const next = [...state.templates];
          next.splice(deletedIndex, 0, deletedTemplate);
          return { templates: next };
        });
      }
      return false;
    }
  },
}));
