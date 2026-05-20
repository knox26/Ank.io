import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TemplateToggleProps {
  isTemplate: boolean;
  onToggle: () => void;
}

export function TemplateToggle({ isTemplate, onToggle }: TemplateToggleProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        Template
      </Text>
      <TouchableOpacity
        onPress={onToggle}
        className={`flex-row items-center px-4 py-3 rounded-xl border ${
          isTemplate
            ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700'
            : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800'
        }`}
        accessibilityRole="switch"
        accessibilityLabel="Save as template"
        accessibilityState={{ checked: isTemplate }}
      >
        <View
          className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
            isTemplate
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 dark:border-slate-600'
          }`}
        >
          {isTemplate && <Text className="text-white text-sm font-bold">✓</Text>}
        </View>
        <Text className="text-base font-medium text-slate-800 dark:text-gray-100">
          Save as Template
        </Text>
      </TouchableOpacity>
    </View>
  );
}
