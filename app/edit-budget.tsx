import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { CategoryIcon } from '../components/CategoryIcon';
import { centsToDollars, formatAsYouType, formatCurrencyCompact, parseCurrencyInput } from '../lib/currency';
import { showError } from '../lib/toast';
import { validateBudgetInput } from '../lib/validation';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

export default function EditBudgetModal() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const categories = useCategoryStore((s) => s.categories);
  const updateBudgetLimit = useCategoryStore((s) => s.updateBudgetLimit);
  const currency = useSettingsStore((s) => s.currency);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const category = categories.find((c) => c.id === Number(categoryId)) ?? null;
  const currentBudget = category?.budget_limit ?? 0;

  const [budgetInput, setBudgetInput] = useState(
    centsToDollars(currentBudget).toString()
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!category) return;

    const validation = validateBudgetInput(budgetInput);
    if (!validation.valid) {
      showError('Invalid Amount', validation.error);
      return;
    }

    const cents = parseCurrencyInput(budgetInput);
    if (cents === null) {
      showError('Invalid Amount', 'Please enter a valid number');
      return;
    }

    setIsSaving(true);
    await updateBudgetLimit(category.id, cents);
    router.back();
  };

  if (!category) return null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-slate-800">
          <Text className="text-xl font-bold text-slate-800 dark:text-white">
            Edit Budget
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category info */}
          <View className="flex-row items-center mb-8">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon
                name={category.icon}
                color={category.color}
                size={28}
              />
            </View>
            <View>
              <Text className="text-xl font-bold text-slate-800 dark:text-white">
                {category.name}
              </Text>
              <Text className="text-gray-500">
                Current limit: {formatCurrencyCompact(currentBudget, currency)}
              </Text>
            </View>
          </View>

          {/* Budget input */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              New Budget Limit
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
                value={budgetInput}
                onChangeText={(text) => setBudgetInput(formatAsYouType(text))}
                onSubmitEditing={handleSave}
                returnKeyType="done"
                autoFocus
                accessibilityLabel="New budget limit amount"
              />
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-slate-800 items-center"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`flex-1 py-4 rounded-xl items-center ${
                isSaving ? 'bg-blue-400' : 'bg-blue-600'
              }`}
              accessibilityRole="button"
              accessibilityLabel="Save budget limit"
            >
              <Text className="text-white font-bold text-lg">
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
