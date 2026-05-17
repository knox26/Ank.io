import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CATEGORY_ICONS } from '../constants/Icons';

interface IconPickerGridProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  iconMutedColor: string;
}

export const IconPickerGrid = React.memo(
  ({ selectedIcon, onSelect, iconMutedColor }: IconPickerGridProps) => (
    <View className="mb-6">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
        Icon
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {CATEGORY_ICONS.map((item) => (
          <TouchableOpacity
            key={item.name}
            onPress={() => onSelect(item.name)}
            className={`p-3 rounded-xl border ${
              selectedIcon === item.name
                ? 'bg-slate-100 dark:bg-slate-800 border-blue-500'
                : 'bg-transparent border-gray-100 dark:border-slate-800'
            }`}
            accessibilityRole="button"
            accessibilityLabel={`Icon: ${item.name}`}
            accessibilityState={{ selected: selectedIcon === item.name }}
          >
            <item.icon
              size={24}
              color={
                selectedIcon === item.name
                  ? '#2563eb'
                  : iconMutedColor
              }
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
);

IconPickerGrid.displayName = 'IconPickerGrid';
