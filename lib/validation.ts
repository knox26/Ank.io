import { parseCurrencyInput } from './currency';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate expense input before submission.
 */
export function validateExpenseInput(
  amountStr: string,
  categoryId: number | null
): ValidationResult {
  if (!amountStr.trim()) {
    return { valid: false, error: 'Amount is required' };
  }

  const cents = parseCurrencyInput(amountStr);
  if (cents === null) {
    return { valid: false, error: 'Enter a valid amount (e.g., 12.50)' };
  }

  if (cents === 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  if (categoryId === null) {
    return { valid: false, error: 'Please select a category' };
  }

  return { valid: true };
}

/**
 * Validate category input before creation.
 */
export function validateCategoryInput(
  name: string,
  icon: string,
  color: string
): ValidationResult {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { valid: false, error: 'Category name is required' };
  }

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 20) {
    return { valid: false, error: 'Name must be 20 characters or less' };
  }

  if (!icon) {
    return { valid: false, error: 'Please select an icon' };
  }

  if (!color) {
    return { valid: false, error: 'Please select a color' };
  }

  return { valid: true };
}

/**
 * Validate budget limit input.
 */
export function validateBudgetInput(amountStr: string): ValidationResult {
  if (!amountStr.trim()) {
    return { valid: false, error: 'Budget amount is required' };
  }

  const cents = parseCurrencyInput(amountStr);
  if (cents === null) {
    return { valid: false, error: 'Enter a valid amount (e.g., 500.00)' };
  }

  // Budget of 0 is allowed (means no limit)
  return { valid: true };
}
