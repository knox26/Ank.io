import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useColorScheme } from 'nativewind';
import { CategorySelector } from '../components/CategorySelector';
import { RecurrenceToggle } from '../components/RecurrenceToggle';
import { TemplateToggle } from '../components/TemplateToggle';
import { FrequencySelector } from '../components/FrequencySelector';
import { formatAsYouType } from '../lib/currency';
import { useExpenseForm } from '../hooks/useExpenseForm';
import { FORM_HEADER_HEIGHT } from '../constants/Layout';

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
    isTemplate,
    recurrenceFrequency,
    saveLabel,
    setAmount,
    setNote,
    setSelectedCategoryId,
    handleToggleRecurring,
    handleToggleTemplate,
    setRecurrenceFrequency,
    handleSubmit,
    isFormValid,
  } = useExpenseForm();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

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

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={FORM_HEADER_HEIGHT}
        enableAutomaticScroll
      >
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

          <TemplateToggle
            isTemplate={isTemplate}
            onToggle={handleToggleTemplate}
          />

          <RecurrenceToggle
            isRecurring={isRecurring}
            onToggle={handleToggleRecurring}
          />

          {isRecurring && (
            <FrequencySelector
              selected={recurrenceFrequency}
              onSelect={setRecurrenceFrequency}
            />
          )}

          {/* Note / Template Name */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {isTemplate ? 'Template Name' : 'Note (Optional)'}
            </Text>
            <TextInput
              className="border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder={isTemplate ? 'e.g., Morning Coffee' : 'What was this for?'}
              placeholderTextColor="#94a3b8"
              value={note}
              onChangeText={setNote}
              accessibilityLabel={isTemplate ? 'Template name' : 'Expense note'}
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
            accessibilityLabel={saveLabel}
            accessibilityState={{ disabled: !isFormValid || isSaving }}
          >
            <Text
              className={`font-bold text-lg ${
                isFormValid && !isSaving
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-500'
              }`}
            >
              {saveLabel}
            </Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
