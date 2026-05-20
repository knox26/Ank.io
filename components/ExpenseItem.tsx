import { Repeat, Trash2 } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, PanResponder, Text, TouchableOpacity, View } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../lib/currency';
import { formatDisplayTime } from '../lib/date';
import { Category, Expense } from '../types';

const SWIPE_THRESHOLD = 80;
const DELETE_BG_WIDTH = 80;

interface ExpenseItemProps {
  item: Expense;
  category?: Category;
  currency: string;
  onDelete: (expense: Expense) => void;
  onSwipeDelete: (expense: Expense) => void;
}

export const ExpenseItem = React.memo(
  ({ item, category, currency, onDelete, onSwipeDelete }: ExpenseItemProps) => {
    const color = category?.color ?? '#94a3b8';
    const categoryName = category?.name ?? 'Unknown';

    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
        onPanResponderMove: (_, gs) => {
          const tx = Math.min(0, gs.dx);
          translateX.setValue(tx);
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dx < -SWIPE_THRESHOLD) {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
            onSwipeDelete(item);
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 6,
            }).start();
          }
        },
      })
    ).current;

    return (
      <View className="mb-2 rounded-xl overflow-hidden">
        <View
          className="absolute right-0 top-0 bottom-0 bg-red-500 items-center justify-center rounded-xl"
          style={{ width: DELETE_BG_WIDTH }}
        >
          <Trash2 size={20} color="#fff" />
        </View>

        <Animated.View
          {...panResponder.panHandlers}
          className="flex-row items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800"
          style={{ transform: [{ translateX }] }}
          accessibilityRole="summary"
          accessibilityLabel={`${categoryName} expense: ${formatCurrency(item.amount, currency)}. Swipe left to delete.`}
        >
          <View
            className="p-3 rounded-full mr-4"
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
              <Text
                className="text-gray-500 dark:text-gray-400 text-sm"
                numberOfLines={1}
              >
                {item.note}
              </Text>
            ) : null}
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-gray-400 dark:text-gray-500 text-xs">
                {formatDisplayTime(item.date)}
              </Text>
              {item.is_recurring ? (
                <View className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                  <Repeat size={10} color="#3b82f6" />
                </View>
              ) : null}
            </View>
          </View>
          <View className="items-end">
            <Text className="font-bold text-slate-800 dark:text-gray-100 text-base">
              {formatCurrency(item.amount, currency)}
            </Text>
            <TouchableOpacity
              onPress={() => onDelete(item)}
              className="mt-1 p-1"
              accessibilityRole="button"
              accessibilityLabel={`Delete ${categoryName} expense`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }
);

ExpenseItem.displayName = 'ExpenseItem';
