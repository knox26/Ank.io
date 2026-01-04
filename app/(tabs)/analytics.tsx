import { useColorScheme } from "nativewind";
import React from "react";
import { Dimensions, ScrollView, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useStore } from "../../store/useStore";

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const { expenses, categories, currency } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- Data Processing for Pie Chart (Category Distribution) ---
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const categoryTotals: Record<number, number> = {};
  thisMonthExpenses.forEach((e) => {
    categoryTotals[e.category_id] =
      (categoryTotals[e.category_id] || 0) + e.amount;
  });

  const pieData = Object.keys(categoryTotals)
    .map((catId) => {
      const id = parseInt(catId);
      const category = categories.find((c) => c.id === id);
      const value = categoryTotals[id];
      return {
        value: value,
        color: category ? category.color : "#cbd5e1",
        label: category?.name || "Other",
        amountStr: `${currency}${value.toFixed(0)}`,
      };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value); // Sort by highest spending

  // --- Data Processing for Bar Chart (Weekly/Daily Trend) ---
  const barData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthName = d.toLocaleString("default", { month: "short" });

    const monthlyTotal = expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() === month && ed.getFullYear() === year;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    barData.push({
      value: monthlyTotal,
      label: monthName,
      frontColor: "#3b82f6",
    });
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
            Spending by Category (This Month)
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
                  innerCircleColor={isDark ? "#0f172a" : "#fff"}
                  centerLabelComponent={() => {
                    const total = pieData.reduce((sum, d) => sum + d.value, 0);
                    return (
                      <View className="justify-center items-center">
                        <Text className="text-xl font-extrabold text-slate-800 dark:text-white">
                          {currency}
                          {total.toFixed(0)}
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
                      {item.label}{" "}
                      <Text className="font-bold text-slate-900 dark:text-white">
                        ({item.amountStr})
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text className="text-gray-500 py-10">No data for this month</Text>
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
              yAxisTextStyle={{ color: isDark ? "#94a3b8" : "#64748b" }}
              xAxisLabelTextStyle={{ color: isDark ? "#94a3b8" : "#64748b" }}
              hideRules
              width={screenWidth - 80} // approximate adjustment
              height={200}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
