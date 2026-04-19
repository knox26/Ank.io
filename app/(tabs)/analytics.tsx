import React, { useMemo } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { BarChart3 } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { AnalyticsSkeleton } from '../../components/Skeleton';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrencyCompact, centsToDollars } from '../../lib/currency';
import { getCurrentMonthRange } from '../../lib/date';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';

function AnalyticsScreenContent() {
  const expenses = useExpenseStore((s) => s.expenses);
  const expensesLoading = useExpenseStore((s) => s.isLoading);
  const categories = useCategoryStore((s) => s.categories);
  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);
  const { isDark, colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const currentMonthName = useMemo(
    () => new Date().toLocaleString('default', { month: 'long' }),
    []
  );

  const { pieData, barData } = useMemo(() => {
    // --- Pie Chart: Category Distribution (This Month) ---
    const range = getCurrentMonthRange();
    const thisMonthExpenses = expenses.filter(
      (e) => e.date >= range.start && e.date < range.end
    );

    const categoryTotals: Record<number, number> = {};
    for (const e of thisMonthExpenses) {
      if (e.category_id !== null) {
        categoryTotals[e.category_id] =
          (categoryTotals[e.category_id] || 0) + e.amount;
      }
    }

    const calculatedPieData = Object.entries(categoryTotals)
      .map(([catIdStr, totalCents]) => {
        const id = parseInt(catIdStr, 10);
        const category = categoryMap.get(id);
        return {
          value: centsToDollars(totalCents),
          color: category?.color ?? '#cbd5e1',
          label: category?.name ?? 'Other',
          amountStr: formatCurrencyCompact(totalCents, currency),
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // --- Bar Chart: Monthly Trend (Last 6 Months) ---
    const calculatedBarData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });

      // Build date range for this month
      const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
      const monthEnd = new Date(year, month + 1, 1).toISOString().split('T')[0];

      const monthlyTotal = expenses
        .filter((e) => e.date >= monthStart && e.date < monthEnd)
        .reduce((sum, e) => sum + e.amount, 0);

      calculatedBarData.push({
        value: centsToDollars(monthlyTotal),
        label: monthName,
        frontColor: '#3b82f6',
      });
    }

    return { pieData: calculatedPieData, barData: calculatedBarData };
  }, [expenses, categoryMap, currency]);

  // Show skeleton on initial load (placed AFTER all hooks to respect Rules of Hooks)
  if (expensesLoading && expenses.length === 0) {
    return <AnalyticsSkeleton />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <View className="p-3 space-y-6">
        {/* Pie Chart Section */}
        <View className="bg-white dark:bg-slate-100/5 p-4 pl-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 items-center">
          <Text className="text-lg font-bold text-slate-800 dark:text-white mb-4 w-full">
            Spending by Category ({currentMonthName})
          </Text>
          {pieData.length > 0 ? (
            <View className="items-center w-full">
              <View className="items-center justify-center h-[200px] w-full">
                <PieChart
                  data={pieData}
                  donut
                  showGradient
                  sectionAutoFocus
                  radius={90}
                  innerRadius={65}
                  innerCircleColor={isDark ? '#0f172a' : '#fff'}
                  centerLabelComponent={() => {
                    const totalCents = pieData.reduce(
                      (sum, d) => sum + Math.round(d.value * 100),
                      0
                    );
                    return (
                      <View className="justify-center items-center">
                        <Text className="text-xl font-extrabold text-slate-800 dark:text-white">
                          {formatCurrencyCompact(totalCents, currency)}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
                          Total
                        </Text>
                      </View>
                    );
                  }}
                />
              </View>

              <View className="flex-row flex-wrap justify-start w-full mt-2">
                {pieData.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center mb-2 mr-2 bg-gray-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-gray-100 dark:border-white/5"
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: item.color,
                        marginRight: 8,
                      }}
                    />
                    <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {item.label}{' '}
                      <Text className="font-bold text-slate-900 dark:text-white">
                        ({item.amountStr})
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No data for this month"
              subtitle="Add some expenses to see your spending breakdown"
            />
          )}
        </View>

        {/* Bar Chart Section */}
        <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mt-4">
          <Text className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            Monthly Trend (Last 6 Months)
          </Text>
          <View className="items-center overflow-hidden">
            <BarChart
              data={barData}
              barWidth={22}
              noOfSections={4}
              barBorderRadius={4}
              frontColor="#3b82f6"
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisTextStyle={{ color: colors.textMuted }}
              xAxisLabelTextStyle={{ color: colors.textMuted }}
              hideRules
              width={screenWidth - 80}
              height={200}
            />
          </View>
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
