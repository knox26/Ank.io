import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from './useTheme';
import { formatAsYouType, parseCurrencyInput } from '../lib/currency';
import { showError, showSuccess } from '../lib/toast';
import { useTemplateStore } from '../store/useTemplateStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { TemplateRepository } from '../services/TemplateRepository';

export function useTemplateForm() {
  const params = useLocalSearchParams<{ templateId?: string }>();
  const isEditing = !!params.templateId;

  const categories = useCategoryStore((s) => s.categories);
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const updateTemplate = useTemplateStore((s) => s.updateTemplate);
  const currency = useSettingsStore((s) => s.currency);
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(isEditing);

  useEffect(() => {
    if (!params.templateId) return;
    const id = parseInt(params.templateId, 10);
    TemplateRepository.getTemplateById(id).then((template) => {
      if (template) {
        setName(template.name);
        setAmount(formatAsYouType((template.amount / 100).toFixed(2)));
        setSelectedCategoryId(template.category_id);
        setNote(template.note || '');
      }
      setLoadingTemplate(false);
    });
  }, [params.templateId]);

  const validate = useCallback((): string | null => {
    if (!name.trim()) return 'Template name is required';
    if (name.trim().length > 100) return 'Name must be 100 characters or less';
    if (!amount.trim()) return 'Amount is required';
    const cents = parseCurrencyInput(amount);
    if (cents === null || cents === 0) return 'Enter a valid positive amount';
    if (selectedCategoryId === null) return 'Please select a category';
    return null;
  }, [name, amount, selectedCategoryId]);

  const handleSubmit = useCallback(async () => {
    const error = validate();
    if (error) {
      showError('Invalid Input', error);
      return;
    }

    setIsSaving(true);
    const cents = parseCurrencyInput(amount)!;

    let success: boolean;
    if (isEditing) {
      success = await updateTemplate(parseInt(params.templateId!, 10), {
        name: name.trim(),
        amount: cents,
        category_id: selectedCategoryId!,
        note: note.trim() || undefined,
      });
    } else {
      const result = await addTemplate({
        name: name.trim(),
        amount: cents,
        category_id: selectedCategoryId!,
        note: note.trim() || undefined,
      });
      success = result !== null;
    }

    setIsSaving(false);
    if (success) {
      showSuccess(isEditing ? 'Template updated' : 'Template created');
      router.back();
    }
  }, [name, amount, note, selectedCategoryId, isEditing, params.templateId, validate, addTemplate, updateTemplate]);

  const isFormValid = name.trim().length > 0 && amount.length > 0 && selectedCategoryId !== null;

  return {
    categories,
    currency,
    colors,
    name,
    amount,
    note,
    selectedCategoryId,
    isSaving,
    isEditing,
    loadingTemplate,
    setName,
    setAmount: (v: string) => setAmount(formatAsYouType(v)),
    setNote,
    setSelectedCategoryId,
    handleSubmit,
    isFormValid,
  };
}
