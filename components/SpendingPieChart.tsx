import React from 'react';
import { Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { BarChart3 } from 'lucide-react-native';
import { EmptyState } from './EmptyState';
import { formatCurrencyCompact } from '../lib/currency';

interface PieDataItem {
  value: number;
  color: string;
  label: string;
  amountStr: string;
}

interface SpendingPieChartProps {
  pieData: PieDataItem[];
  pieTotalCents: number;
  currency: string;
  isDark: boolean;
  currentMonthName: string;
}

export function SpendingPieChart({
  pieData,
  pieTotalCents,
  currency,
  isDark,
  currentMonthName,
}: SpendingPieChartProps) {
  if (pieData.length === 0) {
    return (
      <View className="bg-white dark:bg-slate-100/5 p-4 pl-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 items-center">
        <Text className="text-lg font-bold text-slate-800 dark:text-white mb-4 w-full">
          Spending by Category ({currentMonthName})
        </Text>
        <EmptyState
          icon={BarChart3}
          title="No data for this month"
          subtitle="Add some expenses to see your spending breakdown"
        />
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-slate-100/5 p-4 pl-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 items-center">
      <Text className="text-lg font-bold text-slate-800 dark:text-white mb-4 w-full">
        Spending by Category ({currentMonthName})
      </Text>
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
              <View className="justify-center items-center">
                <Text className="text-xl font-extrabold text-slate-800 dark:text-white">
                  {formatCurrencyCompact(pieTotalCents, currency)}
                </Text>
                <Text className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
                  Total
                </Text>
              </View>
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
    </View>
  );
}
