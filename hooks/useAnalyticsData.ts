import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { formatCurrencyCompact, centsToDollars } from '../lib/currency';
import { getCurrentMonthName, getMonthLabel } from '../lib/date';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAnalyticsStore } from '../store/useAnalyticsStore';

export function useAnalyticsData() {
  const categorySpends = useAnalyticsStore((s) => s.categorySpends);
  const monthlyTotals = useAnalyticsStore((s) => s.monthlyTotals);
  const isLoading = useAnalyticsStore((s) => s.isLoading);

  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);
  const { isDark, colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const currentMonthName = getCurrentMonthName();

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

  const barData = useMemo(() => {
    const totalsMap = new Map(monthlyTotals.map((m) => [m.month, m.total]));

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

  return {
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
  };
}
