/**
 * Currency utilities for converting between cents (storage) and display values.
 * All amounts are stored as INTEGER cents to avoid floating-point rounding errors.
 */

const MAX_AMOUNT_CENTS = 99_999_999_999; // $999,999,999.99

/**
 * Convert cents to a display string with currency symbol.
 * e.g., formatCurrency(1250, '$') → '$12.50'
 */
export function formatCurrency(cents: number, symbol: string): string {
  const dollars = cents / 100;
  return `${symbol}${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert cents to a compact display string (no trailing decimals if whole).
 * e.g., formatCurrencyCompact(1200, '$') → '$12'
 *       formatCurrencyCompact(1250, '$') → '$12.50'
 */
export function formatCurrencyCompact(cents: number, symbol: string): string {
  const dollars = cents / 100;
  if (dollars % 1 === 0) {
    return `${symbol}${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return `${symbol}${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert cents to a dollar number for display.
 * e.g., centsToDollars(1250) → 12.50
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Parse a user-typed currency string into cents.
 * Returns null if the input is invalid.
 *
 * Validation rules:
 * - Must be a valid number
 * - Must be non-negative
 * - Maximum 2 decimal places
 * - Maximum value: $999,999,999.99
 * - Cannot be NaN, Infinity, or empty
 */
/** Format number string with commas as the user types. Handles cursor-safe formatting. */
export function formatAsYouType(value: string): string {
  const clean = value.replace(/[^0-9.]/g, '');
  if (!clean) return '';
  const parts = clean.split('.');
  if (parts.length > 2) parts.splice(2);
  if (parts[0]) {
    parts[0] = Number(parts[0]).toLocaleString('en-US');
  }
  return parts.join('.');
}

/** Strip commas from a formatted string for raw editing */
export function stripCommas(value: string): string {
  return value.replace(/,/g, '');
}

export function parseCurrencyInput(input: string): number | null {
  if (input.length > 50) return null;
  const trimmed = input.replace(/,/g, '').trim();
  if (!trimmed) return null;
  if (/\s/.test(trimmed)) return null;
  if (/^[0-9.,+\-\s]*[eE]/.test(trimmed)) return null;

  const num = parseFloat(trimmed);

  if (!Number.isFinite(num)) return null;
  if (num < 0) return null;

  // Check max 2 decimal places
  const parts = trimmed.split('.');
  if (parts.length === 2 && parts[1].length > 2) return null;

  const cents = Math.round(num * 100);
  if (cents > MAX_AMOUNT_CENTS) return null;

  return cents;
}
