import { Check, Layers } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ICON_MAP } from "../../constants/Icons";
import { dbRequest } from "../../services/db";
import { useStore } from "../../store/useStore";

const currencies = ["$", "€", "₹", "£", "¥"];

export default function BudgetScreen() {
  const { categories, loadCategories, currency, setCurrency } = useStore();

  const { colorScheme } = useColorScheme();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [budgetInput, setBudgetInput] = useState("");

  const handleEdit = (id: number, currentBudget: number) => {
    setEditingId(id);
    setBudgetInput(currentBudget.toString());
  };

  const handleSave = async (id: number) => {
    const newLimit = parseFloat(budgetInput);
    if (isNaN(newLimit)) return;

    try {
      await dbRequest.runAsync(
        "UPDATE categories SET budget_limit = ? WHERE id = ?",
        newLimit,
        id
      );
      await loadCategories(); // Refresh store
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <View className="p-4 space-y-4">
        {/* Currency Selection */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Display Currency
          </Text>
          <View className="flex-row items-center bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
            {currencies.map((curr) => {
              const isActive = currency === curr;
              const isDark = colorScheme === "dark";

              // Match active currency background with Add Expense button
              const activeBg = isDark ? "#ffffff" : "#404040";
              const activeText = isDark ? "#000000" : "#ffffff";
              const inactiveText = isDark ? "#a3a3a3" : "#737373";

              return (
                <Pressable
                  key={curr}
                  onPress={() => setCurrency(curr)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isActive ? activeBg : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isActive ? activeText : inactiveText,
                    }}
                  >
                    {curr}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4">
          <Text className="text-blue-700 dark:text-blue-300">
            Set monthly budget limits for each category to track your spending
            progress.
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {categories.map((cat) => (
          <View
            key={cat.id}
            className=" bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex-row items-center justify-between mb-2"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                {(() => {
                  const Icon = ICON_MAP[cat.icon] || Layers;
                  return <Icon size={20} color={cat.color} />;
                })()}
              </View>
              <View>
                <Text className="font-bold text-slate-800 dark:text-white text-base">
                  {cat.name}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-sm mr-1">Limit: </Text>
                  <Text className="text-slate-900 dark:text-white text-sm font-medium">
                    {currency}
                    {Number(cat.budget_limit ?? 0).toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            {editingId === cat.id ? (
              <View className="flex-row items-center">
                <TextInput
                  className="bg-gray-100 dark:bg-slate-800 w-20 px-2 py-1 rounded text-right mr-2 text-slate-900 dark:text-white"
                  keyboardType="numeric"
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => handleSave(cat.id)}
                  className="bg-blue-500 p-2 rounded-full"
                >
                  <Check size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleEdit(cat.id, cat.budget_limit || 0)}
                className="bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-medium">
                  Edit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
