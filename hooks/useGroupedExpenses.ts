import { useMemo } from 'react';
import { getLocalDateString, formatDisplayDate } from '../lib/date';
import { Expense, ExpenseListItem } from '../types';

export function useGroupedExpenses(filteredExpenses: Expense[]): ExpenseListItem[] {
  return useMemo(() => {
    const grouped: Record<string, Expense[]> = {};

    for (const expense of filteredExpenses) {
      const date = getLocalDateString(expense.date);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(expense);
    }

    const data: ExpenseListItem[] = [];
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    for (const date of sortedDates) {
      data.push({
        type: 'header',
        id: `header-${date}`,
        title: formatDisplayDate(date),
      });
      for (const expense of grouped[date]) {
        data.push({ type: 'item', ...expense });
      }
    }

    return data;
  }, [filteredExpenses]);
}
