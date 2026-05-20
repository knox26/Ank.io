import { Repeat, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../lib/currency';
import { formatDisplayDate } from '../lib/date';
import { Category, RecurringTemplate } from '../types';

interface RecurringExpenseItemProps {
  item: RecurringTemplate;
  category?: Category;
  currency: string;
  onToggle: (id: number, currentActive: boolean) => void;
  onDelete: (id: number) => void;
}

const FREQUENCY_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const FREQUENCY_COLOR: Record<string, string> = {
  daily: 'bg-purple-100 dark:bg-purple-900/30',
  weekly: 'bg-blue-100 dark:bg-blue-900/30',
  monthly: 'bg-green-100 dark:bg-green-900/30',
};

const FREQUENCY_TEXT: Record<string, string> = {
  daily: 'text-purple-700 dark:text-purple-300',
  weekly: 'text-blue-700 dark:text-blue-300',
  monthly: 'text-green-700 dark:text-green-300',
};

export const RecurringExpenseItem = React.memo(
  ({ item, category, currency, onToggle, onDelete }: RecurringExpenseItemProps) => {
    const color = category?.color ?? '#94a3b8';
    const categoryName = category?.name ?? 'Unknown';
    const freq = item.recurrence_frequency ?? 'monthly';

    // DB stores INTEGER 0/1, not boolean — use truthy check
    const isActive = !!item.is_active;

    return (
      <View
        className={`flex-row items-center p-4 mb-2 rounded-xl shadow-sm border ${
          isActive
            ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'
            : 'bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 opacity-60'
        }`}
        accessibilityRole="summary"
        accessibilityLabel={`${isActive ? 'Active' : 'Paused'} recurring ${categoryName} expense: ${formatCurrency(item.amount, currency)}, ${FREQUENCY_LABEL[freq]}`}
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
            {categoryName}
          </Text>
          {item.note ? (
            <Text className="text-gray-500 dark:text-gray-400 text-sm" numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-2 mt-1">
            <View className={`px-2 py-0.5 rounded-full ${FREQUENCY_COLOR[freq]}`}>
              <View className="flex-row items-center gap-1">
                <Repeat size={10} color={freq === 'daily' ? '#a855f7' : freq === 'weekly' ? '#3b82f6' : '#22c55e'} />
                <Text className={`text-xs font-medium ${FREQUENCY_TEXT[freq]}`}>
                  {FREQUENCY_LABEL[freq]}
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 dark:text-gray-500 text-xs">
              Added {formatDisplayDate(item.created_at)}
            </Text>
          </View>
        </View>
        <View className="items-end gap-2">
          <Text className="font-bold text-slate-800 dark:text-gray-100 text-base">
            {formatCurrency(item.amount, currency)}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => onToggle(item.id, isActive)}
              className="p-1"
              accessibilityRole="button"
              accessibilityLabel={isActive ? `Pause recurring ${categoryName} expense` : `Resume recurring ${categoryName} expense`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isActive ? (
                <ToggleRight size={20} color="#3b82f6" />
              ) : (
                <ToggleLeft size={20} color="#94a3b8" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              className="p-1"
              accessibilityRole="button"
              accessibilityLabel={`Delete recurring ${categoryName} expense`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);

RecurringExpenseItem.displayName = 'RecurringExpenseItem';
