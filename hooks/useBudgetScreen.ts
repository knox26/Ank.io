import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useCategoryStore } from '../store/useCategoryStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useBudgetScreen() {
  const categories = useCategoryStore((s) => s.categories);
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const { isDark } = useTheme();
  const router = useRouter();

  const handleEdit = useCallback(
    (id: number) => {
      router.push(`/edit-budget?categoryId=${id}`);
    },
    [router]
  );

  return {
    categories,
    currency,
    isDark,
    handleEdit,
    setCurrency,
  };
}
