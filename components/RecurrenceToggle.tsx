import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface RecurrenceToggleProps {
  isRecurring: boolean;
  onToggle: () => void;
}

export function RecurrenceToggle({ isRecurring, onToggle }: RecurrenceToggleProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        Recurrence
      </Text>
      <TouchableOpacity
        onPress={onToggle}
        className={`flex-row items-center px-4 py-3 rounded-xl border ${
          isRecurring
            ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
            : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800'
        }`}
        accessibilityRole="switch"
        accessibilityLabel="Mark as recurring"
        accessibilityState={{ checked: isRecurring }}
      >
        <View
          className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
            isRecurring
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300 dark:border-slate-600'
          }`}
        >
          {isRecurring && <Text className="text-white text-sm font-bold">✓</Text>}
        </View>
        <Text className="text-base font-medium text-slate-800 dark:text-gray-100">
          Recurring Expense
        </Text>
      </TouchableOpacity>
    </View>
  );
}
