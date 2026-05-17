import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Category } from '../types';
import { formatCurrencyCompact } from '../lib/currency';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBudgetRowProps {
  category: Category;
  currency: string;
  onPress: (id: number) => void;
}

export const CategoryBudgetRow = React.memo(
  ({ category, currency, onPress }: CategoryBudgetRowProps) => (
    <TouchableOpacity
      onPress={() => onPress(category.id)}
      activeOpacity={0.7}
      className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex-row items-center justify-between mb-2"
      accessibilityRole="button"
      accessibilityLabel={`Edit budget for ${category.name}`}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <CategoryIcon name={category.icon} color={category.color} size={20} />
        </View>
        <View>
          <Text className="font-bold text-slate-800 dark:text-white text-base">
            {category.name}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-sm mr-1">Limit: </Text>
            <Text className="text-slate-900 dark:text-white text-sm font-medium">
              {formatCurrencyCompact(category.budget_limit ?? 0, currency)}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
        <Text className="text-slate-700 dark:text-slate-300 font-medium">
          Edit
        </Text>
      </View>
    </TouchableOpacity>
  )
);

CategoryBudgetRow.displayName = 'CategoryBudgetRow';
