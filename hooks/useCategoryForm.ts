import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { parseCurrencyInput } from '../lib/currency';
import { validateCategoryInput } from '../lib/validation';
import { showError } from '../lib/toast';
import { useCategoryStore } from '../store/useCategoryStore';
import { CATEGORY_COLORS } from '../constants/Icons';

export function useCategoryForm() {
  const router = useRouter();
  const addCategory = useCategoryStore((s) => s.addCategory);
  const { isDark, colors } = useTheme();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('layers');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const validation = validateCategoryInput(name, selectedIcon, selectedColor);
    if (!validation.valid) {
      showError('Invalid Input', validation.error);
      return;
    }

    let budgetCents = 0;
    if (budgetLimit.trim()) {
      const parsed = parseCurrencyInput(budgetLimit);
      if (parsed === null) {
        showError('Invalid Budget', 'Please enter a valid budget amount');
        return;
      }
      budgetCents = parsed;
    }

    setIsSaving(true);
    const success = await addCategory({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      budget_limit: budgetCents,
      is_archived: false,
    });

    setIsSaving(false);
    if (success) {
      router.back();
    }
  }, [name, selectedIcon, selectedColor, budgetLimit, addCategory, router]);

  const isFormValid = name.trim().length > 0 && !isSaving;

  return {
    isDark,
    colors,
    name,
    selectedIcon,
    selectedColor,
    budgetLimit,
    isSaving,
    setName,
    setSelectedIcon,
    setSelectedColor,
    setBudgetLimit,
    handleSave,
    isFormValid,
  };
}
