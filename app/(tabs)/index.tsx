import React from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList, Download, Repeat } from 'lucide-react-native';
import { CategoryGridItem } from '../../components/CategoryGridItem';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { HomeSkeleton } from '../../components/Skeleton';
import { TotalSpentCard } from '../../components/TotalSpentCard';
import { useHomeScreenData } from '../../hooks/useHomeScreenData';

function HomeScreenContent() {
  const insets = useSafeAreaInsets();
  const {
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
  } = useHomeScreenData();

  if (showSkeleton) {
    return <HomeSkeleton />;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <View className="p-4 space-y-6">
        <TotalSpentCard
          totalSpent={totalSpent}
          totalBudget={totalBudget}
          currency={currency}
          currentMonthName={currentMonthName}
          progressPercent={progressPercent}
        />

        <View className="flex-row space-x-2 mt-2 gap-2">
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

        <TouchableOpacity
          onPress={() => router.push('/recurring')}
          className="bg-gray-100 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 items-center justify-center flex-row mt-2"
          accessibilityRole="button"
          accessibilityLabel="View recurring expenses"
        >
          <Repeat size={16} color={colors.text} className="mr-2" />
          <Text className="text-slate-900 dark:text-white font-medium ml-2">
            Recurring Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/templates' as any)}
          className="bg-gray-100 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 items-center justify-center flex-row mt-2"
          accessibilityRole="button"
          accessibilityLabel="View expense templates"
        >
          <ClipboardList size={16} color={colors.text} className="mr-2" />
          <Text className="text-slate-900 dark:text-white font-medium ml-2">
            Expense Templates
          </Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-slate-800 dark:text-white mt-4">
          Categories
        </Text>
      </View>

      {/* Categories Grid - Scrollable */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
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
          {categories.map((cat) => (
            <CategoryGridItem
              key={cat.id}
              category={cat}
              spentAmount={categorySpendMap.get(cat.id) ?? 0}
              currency={currency}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
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
