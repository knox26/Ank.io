import { Check } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CATEGORY_COLORS } from '../constants/Icons';

interface ColorPickerGridProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export const ColorPickerGrid = React.memo(
  ({ selectedColor, onSelect }: ColorPickerGridProps) => (
    <View className="mb-6">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
        Color
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {CATEGORY_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => onSelect(color)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: color }}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color}`}
            accessibilityState={{ selected: selectedColor === color }}
          >
            {selectedColor === color && (
              <Check size={20} color="#fff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
);

ColorPickerGrid.displayName = 'ColorPickerGrid';
