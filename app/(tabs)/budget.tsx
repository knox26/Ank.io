import React, { useEffect } from 'react';
import { AccessibilityInfo, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetSkeleton } from '../../components/Skeleton';
import { CategoryBudgetRow } from '../../components/CategoryBudgetRow';
import { CurrencySelector } from '../../components/CurrencySelector';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { useBudgetScreen } from '../../hooks/useBudgetScreen';

const TAB_BAR_HEIGHT = 50;

function BudgetScreenContent() {
  const {
    categories,
    categoriesLoading,
    currency,
    isDark,
    handleEdit,
    setCurrency,
  } = useBudgetScreen();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (categoriesLoading && categories.length === 0) {
      AccessibilityInfo.announceForAccessibility('Loading budgets');
    }
  }, [categoriesLoading, categories.length]);

  if (categoriesLoading && categories.length === 0) {
    return (
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <BudgetSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24,
        }}
      >
        <View className="py-4 space-y-4">
          <CurrencySelector
            currency={currency}
            onSelect={setCurrency}
            isDark={isDark}
          />

          <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4">
            <Text className="text-blue-700 dark:text-blue-300">
              Set monthly budget limits for each category to track your spending
              progress.
            </Text>
          </View>
        </View>

        {categories.map((cat) => (
          <CategoryBudgetRow
            key={cat.id}
            category={cat}
            currency={currency}
            onPress={handleEdit}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function BudgetScreen() {
  return (
    <ScreenErrorBoundary fallbackTitle="Could not load budget settings">
      <BudgetScreenContent />
    </ScreenErrorBoundary>
  );
}
