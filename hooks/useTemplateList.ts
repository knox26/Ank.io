import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { showError, showSuccess } from '../lib/toast';
import { showThemedConfirm } from '../lib/confirm';
import { TemplateRepository } from '../services/TemplateRepository';
import { useTemplateStore } from '../store/useTemplateStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ExpenseTemplate } from '../types';

export function useTemplateList() {
  const router = useRouter();

  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoryMap = useCategoryStore((s) => s.categoryMap);
  const currency = useSettingsStore((s) => s.currency);
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await TemplateRepository.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load expense templates:', error);
      showError('Load Failed', 'Could not load expense templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    (id: number) => {
      showThemedConfirm({
        title: 'Delete Template',
        message: 'This will permanently delete this expense template.',
        confirmText: 'Delete',
        confirmStyle: 'destructive',
        onConfirm: async () => {
          const success = await deleteTemplate(id);
          if (success) {
            setTemplates((prev) => prev.filter((t) => t.id !== id));
          }
        },
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
        showError('Invalid Template', 'Template has no category assigned.');
        return;
      }
      const success = await useExpenseStore.getState().addExpense({
        amount: template.amount,
        category_id: template.category_id,
        date: new Date().toISOString(),
        note: template.note || undefined,
        is_recurring: false,
        recurrence_frequency: null,
        recurring_template_id: null,
      });
      if (success) {
        showSuccess('Expense added');
      }
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
    onRefresh: load,
  };
}
