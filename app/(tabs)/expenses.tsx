import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  Calendar,
  ChevronDown,
  Filter,
  Layers,
  Trash2,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ICON_MAP } from "../../constants/Icons";
import { useStore } from "../../store/useStore";

export default function ExpensesScreen() {
  const { expenses, categories, currency, deleteExpense } = useStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onStartChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDateStr(selectedDate.toISOString().split("T")[0]);
    }
  };

  const onEndChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDateStr(selectedDate.toISOString().split("T")[0]);
    }
  };

  // Filtering Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Category Filter
      if (selectedCategoryId && expense.category_id !== selectedCategoryId) {
        return false;
      }

      // Date Range Filter
      const expenseDate = new Date(expense.date).getTime();
      if (startDateStr) {
        const start = new Date(startDateStr).getTime();
        if (!isNaN(start) && expenseDate < start) return false;
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime()) && expenseDate > end.getTime()) return false;
      }

      return true;
    });
  }, [expenses, selectedCategoryId, startDateStr, endDateStr]);

  // Group by Date
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = expense.date.split("T")[0]; // Simple date key YYYY-MM-DD
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, typeof expenses>);

  const sections = Object.keys(groupedExpenses)
    .sort((a, b) => b.localeCompare(a)) // Sort desc
    .map((date) => ({
      title: new Date(date).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      data: groupedExpenses[date],
    }));

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setStartDateStr("");
    setEndDateStr("");
  };

  const isFiltering =
    selectedCategoryId !== null || startDateStr !== "" || endDateStr !== "";

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteExpense(id),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      {/* Filter Header */}
      <View className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <View className="px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Filter
              size={18}
              color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
            />
            <Text className="ml-2 text-slate-600 dark:text-slate-400 font-semibold uppercase text-xs tracking-wider">
              Filters
            </Text>
            {isFiltering && (
              <View className="ml-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                  ACTIVE
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center"
          >
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium mr-1">
              {showFilters ? "Hide" : "Show"}
            </Text>
            <ChevronDown
              size={16}
              color="#2563eb"
              style={{
                transform: [{ rotate: showFilters ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View className="px-4 pb-4 space-y-6">
            {/* Category Chips */}
            <View>
              <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase mb-2">
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategoryId(null)}
                  className={`px-4 py-2 rounded-full mr-2 border ${
                    selectedCategoryId === null
                      ? "bg-slate-800 border-slate-800 dark:bg-white dark:border-white"
                      : "bg-transparent border-gray-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={
                      selectedCategoryId === null
                        ? "text-white dark:text-slate-900 font-bold"
                        : "text-gray-500"
                    }
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full mr-2 border ${
                      selectedCategoryId === cat.id
                        ? "bg-slate-800 border-slate-800 dark:bg-white dark:border-white"
                        : "bg-transparent border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    <Text
                      className={
                        selectedCategoryId === cat.id
                          ? "text-white dark:text-slate-900 font-bold"
                          : "text-gray-500"
                      }
                    >
                      {cat.name}{" "}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Date Selection Buttons */}
            <View>
              <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase mb-2 mt-2">
                Date Range
              </Text>
              <View className="flex-row items-center space-x-2">
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  className="flex-1 flex-row items-center bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700"
                >
                  <Calendar size={14} color="#94a3b8" />
                  <Text
                    className={`ml-2 text-sm ${
                      startDateStr
                        ? "text-slate-900 dark:text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {startDateStr || "Start Date"}
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-400 mx-2">to</Text>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  className="flex-1 flex-row items-center bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700"
                >
                  <Calendar size={14} color="#94a3b8" />
                  <Text
                    className={`ml-2 text-sm ${
                      endDateStr
                        ? "text-slate-900 dark:text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {endDateStr || "End Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startDateStr ? new Date(startDateStr) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onStartChange}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endDateStr ? new Date(endDateStr) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onEndChange}
                  minimumDate={
                    startDateStr ? new Date(startDateStr) : undefined
                  }
                />
              )}
            </View>

            {isFiltering && (
              <TouchableOpacity
                onPress={clearFilters}
                className="flex-row items-center justify-center py-2 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg mt-2"
              >
                <X size={14} color="#ef4444" />
                <Text className="ml-2 text-red-500 font-medium text-xs">
                  Clear All Filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View className="mb-2 mt-4">
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 120,
            flexGrow: 1,
          }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-gray-500 dark:text-gray-400 font-bold mb-2 mt-2 uppercase text-xs">
              {title}
            </Text>
          )}
          renderItem={({ item }) => {
            const category = categories.find((c) => c.id === item.category_id);
            const Icon = category ? ICON_MAP[category.icon] || Layers : Layers;
            const color = category ? category.color : "#94a3b8";

            return (
              <View className="flex-row items-center bg-white dark:bg-slate-900 p-4 mb-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                <View
                  className="p-3 rounded-full mr-4"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={20} color={color} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 dark:text-white text-base">
                    {category?.name || "Unknown"}
                  </Text>
                  {item.note ? (
                    <Text
                      className="text-gray-500 dark:text-gray-400 text-sm"
                      numberOfLines={1}
                    >
                      {item.note}
                    </Text>
                  ) : null}
                  <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    {new Date(item.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-slate-800 dark:text-gray-100 text-base">
                    {currency}
                    {item.amount.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    className="mt-1"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-400 dark:text-gray-500 text-lg font-medium mb-24">
                No expenses found
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
