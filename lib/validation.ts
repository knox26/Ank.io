import { parseCurrencyInput } from './currency';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Strip control characters from text, keeping tab and newline.
 * Trims whitespace.
 */
export function sanitizeText(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x1F\x7F-\x9F]/g, '').trim();
}

/**
 * Validate expense input before submission.
 */
export function validateExpenseInput(
  amountStr: string,
  categoryId: number | null,
  note?: string
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

  if (note !== undefined) {
    const trimmedNote = note.trim();
    if (trimmedNote.length > 0) {
      if (trimmedNote.length > 500) {
        return { valid: false, error: 'Note must be 500 characters or less' };
      }
      if (/[\x00-\x08\x0B-\x1F\x7F-\x9F]/.test(trimmedNote)) {
        return { valid: false, error: 'Note contains invalid characters' };
      }
    }
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

  if (/[\x00-\x1F\x7F-\x9F]/.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
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
