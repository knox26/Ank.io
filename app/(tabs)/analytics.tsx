import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeBottomPadding } from '../../hooks/useSafeBottomPadding';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { AnalyticsSkeleton } from '../../components/Skeleton';
import { SpendingPieChart } from '../../components/SpendingPieChart';
import { MonthlyTrendChart } from '../../components/MonthlyTrendChart';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';

function AnalyticsScreenContent() {
  const bottomPadding = useSafeBottomPadding(120);
  const {
    isLoading,
    isDark,
    colors,
    screenWidth,
    currency,
    currentMonthName,
    pieData,
    pieTotalCents,
    barData,
    categorySpends,
  } = useAnalyticsData();

  if (isLoading && categorySpends.length === 0) {
    return <AnalyticsSkeleton />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      contentContainerStyle={{ paddingBottom: bottomPadding }}
    >
      <View className="p-4 space-y-6">
        <SpendingPieChart
          pieData={pieData}
          pieTotalCents={pieTotalCents}
          currency={currency}
          isDark={isDark}
          currentMonthName={currentMonthName}
        />

        <View className="mt-4">
          <MonthlyTrendChart
            barData={barData}
            screenWidth={screenWidth}
            textMutedColor={colors.textMuted}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default function AnalyticsScreen() {
  return (
    <ScreenErrorBoundary fallbackTitle="Could not load analytics">
      <AnalyticsScreenContent />
    </ScreenErrorBoundary>
  );
}
