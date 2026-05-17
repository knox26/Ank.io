import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Category } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelect: (id: number) => void;
}

export const CategorySelector = React.memo(
  ({ categories, selectedCategoryId, onSelect }: CategorySelectorProps) => (
    <View className="mb-6">
      <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        Category
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
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
  )
);

CategorySelector.displayName = 'CategorySelector';
