import { Pencil, Trash2 } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, PanResponder, Text, TouchableOpacity, View } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../lib/currency';
import { Category, ExpenseTemplate } from '../types';

const SWIPE_THRESHOLD = 80;
const DELETE_BG_WIDTH = 80;

interface TemplateItemProps {
  template: ExpenseTemplate;
  category?: Category;
  currency: string;
  onPress: (template: ExpenseTemplate) => void;
  onEdit: (template: ExpenseTemplate) => void;
  onDelete: (template: ExpenseTemplate) => void;
  onSwipeDelete: (template: ExpenseTemplate) => void;
}

export const TemplateItem = React.memo(
  ({ template, category, currency, onPress, onEdit, onDelete, onSwipeDelete }: TemplateItemProps) => {
    const color = category?.color ?? '#94a3b8';
    const categoryName = category?.name ?? 'Unknown';

    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
        onPanResponderMove: (_, gs) => {
          translateX.setValue(Math.min(0, gs.dx));
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dx < -SWIPE_THRESHOLD) {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
            onSwipeDelete(template);
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
        >
          <TouchableOpacity
            onPress={() => onPress(template)}
            activeOpacity={0.7}
            className="flex-row items-center flex-1"
            accessibilityRole="button"
            accessibilityLabel={`Use template ${template.name}: ${formatCurrency(template.amount, currency)}, ${categoryName}. Swipe left to delete.`}
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
            <View className="items-end">
              <Text className="font-bold text-slate-800 dark:text-gray-100 text-base mr-3">
                {formatCurrency(template.amount, currency)}
              </Text>
            </View>
          </TouchableOpacity>
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
        </Animated.View>
      </View>
    );
  }
);

TemplateItem.displayName = 'TemplateItem';
