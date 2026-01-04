import { create } from 'zustand';
import { dbRequest, initDatabase } from '../services/db';
import { Category, Expense } from '../types';

interface State {
  categories: Category[];
  expenses: Expense[];
  isLoading: boolean;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  initializeApp: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  archiveCategory: (id: number) => Promise<void>;
  toggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrency: (currency: string) => Promise<void>;
}

export const useStore = create<State>((set, get) => ({
  categories: [],
  expenses: [],
  isLoading: true,
  currency: '$',
  theme: 'system',

  initializeApp: async () => {
    await initDatabase();
    
    // Load currency from settings
    try {
      const settings = await dbRequest.getAllAsync<{ key: string, value: string }>('SELECT * FROM settings');
      const currencySetting = settings.find(s => s.key === 'currency');
      if (currencySetting) {
        set({ currency: currencySetting.value });
      }
    } catch (e) {
      console.error('Failed to load currency setting', e);
    }

    await get().loadCategories();
    await get().loadExpenses();
    set({ isLoading: false });
  },

  loadCategories: async () => {
    try {
      const result = await dbRequest.getAllAsync<Category>('SELECT * FROM categories WHERE is_archived = 0');
      set({ categories: result });
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  },

  loadExpenses: async () => {
     try {
      const result = await dbRequest.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC');
      set({ expenses: result });
    } catch (error) {
       console.error('Failed to load expenses', error);
    }
  },

  addExpense: async (expense) => {
    try {
      const { amount, category_id, date, note, is_recurring } = expense;
      const result = await dbRequest.runAsync(
        'INSERT INTO expenses (amount, category_id, date, note, is_recurring) VALUES (?, ?, ?, ?, ?)',
        amount, category_id, date, note ?? '', is_recurring ? 1 : 0
      );
      // Optimistic update or reload
      const newExpense = { ...expense, id: result.lastInsertRowId } as Expense;
      set(state => ({ expenses: [newExpense, ...state.expenses] }));
    } catch (error) {
      console.error('Failed to add expense', error);
    }
  },

  deleteExpense: async (id) => {
      try {
          await dbRequest.runAsync('DELETE FROM expenses WHERE id = ?', id);
          set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
      } catch (error) {
          console.error('Failed to delete expense', error);
      }
  },

  addCategory: async (category) => {
      try {
          const { name, icon, color, budget_limit, is_archived } = category;
          const result = await dbRequest.runAsync(
              'INSERT INTO categories (name, icon, color, budget_limit, is_archived) VALUES (?, ?, ?, ?, ?)',
              name, icon, color, budget_limit, is_archived ? 1 : 0
          );
          const newCategory = { ...category, id: result.lastInsertRowId } as Category;
          set(state => ({ categories: [...state.categories, newCategory] }));
      } catch (error) {
          console.error('Failed to add category', error);
      }
  },

  archiveCategory: async (id) => {
      try {
          await dbRequest.runAsync('UPDATE categories SET is_archived = 1 WHERE id = ?', id);
          set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
      } catch (error) {
          console.error('Failed to archive category', error);
      }
  },
  
  toggleTheme: (theme) => {
      set({ theme });
      // TODO: Persist theme preference in DB settings if needed
  },

  setCurrency: async (currency) => {
      try {
          await dbRequest.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'currency', currency);
          set({ currency });
      } catch (error) {
          console.error('Failed to save currency', error);
      }
  }
}));
