import { create } from 'zustand';
import { Expense } from '../types';
import { ExpenseRepository } from '../services/ExpenseRepository';
import { showError } from '../lib/toast';
import { useAnalyticsStore } from './useAnalyticsStore';

const PAGE_SIZE = 50;

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  hasMore: boolean;
  totalCount: number;

  // Actions
  loadExpenses: () => Promise<void>;
  loadMore: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  deleteExpense: (id: number) => Promise<boolean>;
  refreshExpenses: () => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  hasMore: true,
  totalCount: 0,

  loadExpenses: async () => {
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
      showError('Load Failed', 'Could not load expenses. Please restart the app.');
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { expenses, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    // Build cursor from the last loaded expense
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
      // Prepend to the list (newest first) and update count
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
        totalCount: state.totalCount + 1,
      }));
      // Refresh analytics so charts reflect the new expense immediately
      useAnalyticsStore.getState().loadAnalytics();
      return true;
    } catch (error) {
      console.error('Failed to add expense:', error);
      showError('Save Failed', 'Could not save the expense. Please try again.');
      return false;
    }
  },

  deleteExpense: async (id) => {
    try {
      await ExpenseRepository.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        totalCount: state.totalCount - 1,
      }));
      // Refresh analytics so charts reflect the deletion immediately
      useAnalyticsStore.getState().loadAnalytics();
      return true;
    } catch (error) {
      console.error('Failed to delete expense:', error);
      showError('Delete Failed', 'Could not delete the expense. Please try again.');
      return false;
    }
  },

  refreshExpenses: async () => {
    // Full reload — used for pull-to-refresh
    await get().loadExpenses();
  },
}));
