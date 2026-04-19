import { Category } from '../types';
import { db } from './db';

/**
 * Data access layer for the categories table.
 * Budget limits are stored and returned as INTEGER cents.
 */
export const CategoryRepository = {
  /**
   * Get all active (non-archived) categories.
   */
  async getActiveCategories(): Promise<Category[]> {
    return await db.getAllAsync<Category>(
      'SELECT * FROM categories WHERE is_archived = 0 ORDER BY id ASC'
    );
  },

  /**
   * Get all categories including archived (for data integrity checks).
   */
  async getAllCategories(): Promise<Category[]> {
    return await db.getAllAsync<Category>(
      'SELECT * FROM categories ORDER BY id ASC'
    );
  },

  /**
   * Get a single category by ID.
   */
  async getCategoryById(id: number): Promise<Category | null> {
    const result = await db.getFirstAsync<Category>(
      'SELECT * FROM categories WHERE id = ?',
      id
    );
    return result ?? null;
  },

  /**
   * Add a new category. budget_limit should be in cents.
   */
  async addCategory(
    category: Omit<Category, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Category> {
    const { name, icon, color, budget_limit, is_archived } = category;
    const result = await db.runAsync(
      'INSERT INTO categories (name, icon, color, budget_limit, is_archived) VALUES (?, ?, ?, ?, ?)',
      name,
      icon,
      color,
      budget_limit,
      is_archived ? 1 : 0
    );

    // Fetch the complete row to get server-generated timestamps
    const created = await db.getFirstAsync<Category>(
      'SELECT * FROM categories WHERE id = ?',
      result.lastInsertRowId
    );

    if (!created) {
      throw new Error(
        `Category was inserted (id=${result.lastInsertRowId}) but could not be read back. ` +
        `This may indicate a storage issue on the device.`
      );
    }

    return created;
  },

  /**
   * Soft-delete a category by archiving it.
   * Expenses referencing this category keep their category_id.
   */
  async archiveCategory(id: number): Promise<void> {
    await db.runAsync(
      "UPDATE categories SET is_archived = 1, updated_at = datetime('now') WHERE id = ?",
      id
    );
  },

  /**
   * Update the monthly budget limit for a category. Amount in cents.
   */
  async updateBudgetLimit(id: number, limitCents: number): Promise<void> {
    await db.runAsync(
      "UPDATE categories SET budget_limit = ?, updated_at = datetime('now') WHERE id = ?",
      limitCents,
      id
    );
  },

  /**
   * Update a category's details.
   */
  async updateCategory(
    id: number,
    data: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.icon !== undefined) {
      fields.push('icon = ?');
      values.push(data.icon);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }
    if (data.budget_limit !== undefined) {
      fields.push('budget_limit = ?');
      values.push(data.budget_limit);
    }
    if (data.is_archived !== undefined) {
      fields.push('is_archived = ?');
      values.push(data.is_archived ? 1 : 0);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  },
};
