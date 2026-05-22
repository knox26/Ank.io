import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useSafeBottomPadding } from '../../hooks/useSafeBottomPadding';
import { FlashList } from '@shopify/flash-list';
import { Inbox } from 'lucide-react-native';
import { ExpenseItem } from '../../components/ExpenseItem';
import { FilterPanel } from '../../components/FilterPanel';
import { EmptyState } from '../../components/EmptyState';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { ExpensesSkeleton } from '../../components/Skeleton';
import { useExpenseFilters } from '../../hooks/useExpenseFilters';
import { useGroupedExpenses } from '../../hooks/useGroupedExpenses';
import { showThemedConfirm } from '../../lib/confirm';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Expense, ExpenseListItem } from '../../types';

function ExpensesScreenContent() {
  const bottomPadding = useSafeBottomPadding(100);
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

  const flatData = useGroupedExpenses(filteredExpenses);

  const handleDelete = useCallback(
    (expense: Expense) => {
      showThemedConfirm({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense?',
        confirmText: 'Delete',
        confirmStyle: 'destructive',
        onConfirm: () => deleteExpense(expense.id),
      });
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
          onSwipeDelete={handleDelete}
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
          contentContainerStyle={{ paddingBottom: bottomPadding }}
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
