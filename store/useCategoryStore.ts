import { create } from 'zustand';
import { Category } from '../types';
import { CategoryRepository } from '../services/CategoryRepository';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  /** Map for O(1) category lookup by ID – exposed as readonly to prevent consumer mutation */
  categoryMap: ReadonlyMap<number, Category>;

  // Actions
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  archiveCategory: (id: number) => Promise<boolean>;
  updateBudgetLimit: (id: number, limitCents: number) => Promise<boolean>;
}

function buildCategoryMap(categories: Category[]): Map<number, Category> {
  return new Map(categories.map((c) => [c.id, c]));
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  categoryMap: new Map(),

  loadCategories: async () => {
    set({ isLoading: true });
    try {
      const categories = await CategoryRepository.getActiveCategories();
      set({
        categories,
        categoryMap: buildCategoryMap(categories),
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load categories:', error);
      set({ isLoading: false });
    }
  },

  addCategory: async (category) => {
    try {
      const newCategory = await CategoryRepository.addCategory(category);
      set((state) => {
        const updated = [...state.categories, newCategory];
        return {
          categories: updated,
          categoryMap: buildCategoryMap(updated),
        };
      });
      return true;
    } catch (error) {
      console.error('Failed to add category:', error);
      // Check for unique constraint violation
      const errorMsg = String(error);
      if (errorMsg.includes('UNIQUE') || errorMsg.includes('unique')) {
        // unique constraint violation — handled silently
      }
      return false;
    }
  },

  archiveCategory: async (id) => {
    try {
      await CategoryRepository.archiveCategory(id);
      set((state) => {
        const updated = state.categories.filter((c) => c.id !== id);
        return {
          categories: updated,
          categoryMap: buildCategoryMap(updated),
        };
      });
      return true;
    } catch (error) {
      console.error('Failed to archive category:', error);
      return false;
    }
  },

  updateBudgetLimit: async (id, limitCents) => {
    try {
      await CategoryRepository.updateBudgetLimit(id, limitCents);
      set((state) => {
        const updated = state.categories.map((c) =>
          c.id === id ? { ...c, budget_limit: limitCents } : c
        );
        return {
          categories: updated,
          categoryMap: buildCategoryMap(updated),
        };
      });
      return true;
    } catch (error) {
      console.error('Failed to update budget limit:', error);
      return false;
    }
  },
}));
