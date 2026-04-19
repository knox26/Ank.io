// ─── Domain Models ───────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  /** Monthly budget limit stored in cents (e.g., 1250 = $12.50) */
  budget_limit: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  /** Amount stored in cents (e.g., 1250 = $12.50) */
  amount: number;
  /** Nullable — set to NULL when referenced category is deleted */
  category_id: number | null;
  /** ISO 8601 date string */
  date: string;
  note?: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Settings ────────────────────────────────────────────────────

export interface AppSettings {
  currency: string;
  theme: 'light' | 'dark' | 'system';
}

// ─── List Types ──────────────────────────────────────────────────

/** Discriminated union for FlashList mixed-type data */
export type ExpenseListItem =
  | { type: 'header'; id: string; title: string }
  | ({ type: 'item' } & Expense);

// ─── Utility Types ───────────────────────────────────────────────

export type Period = 'month' | 'year';

/** @deprecated Use CursorParams for stable pagination */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Cursor-based pagination for stable page loading.
 * Uses the (date, id) composite key matching the sort order.
 * Unlike offset-based pagination, deleting items between pages
 * cannot cause skipped or duplicated rows.
 */
export interface CursorParams {
  limit: number;
  /** Pass the last item's date + id from the previous page to load the next page */
  cursor?: { date: string; id: number };
}

/** Date range for filtered queries */
export interface DateRange {
  /** ISO date string, inclusive (e.g., '2026-04-01') */
  start: string;
  /** ISO date string, exclusive (e.g., '2026-05-01') */
  end: string;
}
