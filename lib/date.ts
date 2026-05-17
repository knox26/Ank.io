import { DateRange } from '../types';

/**
 * Date utilities for consistent date handling across the app.
 * All dates are stored as ISO 8601 strings in SQLite.
 */

/**
 * Get the date range boundaries for a given year/month.
 * Returns { start: first day inclusive, end: first day of next month exclusive }
 * This enables index-friendly range queries: WHERE date >= start AND date < end
 */
export function getMonthDateRange(year: number, month: number): DateRange {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return {
    start: toISODateString(start),
    end: toISODateString(end),
  };
}

/**
 * Get the current month's date range.
 */
export function getCurrentMonthRange(): DateRange {
  const now = new Date();
  return getMonthDateRange(now.getFullYear(), now.getMonth());
}

/**
 * Convert a Date to a YYYY-MM-DD string (local timezone).
 */
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Safely extracts the local date portion from an ISO string (YYYY-MM-DD).
 * Handles timezone offsets to avoid date shifting.
 */
export function getLocalDateString(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return toISODateString(new Date());

    // Convert to local YYYY-MM-DD string
    return toISODateString(d);
  } catch {
    return toISODateString(new Date());
  }
}

/**
 * Format a date for display in locale-aware short format.
 * e.g., "Mon, Apr 4"
 */
export function formatDisplayDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date for display as time only.
 * e.g., "02:30 PM"
 */
export function formatDisplayTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Get the month label for a YYYY-MM string.
 * e.g., "2026-04" → "Apr"
 */
export function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString('default', { month: 'short' });
}

export function getCurrentMonthName(): string {
  return new Date().toLocaleString('default', { month: 'long' });
}
