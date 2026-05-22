import { StatusBar } from 'expo-status-bar';
import { Repeat } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { RecurringExpenseItem } from '../components/RecurringExpenseItem';
import { FilterPanel } from '../components/FilterPanel';
import { EmptyState } from '../components/EmptyState';
import { useRecurringExpenses } from '../hooks/useRecurringExpenses';
import { useExpenseFilters } from '../hooks/useExpenseFilters';
import { useCategoryStore } from '../store/useCategoryStore';
import { Expense } from '../types';

export default function RecurringScreen() {
  const {
    templates,
    isLoading,
    categoryMap,
    currency,
    handleToggle,
    handleDelete,
    onRefresh,
  } = useRecurringExpenses();
  const categories = useCategoryStore((s) => s.categories);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Adapt templates to Expense-like objects so useExpenseFilters can filter by category
  const adapted = useMemo<Expense[]>(
    () =>
      templates.map((t) => ({
        id: t.id,
        amount: t.amount,
        category_id: t.category_id,
        date: t.created_at,
        note: t.note,
        is_recurring: true,
        recurrence_frequency: t.recurrence_frequency,
        recurring_template_id: t.id,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
    [templates]
  );

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
  } = useExpenseFilters(adapted);

  // Map filtered IDs back to the original template objects
  const filteredTemplates = useMemo(() => {
    const ids = new Set(filteredExpenses.map((e) => e.id));
    return templates.filter((t) => ids.has(t.id));
  }, [templates, filteredExpenses]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950" edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="px-4 pt-4 pb-3">
        <Text className="text-xl font-bold text-slate-800 dark:text-white">
          Recurring Expenses
        </Text>
      </View>

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

      <View className="flex-1 px-4 pt-4">
        <FlashList
          data={filteredTemplates}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isLoading}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <RecurringExpenseItem
              item={item}
              category={categoryMap.get(item.category_id ?? -1)}
              currency={currency}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onSwipeDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="mt-20">
                <EmptyState
                  icon={Repeat}
                  title={isFiltering ? 'No matching expenses' : 'No recurring expenses'}
                  subtitle={
                    isFiltering
                      ? 'Try adjusting your filters'
                      : 'Add a recurring expense from the + button'
                  }
                />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}
