import { useRouter } from 'expo-router';
import { Download } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryGridItem } from '../../components/CategoryGridItem';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { HomeSkeleton } from '../../components/Skeleton';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency, formatCurrencyCompact } from '../../lib/currency';
import { getCurrentMonthRange } from '../../lib/date';
import { showConfirm, showError, showSuccess } from '../../lib/toast';
import { exportDatabase } from '../../services/db';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useSettingsStore } from '../../store/useSettingsStore';

function HomeScreenContent() {
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

  const [refreshing, setRefreshing] = useState(false);

  const onDeleteCategory = useCallback(
    (id: number, name: string) => {
      showConfirm(
        'Delete Category',
        `Are you sure you want to delete "${name}"? Existing expenses for this category will be kept.`,
        () => archiveCategory(id),
        'Delete',
        'destructive'
      );
    },
    [archiveCategory]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), refreshExpenses()]);
    setRefreshing(false);
  }, [loadCategories, refreshExpenses]);

  const handleExport = useCallback(async () => {
    const result = await exportDatabase();
    if (!result.success) {
      showError('Export Failed', result.error);
    }
  }, []);

  // Calculate this month's totals from in-memory expenses (already paginated)
  const { thisMonthExpenses, totalSpent } = useMemo(() => {
    const range = getCurrentMonthRange();
    const currentExpenses = expenses.filter((e) => {
      return e.date >= range.start && e.date < range.end;
    });
    const sum = currentExpenses.reduce((acc, e) => acc + e.amount, 0);
    return { thisMonthExpenses: currentExpenses, totalSpent: sum };
  }, [expenses]);

  // Budget progress
  const totalBudget = useMemo(
    () => categories.reduce((sum, c) => sum + c.budget_limit, 0),
    [categories]
  );
  const progress = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const progressPercent = Math.min(progress * 100, 100);

  const currentMonthName = useMemo(
    () => new Date().toLocaleString('default', { month: 'long' }),
    []
  );

  // Show skeleton on initial load (placed AFTER all hooks to respect Rules of Hooks)
  if (expensesLoading && expenses.length === 0 && categoriesLoading) {
    return <HomeSkeleton />;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <View className="p-4 space-y-6">
        {/* Total Spent Card */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
            Total Spent ({currentMonthName})
          </Text>
          <Text
            className="text-4xl font-bold text-slate-900 dark:text-white mt-2"
            accessibilityLabel={`Total spent this month: ${formatCurrency(totalSpent, currency)}`}
          >
            {formatCurrency(totalSpent, currency)}
          </Text>

          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Budget Progress
              </Text>
              <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {Math.round(progressPercent)}%
              </Text>
            </View>
            <View className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  progressPercent > 100 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
              Limit: {formatCurrency(totalBudget, currency)}
            </Text>
          </View>
        </View>

        <View className="flex-row space-x-2 mt-2 gap-2">
          {/* Add New Category Button */}
          <TouchableOpacity
            onPress={() => router.push('/add-category')}
            className="flex-1 bg-gray-100 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Add new category"
          >
            <Text className="text-slate-900 dark:text-white font-medium">
              + Category
            </Text>
          </TouchableOpacity>

          {/* Export DB Button */}
          <TouchableOpacity
            onPress={handleExport}
            className="flex-1 bg-gray-100 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 items-center justify-center flex-row"
            accessibilityRole="button"
            accessibilityLabel="Export database backup"
          >
            <Download size={16} color={colors.text} className="mr-2" />
            <Text className="text-slate-900 dark:text-white font-medium ml-2">
              Export Backup
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-bold text-slate-800 dark:text-white mt-4">
          Categories
        </Text>
      </View>

      {/* Categories Grid - Scrollable */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          paddingTop: 8,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        <View className="flex-row flex-wrap justify-between">
          {categories.map((cat) => {
            const catSpent = thisMonthExpenses
              .filter((e) => e.category_id === cat.id)
              .reduce((sum, e) => sum + e.amount, 0);

            return (
              <CategoryGridItem
                key={cat.id}
                category={cat}
                spentAmount={catSpent}
                currency={currency}
                onDeleteCategory={onDeleteCategory}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScreenErrorBoundary fallbackTitle="Could not load home screen">
      <HomeScreenContent />
    </ScreenErrorBoundary>
  );
}
