import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { parseCurrencyInput } from '../lib/currency';
import { validateExpenseInput } from '../lib/validation';
import { showError } from '../lib/toast';
import { useExpenseStore } from '../store/useExpenseStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

export default function ModalScreen() {
  const categories = useCategoryStore((s) => s.categories);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const currency = useSettingsStore((s) => s.currency);
  const { colors } = useTheme();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    // Validate input
    const validation = validateExpenseInput(amount, selectedCategoryId);
    if (!validation.valid) {
      showError('Invalid Input', validation.error);
      return;
    }

    const cents = parseCurrencyInput(amount);
    if (cents === null || cents === 0) {
      showError('Invalid Amount', 'Please enter a valid positive amount');
      return;
    }

    setIsSaving(true);
    const success = await addExpense({
      amount: cents,
      category_id: selectedCategoryId!,
      date: new Date().toISOString(),
      note: note.trim() || undefined,
      is_recurring: false,
    });

    setIsSaving(false);
    if (success) {
      router.back();
    }
  }, [amount, note, selectedCategoryId, addExpense]);

  const isFormValid = amount.length > 0 && selectedCategoryId !== null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-slate-800">
          <Text className="text-xl font-bold text-slate-800 dark:text-white">
            Add Expense
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={24} color={colors.iconMuted} />
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
                accessibilityLabel="Expense amount"
              />
            </View>
          </View>

          {/* Categories */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedCategoryId === cat.id
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Category: ${cat.name}`}
                  accessibilityState={{ selected: selectedCategoryId === cat.id }}
                >
                  <Text
                    className={`${
                      selectedCategoryId === cat.id
                        ? 'text-white'
                        : 'text-slate-700 dark:text-slate-300'
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
              accessibilityLabel="Expense note"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || isSaving}
            className={`w-full py-4 rounded-xl items-center mt-2 ${
              isFormValid && !isSaving
                ? 'bg-blue-600'
                : 'bg-gray-300 dark:bg-slate-800'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Save expense"
            accessibilityState={{ disabled: !isFormValid || isSaving }}
          >
            <Text
              className={`font-bold text-lg ${
                isFormValid && !isSaving
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-500'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Expense'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
