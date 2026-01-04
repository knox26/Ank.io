import { useRouter } from "expo-router";
import { Check, Layers, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../constants/Icons";
import { useStore } from "../store/useStore";

export default function AddCategoryScreen() {
  const router = useRouter();
  const { addCategory } = useStore();
  const { colorScheme } = useColorScheme();

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("layers");
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [budgetLimit, setBudgetLimit] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;

    await addCategory({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      budget_limit: parseFloat(budgetLimit) || 0,
      is_archived: false,
    });
    router.back();
  };

  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1">
          {/* Header */}
          <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <X size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              New Category
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim()}
              className={`px-4 py-2 rounded-full ${
                name.trim() ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-800"
              }`}
            >
              <Text
                className={`${
                  name.trim() ? "text-white" : "text-gray-400"
                } font-bold`}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Preview */}
            <View className="items-center justify-center mb-8">
              <View
                className="w-24 h-24 rounded-3xl items-center justify-center shadow-lg"
                style={{ backgroundColor: selectedColor }}
              >
                {React.createElement(
                  CATEGORY_ICONS.find((i) => i.name === selectedIcon)?.icon ||
                    Layers,
                  {
                    size: 48,
                    color: "#fff",
                  }
                )}
              </View>
              <Text className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                {name || "Label"}
              </Text>
            </View>

            {/* Name Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Category Name
              </Text>
              <TextInput
                placeholder="e.g. Gym, Coffee, Pets"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                maxLength={20}
                className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-lg text-slate-900 dark:text-white border border-gray-100 dark:border-slate-800"
              />
            </View>

            {/* Budget Limit Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Monthly Budget Limit (Optional)
              </Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={budgetLimit}
                onChangeText={setBudgetLimit}
                className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-lg text-slate-900 dark:text-white border border-gray-100 dark:border-slate-800"
              />
            </View>

            {/* Icon Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Icon
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {CATEGORY_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => setSelectedIcon(item.name)}
                    className={`p-3 rounded-xl border ${
                      selectedIcon === item.name
                        ? "bg-slate-100 dark:bg-slate-800 border-blue-500"
                        : "bg-transparent border-gray-100 dark:border-slate-800"
                    }`}
                  >
                    <item.icon
                      size={24}
                      color={
                        selectedIcon === item.name
                          ? "#2563eb"
                          : isDark
                          ? "#94a3b8"
                          : "#64748b"
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Color
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {CATEGORY_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <Check size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
