import React, { useMemo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Inbox } from 'lucide-react-native';
import { ExpenseItem } from '../../components/ExpenseItem';
import { FilterPanel } from '../../components/FilterPanel';
import { EmptyState } from '../../components/EmptyState';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { ExpensesSkeleton } from '../../components/Skeleton';
import { useExpenseFilters } from '../../hooks/useExpenseFilters';
import { getLocalDateString, formatDisplayDate } from '../../lib/date';
import { showConfirm } from '../../lib/toast';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Expense, ExpenseListItem } from '../../types';

function ExpensesScreenContent() {
  const expenses = useExpenseStore((s) => s.expenses);
  const expensesLoading = useExpenseStore((s) => s.isLoading);
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const categories = useCategoryStore((s) => s.categories);
  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);

  const {
    selectedCategoryId,
    startDateStr,
    endDateStr,
    showFilters,
    showStartPicker,
    showEndPicker,
    isFiltering,
    filteredExpenses,
    setSelectedCategoryId,
    setShowFilters,
    setShowStartPicker,
    setShowEndPicker,
    clearFilters,
    onStartChange,
    onEndChange,
  } = useExpenseFilters(expenses);

  // Group by date and build flat list — fully memoized
  const flatData = useMemo(() => {
    const grouped: Record<string, Expense[]> = {};

    for (const expense of filteredExpenses) {
      const date = getLocalDateString(expense.date);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(expense);
    }

    const data: ExpenseListItem[] = [];
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    for (const date of sortedDates) {
      data.push({
        type: 'header',
        id: `header-${date}`,
        title: formatDisplayDate(date),
      });
      for (const expense of grouped[date]) {
        data.push({ type: 'item', ...expense });
      }
    }

    return data;
  }, [filteredExpenses]);

  const handleDelete = useCallback(
    (id: number) => {
      showConfirm(
        'Delete Expense',
        'Are you sure you want to delete this expense?',
        () => deleteExpense(id),
        'Delete',
        'destructive'
      );
    },
    [deleteExpense]
  );

  const renderItem = useCallback(
    ({ item }: { item: ExpenseListItem }) => {
      if (item.type === 'header') {
        return (
          <Text className="text-gray-500 dark:text-gray-400 font-bold mb-2 mt-2 uppercase text-xs">
            {item.title}
          </Text>
        );
      }

      const category = categoryMap.get(item.category_id ?? -1);
      return (
        <ExpenseItem
          item={item}
          category={category}
          currency={currency}
          onDelete={handleDelete}
        />
      );
    },
    [categoryMap, currency, handleDelete]
  );

  const keyExtractor = useCallback(
    (item: ExpenseListItem) =>
      item.type === 'header' ? item.id : item.id.toString(),
    []
  );

  const getItemType = useCallback(
    (item: ExpenseListItem) => item.type,
    []
  );

  // Show skeleton on initial load (placed AFTER all hooks to respect Rules of Hooks)
  if (expensesLoading && expenses.length === 0) {
    return <ExpensesSkeleton />;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <FilterPanel
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        startDateStr={startDateStr}
        endDateStr={endDateStr}
        showFilters={showFilters}
        showStartPicker={showStartPicker}
        showEndPicker={showEndPicker}
        isFiltering={isFiltering}
        onCategorySelect={setSelectedCategoryId}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onShowStartPicker={() => setShowStartPicker(true)}
        onShowEndPicker={() => setShowEndPicker(true)}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        onClearFilters={clearFilters}
      />

      <View className="flex-1 mb-2 mt-4 px-4 w-full h-full">
        <FlashList<ExpenseListItem>
          data={flatData}
          showsVerticalScrollIndicator={false}
          getItemType={getItemType}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon={Inbox}
              title="No expenses found"
              subtitle={
                isFiltering
                  ? 'Try adjusting your filters'
                  : 'Tap + to add your first expense'
              }
            />
          }
        />
      </View>
    </View>
  );
}

export default function ExpensesScreen() {
  return (
    <ScreenErrorBoundary fallbackTitle="Could not load expenses">
      <ExpensesScreenContent />
    </ScreenErrorBoundary>
  );
}
