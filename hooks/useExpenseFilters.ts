import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Expense } from '../types';
import { toISODateString } from '../lib/date';

/**
 * Encapsulates all expense filter state and logic.
 * Extracted from expenses.tsx to separate concerns.
 */
export function useExpenseFilters(expenses: Expense[]) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const isFiltering =
    selectedCategoryId !== null || startDateStr !== '' || endDateStr !== '';

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setStartDateStr('');
    setEndDateStr('');
  };

  const onStartChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDateStr(toISODateString(selectedDate));
    }
  };

  const onEndChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDateStr(toISODateString(selectedDate));
    }
  };

  const filteredExpenses = useMemo(() => {
    // Precompute filter boundaries once, not per expense
    const startTime = startDateStr ? new Date(startDateStr).getTime() : null;
    let endTime: number | null = null;
    if (endDateStr) {
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      endTime = end.getTime();
    }

    // Memoize date → epoch parsing — recurring expenses share dates
    const dateCache = new Map<string, number>();
    const parseDate = (dateStr: string) => {
      const cached = dateCache.get(dateStr);
      if (cached !== undefined) return cached;
      const parsed = new Date(dateStr).getTime();
      dateCache.set(dateStr, parsed);
      return parsed;
    };

    return expenses.filter((expense) => {
      // Category filter
      if (selectedCategoryId !== null && expense.category_id !== selectedCategoryId) {
        return false;
      }

      // Date range filter
      if (startTime !== null || endTime !== null) {
        const expenseDate = parseDate(expense.date);

        if (startTime !== null && !isNaN(startTime) && expenseDate < startTime) return false;
        if (endTime !== null && !isNaN(endTime) && expenseDate > endTime) return false;
      }

      return true;
    });
  }, [expenses, selectedCategoryId, startDateStr, endDateStr]);

  return {
    // State
    selectedCategoryId,
    startDateStr,
    endDateStr,
    showFilters,
    showStartPicker,
    showEndPicker,
    isFiltering,
    filteredExpenses,

    // Actions
    setSelectedCategoryId,
    setShowFilters,
    setShowStartPicker,
    setShowEndPicker,
    clearFilters,
    onStartChange,
    onEndChange,
  };
}
