import { create } from 'zustand';
import { ExpenseRepository } from '../services/ExpenseRepository';
import { getCurrentMonthRange } from '../lib/date';
import { checkBudgetsAndNotify } from '../services/notificationService';
import { useCategoryStore } from './useCategoryStore';
import { useSettingsStore } from './useSettingsStore';

// ─── Types ───────────────────────────────────────────────────────

/** A single slice in the pie chart — category breakdown for this month */
export interface CategorySpend {
  category_id: number | null;
  /** Total in cents */
  total: number;
}

/** A single bar in the monthly trend chart */
export interface MonthlyTotal {
  /** Format: 'YYYY-MM' */
  month: string;
  /** Total in cents */
  total: number;
}

// ─── Store ───────────────────────────────────────────────────────

interface AnalyticsState {
  categorySpends: CategorySpend[];
  monthlyTotals: MonthlyTotal[];
  isLoading: boolean;

  /** Load all analytics data via SQL aggregation queries */
  loadAnalytics: () => Promise<void>;
}

/**
 * Analytics store — fetches pre-aggregated data from SQLite via GROUP BY queries.
 *
 * WHY THIS EXISTS:
 * Computing chart data in Javascript by filtering the full expense array is O(n)
 * per category/month, runs on the JS thread, and gets worse as data grows.
 *
 * SQLite's GROUP BY + SUM runs in optimized C code, uses indices, and returns
 * only the aggregated rows (e.g., 6 rows for 6 months, regardless of expense count).
 *
 * This store replaces the useMemo computation in analytics.tsx entirely.
 */
// Monotonic counter — stale queries discard their results so only the
// most recent call writes state, preventing last-finish-wins races.
let loadVersion = 0;

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  categorySpends: [],
  monthlyTotals: [],
  isLoading: false,

  loadAnalytics: async () => {
    const version = ++loadVersion;
    set({ isLoading: true });

    try {
      const currentMonthRange = getCurrentMonthRange();

      const [categorySpends, monthlyTotals] = await Promise.all([
        ExpenseRepository.getCategorySpends(currentMonthRange),
        ExpenseRepository.getMonthlyTrend(6),
      ]);

      // Stale — a newer loadAnalytics() call already finished
      if (version !== loadVersion) return;

      set({
        categorySpends,
        monthlyTotals,
        isLoading: false,
      });

      // Fire-and-forget, guarded separately so a notification failure
      // never discards a successful analytics fetch
      try {
        checkBudgetsAndNotify(
          useCategoryStore.getState().categories,
          categorySpends,
          useSettingsStore.getState().currency
        );
      } catch {
        // notification failure is non-fatal
      }
    } catch (error) {
      if (version !== loadVersion) return;
      console.error('Failed to load analytics:', error);
      set({ isLoading: false });
    }
  },
}));
