import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { parseCurrencyInput } from '../lib/currency';
import { validateExpenseInput } from '../lib/validation';
import { showError } from '../lib/toast';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useExpenseForm() {
  const categories = useCategoryStore((s) => s.categories);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const currency = useSettingsStore((s) => s.currency);
  const { colors } = useTheme();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleRecurring = useCallback(() => {
    setIsRecurring((prev) => {
      if (!prev) setIsTemplate(false);
      return !prev;
    });
  }, []);

  const handleToggleTemplate = useCallback(() => {
    setIsTemplate((prev) => {
      if (!prev) setIsRecurring(false);
      return !prev;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const name = note.trim();
    if (isTemplate && !name) {
      showError('Name Required', 'Enter a name for the template');
      return;
    }

    const validation = validateExpenseInput(amount, selectedCategoryId, note);
    if (!validation.valid) {
      showError('Invalid Input', validation.error);
      return;
    }

    const cents = parseCurrencyInput(amount);
    if (cents === null || cents === 0) {
      showError('Invalid Amount', 'Please enter a valid positive amount');
      return;
    }

    setIsSaving(true);

    let success: boolean;
    if (isTemplate) {
      const result = await addTemplate({
        name,
        amount: cents,
        category_id: selectedCategoryId!,
        note: name,
      });
      success = result !== null;
    } else if (isRecurring) {
      success = await useExpenseStore.getState().addRecurringExpense({
        amount: cents,
        category_id: selectedCategoryId!,
        note: note.trim() || undefined,
        recurrence_frequency: recurrenceFrequency,
      });
    } else {
      success = await addExpense({
        amount: cents,
        category_id: selectedCategoryId!,
        date: new Date().toISOString(),
        note: note.trim() || undefined,
        is_recurring: false,
        recurrence_frequency: null,
        recurring_template_id: null,
      });
    }

    setIsSaving(false);
    if (success) {
      router.back();
    }
  }, [amount, note, selectedCategoryId, isRecurring, isTemplate, recurrenceFrequency, addExpense, addTemplate]);

  const isFormValid = amount.length > 0 && selectedCategoryId !== null;

  const saveLabel = isSaving
    ? 'Saving...'
    : isTemplate
      ? 'Save Template'
      : isRecurring
        ? 'Save Recurring'
        : 'Save Expense';

  return {
    categories,
    currency,
    colors,
    amount,
    note,
    selectedCategoryId,
    isSaving,
    isRecurring,
    isTemplate,
    recurrenceFrequency,
    saveLabel,
    setAmount,
    setNote,
    setSelectedCategoryId,
    handleToggleRecurring,
    handleToggleTemplate,
    setRecurrenceFrequency,
    handleSubmit,
    isFormValid,
  };
}
