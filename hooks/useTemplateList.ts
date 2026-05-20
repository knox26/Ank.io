import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { showThemedConfirm } from '../lib/confirm';
import { useTemplateStore } from '../store/useTemplateStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ExpenseTemplate } from '../types';

export function useTemplateList() {
  const router = useRouter();

  const templates = useTemplateStore((s) => s.templates);
  const isLoading = useTemplateStore((s) => s.isLoading);
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);
  const loadTemplates = useTemplateStore((s) => s.loadTemplates);

  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);

  const handleDelete = useCallback(
    (id: number) => {
      showThemedConfirm({
        title: 'Delete Template',
        message: 'This will permanently delete this expense template.',
        confirmText: 'Delete',
        confirmStyle: 'destructive',
        onConfirm: () => deleteTemplate(id),
      });
    },
    [deleteTemplate]
  );

  const handleEdit = useCallback(
    (template: ExpenseTemplate) => {
      router.push({ pathname: '/add-template' as any, params: { templateId: template.id } });
    },
    [router]
  );

  const handleUseTemplate = useCallback(
    async (template: ExpenseTemplate) => {
      if (template.category_id === null) {
        return;
      }
      await useExpenseStore.getState().addExpense({
        amount: template.amount,
        category_id: template.category_id,
        date: new Date().toISOString(),
        note: template.note || undefined,
        is_recurring: false,
        recurrence_frequency: null,
        recurring_template_id: null,
      });
    },
    []
  );

  return {
    templates,
    isLoading,
    categoryMap,
    currency,
    handleDelete,
    handleEdit,
    handleUseTemplate,
    onRefresh: loadTemplates,
  };
}
