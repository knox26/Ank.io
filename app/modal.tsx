import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store/useStore";

export default function ModalScreen() {
  const categories = useStore((state) => state.categories);
  const addExpense = useStore((state) => state.addExpense);
  const currency = useStore((state) => state.currency);

  const activeCategories = React.useMemo(
    () => categories.filter((c) => !c.is_archived),
    [categories]
  );

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // YYYY-MM-DD

  const handleSubmit = async () => {
    if (!amount || !selectedCategoryId) return;

    await addExpense({
      amount: parseFloat(amount),
      category_id: selectedCategoryId,
      date: new Date().toISOString(), // Use full ISO string for storage
      note: note,
      is_recurring: false,
    });

    router.back();
  };

  const isFormValid = amount.length > 0 && selectedCategoryId !== null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={["top"]}>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-slate-800">
          <Text className="text-xl font-bold text-slate-800 dark:text-white">
            Add Expense
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <X size={24} className="text-slate-500 dark:text-slate-400" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Amount Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Amount
            </Text>
            <View className="flex-row items-center border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-4 bg-gray-50 dark:bg-slate-900">
              <Text className="text-3xl font-bold text-slate-900 dark:text-white mr-2">
                {currency}
              </Text>
              <TextInput
                className="flex-1 text-3xl font-bold text-slate-900 dark:text-white h-14"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
          </View>

          {/* Categories */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {activeCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedCategoryId === cat.id
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                  }`}
                >
                  <Text
                    className={`${
                      selectedCategoryId === cat.id
                        ? "text-white"
                        : "text-slate-700 dark:text-slate-300"
                    } font-medium`}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Note */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Note (Optional)
            </Text>
            <TextInput
              className="border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="What was this for?"
              placeholderTextColor="#94a3b8"
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-xl items-center mt-2 ${
              isFormValid ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-800"
            }`}
          >
            <Text
              className={`font-bold text-lg ${
                isFormValid ? "text-white" : "text-gray-500 dark:text-gray-500"
              }`}
            >
              Save Expense
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
