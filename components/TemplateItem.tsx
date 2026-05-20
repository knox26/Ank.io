import { Pencil, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../lib/currency';
import { Category, ExpenseTemplate } from '../types';

interface TemplateItemProps {
  template: ExpenseTemplate;
  category?: Category;
  currency: string;
  onPress: (template: ExpenseTemplate) => void;
  onEdit: (template: ExpenseTemplate) => void;
  onDelete: (template: ExpenseTemplate) => void;
}

export const TemplateItem = React.memo(
  ({ template, category, currency, onPress, onEdit, onDelete }: TemplateItemProps) => {
    const color = category?.color ?? '#94a3b8';
    const categoryName = category?.name ?? 'Unknown';

    return (
      <TouchableOpacity
        onPress={() => onPress(template)}
        activeOpacity={0.7}
        className="flex-row items-center bg-white dark:bg-slate-900 p-4 mb-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800"
        accessibilityRole="button"
        accessibilityLabel={`Use template ${template.name}: ${formatCurrency(template.amount, currency)}, ${categoryName}`}
      >
        <View
          className="p-3 rounded-full mr-3"
          style={{ backgroundColor: `${color}20` }}
        >
          <CategoryIcon
            name={category?.icon ?? 'layers'}
            color={color}
            size={20}
          />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900 dark:text-white text-base">
            {template.name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            {categoryName}
          </Text>
          {template.note ? (
            <Text className="text-gray-400 dark:text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {template.note}
            </Text>
          ) : null}
        </View>
        <View className="items-end gap-2">
          <Text className="font-bold text-slate-800 dark:text-gray-100 text-base">
            {formatCurrency(template.amount, currency)}
          </Text>
          <View className="flex-row gap-1">
            <TouchableOpacity
              onPress={() => onEdit(template)}
              className="p-1"
              accessibilityRole="button"
              accessibilityLabel={`Edit template ${template.name}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pencil size={16} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(template)}
              className="p-1"
              accessibilityRole="button"
              accessibilityLabel={`Delete template ${template.name}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

TemplateItem.displayName = 'TemplateItem';
