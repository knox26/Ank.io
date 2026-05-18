import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import React from 'react';
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
import { CategorySelector } from '../components/CategorySelector';
import { RecurrenceToggle } from '../components/RecurrenceToggle';
import { FrequencySelector } from '../components/FrequencySelector';
import { formatAsYouType } from '../lib/currency';
import { useExpenseForm } from '../hooks/useExpenseForm';

export default function ModalScreen() {
  const {
    categories,
    currency,
    colors,
    amount,
    note,
    selectedCategoryId,
    isSaving,
    isRecurring,
    recurrenceFrequency,
    setAmount,
    setNote,
    setSelectedCategoryId,
    setIsRecurring,
    setRecurrenceFrequency,
    handleSubmit,
    isFormValid,
  } = useExpenseForm();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
                onChangeText={(text) => setAmount(formatAsYouType(text))}
                autoFocus
                accessibilityLabel="Expense amount"
              />
            </View>
          </View>

          <CategorySelector
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />

          <RecurrenceToggle
            isRecurring={isRecurring}
            onToggle={() => setIsRecurring(!isRecurring)}
          />

          {isRecurring && (
            <FrequencySelector
              selected={recurrenceFrequency}
              onSelect={setRecurrenceFrequency}
            />
          )}

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
              maxLength={500}
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
