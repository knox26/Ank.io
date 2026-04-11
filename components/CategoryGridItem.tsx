import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrencyCompact } from '../lib/currency';
import { Category } from '../types';

interface CategoryGridItemProps {
  category: Category;
  /** Spent amount in cents */
  spentAmount: number;
  currency: string;
  onDeleteCategory: (id: number, name: string) => void;
}

export const CategoryGridItem = React.memo(
  ({
    category,
    spentAmount,
    currency,
    onDeleteCategory,
  }: CategoryGridItemProps) => {
    return (
      <View
        className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-slate-800"
        style={{ width: '48%' }}
        accessibilityRole="summary"
        accessibilityLabel={`${category.name}: spent ${formatCurrencyCompact(spentAmount, currency)} of ${formatCurrencyCompact(category.budget_limit, currency)} budget`}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center">
            <View
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon name={category.icon} color={category.color} size={20} />
            </View>
          </View>
          <View className="flex-row items-center">
            <Text className="font-semibold text-slate-900 dark:text-white mr-1">
              {formatCurrencyCompact(spentAmount, currency)}
            </Text>
            <TouchableOpacity
              onPress={() => onDeleteCategory(category.id, category.name)}
              className="pl-1"
              accessibilityRole="button"
              accessibilityLabel={`Delete ${category.name} category`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color="#f63535ff" opacity={0.6} />
            </TouchableOpacity>
          </View>
        </View>
        <Text
          className="text-gray-600 dark:text-gray-300 font-medium mb-1"
          numberOfLines={1}
        >
          {category.name}
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Limit: {formatCurrencyCompact(category.budget_limit, currency)}
        </Text>
        {category.budget_limit > 0 && (
          <View className="h-1 bg-gray-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <View
              className="h-full bg-gray-400 dark:bg-gray-500 rounded-full opacity-50"
              style={{
                width: `${Math.min(
                  (spentAmount / category.budget_limit) * 100,
                  100
                )}%`,
                backgroundColor: category.color,
              }}
            />
          </View>
        )}
      </View>
    );
  }
);

CategoryGridItem.displayName = 'CategoryGridItem';
