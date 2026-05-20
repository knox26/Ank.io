import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency, formatCurrencyCompact } from '../lib/currency';
import { getCurrentMonthName } from '../lib/date';
import { showError } from '../lib/toast';
import { showThemedConfirm } from '../lib/confirm';
import { exportDatabase } from '../services/export';
import { useCategoryStore } from '../store/useCategoryStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { Category, Expense } from '../types';

export function useHomeScreenData() {
  const router = useRouter();
  const { colors } = useTheme();

  const expenses = useExpenseStore((s) => s.expenses);
  const expensesLoading = useExpenseStore((s) => s.isLoading);
  const refreshExpenses = useExpenseStore((s) => s.refreshExpenses);
  const categories = useCategoryStore((s) => s.categories);
  const categoriesLoading = useCategoryStore((s) => s.isLoading);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const archiveCategory = useCategoryStore((s) => s.archiveCategory);
  const currency = useSettingsStore((s) => s.currency);
  const categorySpends = useAnalyticsStore((s) => s.categorySpends);

  const [refreshing, setRefreshing] = useState(false);

  const onDeleteCategory = useCallback(
    (id: number, name: string) => {
      showThemedConfirm({
        title: 'Delete Category',
        message: `Are you sure you want to delete "${name}"? Existing expenses for this category will be kept.`,
        confirmText: 'Delete',
        confirmStyle: 'destructive',
        onConfirm: () => archiveCategory(id),
      });
    },
    [archiveCategory]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadCategories(),
      refreshExpenses(),
      useAnalyticsStore.getState().loadAnalytics(),
    ]);
    setRefreshing(false);
  }, [loadCategories, refreshExpenses]);

  const handleExport = useCallback(async () => {
    const result = await exportDatabase();
    if (!result.success) {
      showError('Export Failed', result.error);
    }
  }, []);

  const { categorySpendMap, totalSpent } = useMemo(() => {
    const map = new Map<number, number>();
    let total = 0;
    for (const { category_id, total: spent } of categorySpends) {
      if (category_id !== null) {
        map.set(category_id, spent);
      }
      total += spent;
    }
    return { categorySpendMap: map, totalSpent: total };
  }, [categorySpends]);

  const totalBudget = useMemo(
    () => categories.reduce((sum, c) => sum + c.budget_limit, 0),
    [categories]
  );

  const progress = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const progressPercent = progress * 100;

  const currentMonthName = getCurrentMonthName();

  const showSkeleton = expensesLoading && expenses.length === 0 && categoriesLoading;

  return {
    router,
    colors,
    expenses,
    expensesLoading,
    categories,
    categoriesLoading,
    currency,
    refreshing,
    categorySpendMap,
    totalSpent,
    totalBudget,
    progressPercent,
    currentMonthName,
    onDeleteCategory,
    onRefresh,
    handleExport,
    showSkeleton,
  };
}
