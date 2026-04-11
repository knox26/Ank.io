import { DateRange, Expense, PaginationParams } from '../types';
import { db } from './db';

const DEFAULT_PAGE_SIZE = 50;

/**
 * Data access layer for the expenses table.
 * All amounts are stored and returned as INTEGER cents.
 * Date filtering uses range queries (not strftime) for index utilization.
 */
export const ExpenseRepository = {
  /**
   * Get expenses with pagination, ordered by date DESC.
   * Returns at most `limit` rows starting from `offset`.
   */
  async getExpenses(
    pagination: PaginationParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 }
  ): Promise<Expense[]> {
    return await db.getAllAsync<Expense>(
      'SELECT * FROM expenses ORDER BY date DESC LIMIT ? OFFSET ?',
      pagination.limit,
      pagination.offset
    );
  },

  /**
   * Get total count of expenses (for pagination UI).
   */
  async getExpenseCount(): Promise<number> {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM expenses'
    );
    return result?.count ?? 0;
  },

  /**
   * Get expenses filtered by optional date range and category.
   * Uses index-friendly date range queries instead of strftime().
   */
  async getFilteredExpenses(options: {
    dateRange?: DateRange;
    categoryId?: number | null;
    pagination?: PaginationParams;
  }): Promise<Expense[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (options.dateRange) {
      conditions.push('date >= ? AND date < ?');
      params.push(options.dateRange.start, options.dateRange.end);
    }

    if (options.categoryId !== undefined && options.categoryId !== null) {
      conditions.push('category_id = ?');
      params.push(options.categoryId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.pagination?.limit ?? DEFAULT_PAGE_SIZE;
    const offset = options.pagination?.offset ?? 0;

    return await db.getAllAsync<Expense>(
      `SELECT * FROM expenses ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );
  },

  /**
   * Add a new expense. Amount should be in cents.
   */
  async addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    const { amount, category_id, date, note, is_recurring } = expense;
    const result = await db.runAsync(
      'INSERT INTO expenses (amount, category_id, date, note, is_recurring) VALUES (?, ?, ?, ?, ?)',
      amount,
      category_id,
      date,
      note ?? '',
      is_recurring ? 1 : 0
    );

    // Fetch the complete row to get server-generated timestamps
    const created = await db.getFirstAsync<Expense>(
      'SELECT * FROM expenses WHERE id = ?',
      result.lastInsertRowId
    );

    return created!;
  },

  /**
   * Update an existing expense.
   */
  async updateExpense(
    id: number,
    data: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }
    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(data.category_id!);
    }
    if (data.date !== undefined) {
      fields.push('date = ?');
      values.push(data.date);
    }
    if (data.note !== undefined) {
      fields.push('note = ?');
      values.push(data.note ?? '');
    }
    if (data.is_recurring !== undefined) {
      fields.push('is_recurring = ?');
      values.push(data.is_recurring ? 1 : 0);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  },

  /**
   * Delete an expense by ID.
   */
  async deleteExpense(id: number): Promise<void> {
    await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
  },

  /**
   * Get total spending for a date range (returns cents).
   * Uses index-friendly range query.
   */
  async getSpendForDateRange(dateRange: DateRange): Promise<number> {
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date < ?',
      dateRange.start,
      dateRange.end
    );
    return result?.total ?? 0;
  },

  /**
   * Get spending per category for a date range (returns cents).
   * Uses composite index idx_expenses_date_category.
   */
  async getCategorySpends(
    dateRange: DateRange
  ): Promise<{ category_id: number | null; total: number }[]> {
    return await db.getAllAsync<{ category_id: number | null; total: number }>(
      `SELECT category_id, SUM(amount) as total
       FROM expenses
       WHERE date >= ? AND date < ?
       GROUP BY category_id`,
      dateRange.start,
      dateRange.end
    );
  },

  /**
   * Get monthly spending totals for the last N months.
   * Returns months in descending order with totals in cents.
   */
  async getMonthlyTrend(
    monthCount: number
  ): Promise<{ month: string; total: number }[]> {
    // Build date boundaries for the last N months
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1);
    const startStr = startDate.toISOString().split('T')[0];

    return await db.getAllAsync<{ month: string; total: number }>(
      `SELECT substr(date, 1, 7) as month, SUM(amount) as total
       FROM expenses
       WHERE date >= ?
       GROUP BY substr(date, 1, 7)
       ORDER BY month DESC
       LIMIT ?`,
      startStr,
      monthCount
    );
  },
};
