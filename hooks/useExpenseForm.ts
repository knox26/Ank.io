import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { parseCurrencyInput } from '../lib/currency';
import { validateExpenseInput } from '../lib/validation';
import { showError } from '../lib/toast';
import { useExpenseStore } from '../store/useExpenseStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useExpenseForm() {
  const categories = useCategoryStore((s) => s.categories);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const currency = useSettingsStore((s) => s.currency);
  const { colors } = useTheme();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
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
    if (isRecurring) {
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
  }, [amount, note, selectedCategoryId, isRecurring, recurrenceFrequency, addExpense]);

  const isFormValid = amount.length > 0 && selectedCategoryId !== null;

  return {
    categories,
    currency,
    colors,
    amount,
    note,
    selectedCategoryId,
    isSaving,
    isRecurring,
    recurrenceFrequency,
    setAmount,
    setNote,
    setSelectedCategoryId,
    setIsRecurring,
    setRecurrenceFrequency,
    handleSubmit,
    isFormValid,
  };
}
