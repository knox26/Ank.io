import { useCallback, useEffect, useState } from 'react';
import { showError } from '../lib/toast';
import { showThemedConfirm } from '../lib/confirm';
import { RecurringRepository } from '../services/RecurringRepository';
import { useExpenseStore } from '../store/useExpenseStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { RecurringTemplate } from '../types';

export function useRecurringExpenses() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);
  const deleteRecurringTemplate = useExpenseStore((s) => s.deleteRecurringTemplate);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await RecurringRepository.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load recurring templates:', error);
      showError('Load Failed', 'Could not load recurring expenses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = useCallback(
    async (id: number, currentActive: boolean) => {
      if (currentActive) {
        await RecurringRepository.deactivateTemplate(id);
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: false } : t))
        );
      } else {
        await RecurringRepository.reactivateTemplate(id);
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: true } : t))
        );
      }
    },
    []
  );

  const handleDelete = useCallback(
    (id: number) => {
      showThemedConfirm({
        title: 'Delete Recurring Expense',
        message: 'This will permanently delete this recurring pattern. Past instances will be kept as historical records.',
        confirmText: 'Delete',
        confirmStyle: 'destructive',
        onConfirm: async () => {
          const success = await deleteRecurringTemplate(id);
          if (success) {
            setTemplates((prev) => prev.filter((t) => t.id !== id));
          }
        },
      });
    },
    [deleteRecurringTemplate]
  );

  return {
    templates,
    isLoading,
    categoryMap,
    currency,
    handleToggle,
    handleDelete,
    onRefresh: load,
  };
}
