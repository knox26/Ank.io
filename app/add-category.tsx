import { useRouter } from 'expo-router';
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
import { ColorPickerGrid } from '../components/ColorPickerGrid';
import { IconPickerGrid } from '../components/IconPickerGrid';
import { CategoryFormPreview } from '../components/CategoryFormPreview';
import { formatAsYouType } from '../lib/currency';
import { useCategoryForm } from '../hooks/useCategoryForm';
import { FORM_HEADER_HEIGHT } from '../constants/Layout';

export default function AddCategoryScreen() {
  const router = useRouter();
  const {
    isDark,
    colors,
    name,
    selectedIcon,
    selectedColor,
    budgetLimit,
    isSaving,
    setName,
    setSelectedIcon,
    setSelectedColor,
    setBudgetLimit,
    handleSave,
    isFormValid,
  } = useCategoryForm();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">
          New Category
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-full ${
            isFormValid
              ? 'bg-blue-600'
              : 'bg-gray-200 dark:bg-slate-800'
          }`}
          accessibilityRole="button"
          accessibilityLabel="Save category"
        >
          <Text
            className={`${
              isFormValid ? 'text-white' : 'text-gray-400'
            } font-bold`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={FORM_HEADER_HEIGHT}
        enableAutomaticScroll
      >
            <CategoryFormPreview
              name={name}
              selectedIcon={selectedIcon}
              selectedColor={selectedColor}
            />

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
                accessibilityLabel="Category name"
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
                onChangeText={(text) => setBudgetLimit(formatAsYouType(text))}
                className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-lg text-slate-900 dark:text-white border border-gray-100 dark:border-slate-800"
                accessibilityLabel="Monthly budget limit"
              />
            </View>

            <IconPickerGrid
              selectedIcon={selectedIcon}
              onSelect={setSelectedIcon}
              iconMutedColor={colors.iconMuted}
            />

            <ColorPickerGrid
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
