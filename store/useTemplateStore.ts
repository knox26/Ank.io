import { create } from 'zustand';
import { ExpenseTemplate } from '../types';
import { TemplateRepository } from '../services/TemplateRepository';
import { syncWidgetCache } from '../modules/expo-quick-expense';

interface TemplateState {
  templates: ExpenseTemplate[];
  isLoading: boolean;

  loadTemplates: () => Promise<void>;
  addTemplate: (data: Omit<ExpenseTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<ExpenseTemplate | null>;
  updateTemplate: (id: number, data: Partial<Omit<ExpenseTemplate, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteTemplate: (id: number) => Promise<boolean>;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  isLoading: false,

  loadTemplates: async () => {
    set({ isLoading: true });
    try {
      const templates = await TemplateRepository.getAllTemplates();
      set({ templates, isLoading: false });
    } catch (error) {
      console.error('Failed to load expense templates:', error);
      set({ isLoading: false });
    }
  },

  addTemplate: async (data) => {
    try {
      const template = await TemplateRepository.createTemplate(data);
      set((state) => ({ templates: [template, ...state.templates] }));
      syncWidgetCache();
      return template;
    } catch (error) {
      console.error('Failed to add expense template:', error);
      return null;
    }
  },

  updateTemplate: async (id, data) => {
    try {
      await TemplateRepository.updateTemplate(id, data);
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, ...data } : t
        ),
      }));
      syncWidgetCache();
      return true;
    } catch (error) {
      console.error('Failed to update expense template:', error);
      return false;
    }
  },

  deleteTemplate: async (id) => {
    try {
      await TemplateRepository.deleteTemplate(id);
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));
      syncWidgetCache();
      return true;
    } catch (error) {
      console.error('Failed to delete expense template:', error);
      return false;
    }
  },
}));
