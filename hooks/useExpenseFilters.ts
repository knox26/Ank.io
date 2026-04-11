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
    return expenses.filter((expense) => {
      // Category filter
      if (selectedCategoryId !== null && expense.category_id !== selectedCategoryId) {
        return false;
      }

      // Date range filter
      if (startDateStr || endDateStr) {
        const expenseDate = new Date(expense.date).getTime();

        if (startDateStr) {
          const start = new Date(startDateStr).getTime();
          if (!isNaN(start) && expenseDate < start) return false;
        }

        if (endDateStr) {
          const end = new Date(endDateStr);
          end.setHours(23, 59, 59, 999);
          if (!isNaN(end.getTime()) && expenseDate > end.getTime()) return false;
        }
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
