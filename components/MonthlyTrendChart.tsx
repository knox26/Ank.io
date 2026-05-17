import React from 'react';
import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface BarDataItem {
  value: number;
  label: string;
  frontColor: string;
}

interface MonthlyTrendChartProps {
  barData: BarDataItem[];
  screenWidth: number;
  textMutedColor: string;
}

export function MonthlyTrendChart({
  barData,
  screenWidth,
  textMutedColor,
}: MonthlyTrendChartProps) {
  return (
    <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
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
          yAxisTextStyle={{ color: textMutedColor }}
          xAxisLabelTextStyle={{ color: textMutedColor }}
          hideRules
          width={screenWidth - 80}
          height={200}
        />
      </View>
    </View>
  );
}
