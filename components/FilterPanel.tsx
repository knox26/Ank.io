import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Calendar,
  ChevronDown,
  Filter,
  X,
} from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Category } from '../types';
import { useTheme } from '../hooks/useTheme';

interface FilterPanelProps {
  categories: Category[];
  selectedCategoryId: number | null;
  startDateStr: string;
  endDateStr: string;
  showFilters: boolean;
  showStartPicker: boolean;
  showEndPicker: boolean;
  isFiltering: boolean;
  onCategorySelect: (id: number | null) => void;
  onToggleFilters: () => void;
  onShowStartPicker: () => void;
  onShowEndPicker: () => void;
  onStartChange: (event: any, date?: Date) => void;
  onEndChange: (event: any, date?: Date) => void;
  onClearFilters: () => void;
}

/**
 * Extracted filter panel component for the expenses screen.
 */
export const FilterPanel = React.memo(
  ({
    categories,
    selectedCategoryId,
    startDateStr,
    endDateStr,
    showFilters,
    showStartPicker,
    showEndPicker,
    isFiltering,
    onCategorySelect,
    onToggleFilters,
    onShowStartPicker,
    onShowEndPicker,
    onStartChange,
    onEndChange,
    onClearFilters,
  }: FilterPanelProps) => {
    const { colors } = useTheme();

    return (
      <View className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <View className="px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Filter size={18} color={colors.iconMuted} />
            <Text className="ml-2 text-slate-600 dark:text-slate-400 font-semibold uppercase text-xs tracking-wider">
              Filters
            </Text>
            {isFiltering && (
              <View className="ml-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                  ACTIVE
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={onToggleFilters}
            className="flex-row items-center"
            accessibilityRole="button"
            accessibilityLabel={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium mr-1">
              {showFilters ? 'Hide' : 'Show'}
            </Text>
            <ChevronDown
              size={16}
              color="#2563eb"
              style={{
                transform: [{ rotate: showFilters ? '180deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View className="px-4 pb-4 space-y-6">
            {/* Category Chips */}
            <View>
              <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase mb-2">
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                <TouchableOpacity
                  onPress={() => onCategorySelect(null)}
                  className={`px-4 py-2 rounded-full mr-2 border ${
                    selectedCategoryId === null
                      ? 'bg-slate-800 border-slate-800 dark:bg-white dark:border-white'
                      : 'bg-transparent border-gray-200 dark:border-slate-700'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Show all categories"
                  accessibilityState={{ selected: selectedCategoryId === null }}
                >
                  <Text
                    className={
                      selectedCategoryId === null
                        ? 'text-white dark:text-slate-900 font-bold'
                        : 'text-gray-500'
                    }
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => onCategorySelect(cat.id)}
                    className={`px-4 py-2 rounded-full mr-2 border ${
                      selectedCategoryId === cat.id
                        ? 'bg-slate-800 border-slate-800 dark:bg-white dark:border-white'
                        : 'bg-transparent border-gray-200 dark:border-slate-700'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${cat.name}`}
                    accessibilityState={{ selected: selectedCategoryId === cat.id }}
                  >
                    <Text
                      className={
                        selectedCategoryId === cat.id
                          ? 'text-white dark:text-slate-900 font-bold'
                          : 'text-gray-500'
                      }
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Date Range */}
            <View>
              <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase mb-2 mt-2">
                Date Range
              </Text>
              <View className="flex-row items-center space-x-2">
                <TouchableOpacity
                  onPress={onShowStartPicker}
                  className="flex-1 flex-row items-center bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700"
                  accessibilityRole="button"
                  accessibilityLabel={`Start date: ${startDateStr || 'not set'}`}
                >
                  <Calendar size={14} color="#94a3b8" />
                  <Text
                    className={`ml-2 text-sm ${
                      startDateStr
                        ? 'text-slate-900 dark:text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {startDateStr || 'Start Date'}
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-400 mx-2">to</Text>
                <TouchableOpacity
                  onPress={onShowEndPicker}
                  className="flex-1 flex-row items-center bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700"
                  accessibilityRole="button"
                  accessibilityLabel={`End date: ${endDateStr || 'not set'}`}
                >
                  <Calendar size={14} color="#94a3b8" />
                  <Text
                    className={`ml-2 text-sm ${
                      endDateStr
                        ? 'text-slate-900 dark:text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {endDateStr || 'End Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startDateStr ? new Date(startDateStr) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onStartChange}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endDateStr ? new Date(endDateStr) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onEndChange}
                  minimumDate={
                    startDateStr ? new Date(startDateStr) : undefined
                  }
                />
              )}
            </View>

            {isFiltering && (
              <TouchableOpacity
                onPress={onClearFilters}
                className="flex-row items-center justify-center py-2 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg mt-2"
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <X size={14} color="#ef4444" />
                <Text className="ml-2 text-red-500 font-medium text-xs">
                  Clear All Filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }
);

FilterPanel.displayName = 'FilterPanel';
