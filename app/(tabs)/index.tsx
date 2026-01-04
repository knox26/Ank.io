import { useRouter } from "expo-router";
import { Layers, Trash2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ICON_MAP } from "../../constants/Icons";
import { useStore } from "../../store/useStore";

// Remove internal iconMap

export default function HomeScreen() {
  const router = useRouter();
  const {
    categories,
    expenses,
    loadCategories,
    loadExpenses,
    currency,
    isLoading,
    archiveCategory,
  } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useColorScheme();

  const onDeleteCategory = (id: number, name: string) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${name}"? Existing expenses for this category will be kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => archiveCategory(id),
        },
      ]
    );
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadExpenses()]);
    setRefreshing(false);
  }, []);

  // Calculate totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Simple budget calculation (sum of category budgets for now)
  const totalBudget = categories.reduce((sum, c) => sum + c.budget_limit, 0);
  const progress = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const progressPercent = Math.min(progress * 100, 100);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <View className="p-4 space-y-6">
        {/* Total Spent Card */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
            Total Spent (This Month)
          </Text>
          <Text className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {currency}
            {totalSpent.toFixed(2)}
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
                  progressPercent > 100 ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
              Limit: {currency}
              {totalBudget.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Add New Category Button */}
        <TouchableOpacity
          onPress={() => router.push("/add-category")}
          className="flex-row justify-center mt-2"
        >
          <View className="w-full bg-gray-100 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 items-center">
            <Text className="text-slate-900 dark:text-white font-medium">
              + Add New Category
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-slate-800 dark:text-white mt-4">
          Categories
        </Text>
      </View>

      {/* Categories Grid - Scrollable */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          paddingTop: 8,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colorScheme === "dark" ? "#fff" : "#000"}
          />
        }
      >
        <View className="flex-row flex-wrap justify-between">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Layers;
            const catExpenses = thisMonthExpenses.filter(
              (e) => e.category_id === cat.id
            );
            const catSpent = catExpenses.reduce((sum, e) => sum + e.amount, 0);

            return (
              <View
                key={cat.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-slate-800"
                style={{ width: "48%" }}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center">
                    <View
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {React.createElement(ICON_MAP[cat.icon] || Layers, {
                        size: 20,
                        color: cat.color,
                      })}
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="font-semibold text-slate-900 dark:text-white mr-1">
                      {currency}
                      {catSpent.toFixed(0)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onDeleteCategory(cat.id, cat.name)}
                      className="pl-1"
                    >
                      <Trash2 size={16} color="#f63535ff" opacity={0.6} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text
                  className="text-gray-600 dark:text-gray-300 font-medium mb-1"
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
                <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                  Limit: {currency}
                  {cat.budget_limit.toFixed(0)}
                </Text>
                {cat.budget_limit > 0 && (
                  <View className="h-1 bg-gray-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <View
                      className="h-full bg-gray-400 dark:bg-gray-500 rounded-full opacity-50"
                      style={{
                        width: `${Math.min(
                          (catSpent / cat.budget_limit) * 100,
                          100
                        )}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
