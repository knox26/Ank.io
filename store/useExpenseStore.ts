import { create } from 'zustand';
import { Expense } from '../types';
import { ExpenseRepository } from '../services/ExpenseRepository';
import { RecurringRepository } from '../services/RecurringRepository';
import { RecurringService } from '../services/RecurringService';
import { useAnalyticsStore } from './useAnalyticsStore';

const PAGE_SIZE = 50;

const deleteExpenseInternal = async (
  set: (partial: Partial<ExpenseState> | ((state: ExpenseState) => Partial<ExpenseState>)) => void,
  id: number,
  label: string
) => {
  try {
    await ExpenseRepository.deleteExpense(id);
    set((state) => {
      const exists = state.expenses.some((e) => e.id === id);
      return {
        expenses: state.expenses.filter((e) => e.id !== id),
        totalCount: exists ? state.totalCount - 1 : state.totalCount,
      };
    });
    void useAnalyticsStore.getState().loadAnalytics();
    return true;
  } catch (error) {
    console.error(`Failed to delete ${label}:`, error);
    return false;
  }
};

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  hasMore: boolean;
  totalCount: number;

  loadExpenses: () => Promise<void>;
  loadMore: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateExpense: (id: number, data: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteExpense: (id: number) => Promise<boolean>;
  deleteExpenseInstance: (id: number) => Promise<boolean>;
  addRecurringExpense: (data: {
    amount: number;
    category_id: number;
    note?: string;
    recurrence_frequency: 'daily' | 'weekly' | 'monthly';
  }) => Promise<boolean>;
  refreshExpenses: () => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  hasMore: true,
  totalCount: 0,

  loadExpenses: async () => {
    // Generate any missed recurring instances before loading
    try {
      await RecurringService.generateMissedInstances();
    } catch (error) {
      console.error('Failed to generate recurring instances:', error);
      // Continue — don't block expense loading on generation failure
    }

    set({ isLoading: true });
    try {
      const [expenses, totalCount] = await Promise.all([
        ExpenseRepository.getExpenses({ limit: PAGE_SIZE }),
        ExpenseRepository.getExpenseCount(),
      ]);
      set({
        expenses,
        totalCount,
        hasMore: expenses.length >= PAGE_SIZE,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load expenses:', error);
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { expenses, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    const lastExpense = expenses[expenses.length - 1];
    if (!lastExpense) return;

    set({ isLoading: true });
    try {
      const moreExpenses = await ExpenseRepository.getExpenses({
        limit: PAGE_SIZE,
        cursor: { date: lastExpense.date, id: lastExpense.id },
      });
      set({
        expenses: [...expenses, ...moreExpenses],
        hasMore: moreExpenses.length >= PAGE_SIZE,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load more expenses:', error);
      set({ isLoading: false });
    }
  },

  addExpense: async (expense) => {
    try {
      const newExpense = await ExpenseRepository.addExpense(expense);
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
        totalCount: state.totalCount + 1,
      }));
      useAnalyticsStore.getState().loadAnalytics();
      return true;
    } catch (error) {
      console.error('Failed to add expense:', error);
      return false;
    }
  },

  updateExpense: async (id, data) => {
    try {
      await ExpenseRepository.updateExpense(id, data);
      set((state) => ({
        expenses: state.expenses.map((e) =>
          e.id === id ? { ...e, ...data } : e
        ),
      }));
      useAnalyticsStore.getState().loadAnalytics();
      return true;
    } catch (error) {
      console.error('Failed to update expense:', error);
      return false;
    }
  },

  deleteExpense: async (id) => {
    return deleteExpenseInternal(set, id, 'expense');
  },

  deleteExpenseInstance: async (id) => {
    return deleteExpenseInternal(set, id, 'expense instance');
  },

  addRecurringExpense: async (data) => {
    try {
      // Create the template
      const today = new Date().toISOString().split('T')[0];
      const template = await RecurringRepository.createTemplate({
        amount: data.amount,
        category_id: data.category_id,
        note: data.note ?? '',
        recurrence_frequency: data.recurrence_frequency,
        is_active: true,
        last_generated_date: today,
      });

      // Create the first instance
      const instance = await ExpenseRepository.addExpenseInstance(
        {
          amount: data.amount,
          category_id: data.category_id,
          date: new Date().toISOString(),
          note: data.note || undefined,
          is_recurring: true,
          recurrence_frequency: data.recurrence_frequency,
        },
        template.id
      );

      // INSERT OR IGNORE returns null on duplicate — no error, just skip
      if (!instance) return false;

      set((state) => ({
        expenses: [instance, ...state.expenses],
        totalCount: state.totalCount + 1,
      }));
      useAnalyticsStore.getState().loadAnalytics();
      return true;
    } catch (error) {
      console.error('Failed to add recurring expense:', error);
      return false;
    }
  },

  refreshExpenses: async () => {
    await get().loadExpenses();
  },
}));
