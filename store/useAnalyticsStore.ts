import { create } from 'zustand';
import { ExpenseRepository } from '../services/ExpenseRepository';
import { getCurrentMonthRange } from '../lib/date';
import { checkBudgetsAndNotify } from '../services/notificationService';

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
export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  categorySpends: [],
  monthlyTotals: [],
  isLoading: false,

  loadAnalytics: async () => {
    set({ isLoading: true });

    try {
      const currentMonthRange = getCurrentMonthRange();

      // Run both queries in parallel — each is a single indexed SQL query
      const [categorySpends, monthlyTotals] = await Promise.all([
        // Pie chart: SUM per category for the current month only
        ExpenseRepository.getCategorySpends(currentMonthRange),

        // Bar chart: SUM per month for the last 6 months
        ExpenseRepository.getMonthlyTrend(6),
      ]);

      set({
        categorySpends,
        monthlyTotals,
        isLoading: false,
      });

      // Fire-and-forget budget notifications — never blocks analytics load
      checkBudgetsAndNotify();
    } catch (error) {
      console.error('Failed to load analytics:', error);
      set({ isLoading: false });
    }
  },
}));
