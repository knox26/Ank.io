import { useCallback } from 'react';
import { showError } from '../lib/toast';
import { showThemedConfirm } from '../lib/confirm';
import { useRecurringStore } from '../store/useRecurringStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useRecurringExpenses() {
  const templates = useRecurringStore((s) => s.templates);
  const isLoading = useRecurringStore((s) => s.isLoading);
  const loadTemplates = useRecurringStore((s) => s.loadTemplates);
  const toggleActive = useRecurringStore((s) => s.toggleActive);
  const deleteTemplate = useRecurringStore((s) => s.deleteTemplate);

  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);

  const handleToggle = useCallback(
    async (id: number, currentActive: boolean) => {
      await toggleActive(id, currentActive);
    },
    [toggleActive]
  );

  const handleDelete = useCallback(
    (id: number) => {
      showThemedConfirm({
        title: 'Delete Recurring Expense',
        message: 'This will permanently delete this recurring pattern. Past instances will be kept as historical records.',
        confirmText: 'Delete',
        confirmStyle: 'destructive',
        onConfirm: async () => {
          const success = await deleteTemplate(id);
          if (!success) {
            showError('Delete Failed', 'Could not delete recurring expense.');
          }
        },
      });
    },
    [deleteTemplate]
  );

  return {
    templates,
    isLoading,
    categoryMap,
    currency,
    handleToggle,
    handleDelete,
    onRefresh: loadTemplates,
  };
}
