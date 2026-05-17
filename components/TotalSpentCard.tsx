import React from 'react';
import { Text, View } from 'react-native';
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
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
      <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
        Total Spent ({currentMonthName})
      </Text>
      <Text
        className="text-4xl font-bold text-slate-900 dark:text-white mt-2"
        accessibilityLabel={`Total spent this month: ${formatCurrency(totalSpent, currency)}`}
      >
        {formatCurrency(totalSpent, currency)}
      </Text>

      <View className="mt-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Budget Progress
          </Text>
          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {Math.round(progressPercent)}%
          </Text>
        </View>
        <View className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${
              progressPercent > 100 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
          Limit: {formatCurrency(totalBudget, currency)}
        </Text>
      </View>
    </View>
  );
}
