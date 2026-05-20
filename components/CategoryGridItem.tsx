import { AlertTriangle, Trash2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrencyCompact } from '../lib/currency';
import { Category } from '../types';

const WARNING_THRESHOLD = 0.95;
const EXCEEDED_THRESHOLD = 1.0;

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
    const hasBudget = category.budget_limit > 0;
    const usageRatio = hasBudget ? spentAmount / category.budget_limit : 0;
    const showWarning = usageRatio >= WARNING_THRESHOLD;
    const isExceeded = usageRatio >= EXCEEDED_THRESHOLD;

    const pulse = useSharedValue(1);

    // Start pulse when exceeded, reset otherwise
    React.useEffect(() => {
      if (isExceeded) {
        pulse.value = withRepeat(
          withSequence(
            withTiming(0.25, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          true
        );
      } else {
        pulse.value = 1;
      }
    }, [isExceeded, pulse]);

    const pulseStyle = useAnimatedStyle(() => ({
      opacity: pulse.value,
    }));

    const warningColor = isExceeded ? '#ef4444' : '#f59e0b';
    const borderStyle = isExceeded
      ? 'border-red-300 dark:border-red-800'
      : showWarning
        ? 'border-amber-300 dark:border-amber-800'
        : 'border-gray-100 dark:border-slate-800';

    const accessibilityLabel = useMemo(() => {
      const spent = formatCurrencyCompact(spentAmount, currency);
      const limit = formatCurrencyCompact(category.budget_limit, currency);
      const pct = Math.round(usageRatio * 100);
      let label = `${category.name}: spent ${spent} of ${limit} budget`;
      if (isExceeded) label += `, budget exceeded at ${pct}%`;
      else if (showWarning) label += `, near budget limit at ${pct}%`;
      return label;
    }, [category.name, spentAmount, category.budget_limit, currency, usageRatio, showWarning, isExceeded]);

    return (
      <View
        className={`bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 shadow-sm border ${borderStyle}`}
        style={{ width: '48%' }}
        accessibilityRole="summary"
        accessibilityLabel={accessibilityLabel}
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
            {showWarning && (
              <Animated.View style={isExceeded ? pulseStyle : undefined}>
                <AlertTriangle
                  size={16}
                  color={warningColor}
                  style={{ marginRight: 4 }}
                />
              </Animated.View>
            )}
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
        {hasBudget && (
          <View className="h-1 bg-gray-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(usageRatio * 100, 100)}%`,
                backgroundColor: isExceeded
                  ? warningColor
                  : showWarning
                    ? warningColor
                    : category.color,
                opacity: isExceeded ? 1 : showWarning ? 0.8 : 0.5,
              }}
            />
          </View>
        )}
      </View>
    );
  }
);

CategoryGridItem.displayName = 'CategoryGridItem';
