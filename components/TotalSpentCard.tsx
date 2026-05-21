import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { formatCurrency } from '../lib/currency';

interface TotalSpentCardProps {
  totalSpent: number;
  totalBudget: number;
  currency: string;
  currentMonthName: string;
  progressPercent: number;
}

export function TotalSpentCard({
  totalSpent,
  totalBudget,
  currency,
  currentMonthName,
  progressPercent,
}: TotalSpentCardProps) {
  const pct = Math.max(0, progressPercent);
  const isOverBudget = pct > 100;
  const hasBudget = totalBudget > 0;

  const animPct = useSharedValue(pct);

  useEffect(() => {
    animPct.value = withTiming(pct, { duration: 500 });
  }, [pct, animPct]);

  const barStyle = useAnimatedStyle(() => {
    const barWidth = Math.min(animPct.value, 100);
    const color = interpolateColor(
      animPct.value,
      [0, 79.9, 80, 99.9, 100, 120],
      ['#22c55e', '#22c55e', '#3b82f6', '#3b82f6', '#ef4444', '#ef4444']
    );
    return {
      width: `${barWidth}%`,
      backgroundColor: color,
    };
  });

  const pctTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      animPct.value,
      [0, 79.9, 80, 99.9, 100, 120],
      ['#22c55e', '#22c55e', '#3b82f6', '#3b82f6', '#ef4444', '#ef4444']
    ),
  }));

  const spentColor = isOverBudget ? '#ef4444' : undefined;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
      <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
        Total Spent ({currentMonthName})
      </Text>
      <Text
        className={`text-4xl font-bold mt-2 ${isOverBudget ? '' : 'text-slate-900 dark:text-white'}`}
        style={spentColor ? { color: spentColor } : undefined}
        accessibilityLabel={`Total spent this month: ${formatCurrency(totalSpent, currency)}`}
      >
        {formatCurrency(totalSpent, currency)}
      </Text>

      {hasBudget && (
        <View className="mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {isOverBudget ? 'Over Budget' : 'Budget Progress'}
            </Text>
            <Animated.Text
              className="text-xs font-semibold"
              style={pctTextStyle}
            >
              {Math.round(pct)}%
            </Animated.Text>
          </View>
          <View className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={barStyle}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
              accessibilityLabel="Monthly budget usage"
            />
          </View>
          <Text
            className="text-xs mt-2 text-right"
            style={
              isOverBudget
                ? { color: '#ef4444' }
                : { color: '#9ca3af' }
            }
          >
            {isOverBudget
              ? `Overspent by ${formatCurrency(totalSpent - totalBudget, currency)}`
              : `Limit: ${formatCurrency(totalBudget, currency)}`}
          </Text>
        </View>
      )}

      {!hasBudget && (
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-right">
          No budget set
        </Text>
      )}
    </View>
  );
}
