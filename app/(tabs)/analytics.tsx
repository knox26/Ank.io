import React, { useMemo } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { BarChart3 } from 'lucide-react-native';
import { EmptyState } from '../../components/EmptyState';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { AnalyticsSkeleton } from '../../components/Skeleton';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrencyCompact, centsToDollars } from '../../lib/currency';
import { getMonthLabel } from '../../lib/date';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAnalyticsStore } from '../../store/useAnalyticsStore';

// ─── Memoized Center Label ────────────────────────────────────────

/**
 * Extracted as a named component so it doesn't re-create an anonymous
 * arrow function inside PieChart's centerLabelComponent prop each render.
 * (Fixes audit finding P5)
 */
const PieChartCenter = React.memo(
  ({ totalCents, currency }: { totalCents: number; currency: string }) => (
    <View className="justify-center items-center">
      <Text className="text-xl font-extrabold text-slate-800 dark:text-white">
        {formatCurrencyCompact(totalCents, currency)}
      </Text>
      <Text className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
        Total
      </Text>
    </View>
  )
);

PieChartCenter.displayName = 'PieChartCenter';

// ─── Screen Content ───────────────────────────────────────────────

function AnalyticsScreenContent() {
  // ─── Store data (SQL-aggregated, not raw expense array) ───────
  const categorySpends = useAnalyticsStore((s) => s.categorySpends);
  const monthlyTotals = useAnalyticsStore((s) => s.monthlyTotals);
  const isLoading = useAnalyticsStore((s) => s.isLoading);

  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);
  const { isDark, colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const currentMonthName = useMemo(
    () => new Date().toLocaleString('default', { month: 'long' }),
    []
  );

  // ─── Pie Chart Data ───────────────────────────────────────────
  //
  // categorySpends comes from:
  //   SELECT category_id, SUM(amount) FROM expenses WHERE date BETWEEN ... GROUP BY category_id
  //
  // This is O(1) from the store — no JS filtering or looping over expenses.
  const pieData = useMemo(() => {
    return categorySpends
      .map(({ category_id, total }) => {
        const category = category_id !== null ? categoryMap.get(category_id) : undefined;
        return {
          value: centsToDollars(total),
          color: category?.color ?? '#cbd5e1',
          label: category?.name ?? 'Other',
          amountStr: formatCurrencyCompact(total, currency),
          totalCents: total,
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categorySpends, categoryMap, currency]);

  const pieTotalCents = useMemo(
    () => categorySpends.reduce((sum, s) => sum + s.total, 0),
    [categorySpends]
  );

  // ─── Bar Chart Data ───────────────────────────────────────────
  //
  // monthlyTotals comes from:
  //   SELECT substr(date,1,7) as month, SUM(amount) FROM expenses GROUP BY month ORDER BY month DESC
  //
  // We build a full 6-month grid (filling 0 for months with no expenses)
  // in a single O(6) pass — not O(expenses × months).
  const barData = useMemo(() => {
    // Build a lookup map from month string → total
    const totalsMap = new Map(monthlyTotals.map((m) => [m.month, m.total]));

    // Generate the last 6 months in chronological order (oldest → newest)
    const months: { month: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ month: key, label: getMonthLabel(key) });
    }

    return months.map(({ month, label }) => ({
      value: centsToDollars(totalsMap.get(month) ?? 0),
      label,
      frontColor: '#3b82f6',
    }));
  }, [monthlyTotals]);

  // Show skeleton on initial load (placed AFTER all hooks to respect Rules of Hooks)
  if (isLoading && categorySpends.length === 0) {
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
                  centerLabelComponent={() => (
                    <PieChartCenter totalCents={pieTotalCents} currency={currency} />
                  )}
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
