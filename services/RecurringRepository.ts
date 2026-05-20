import { RecurringTemplate } from '../types';
import { getDb } from './db';

export const RecurringRepository = {
  async createTemplate(
    data: Omit<RecurringTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RecurringTemplate> {
    const result = await getDb().runAsync(
      `INSERT INTO recurring_templates (amount, category_id, note, recurrence_frequency, is_active, last_generated_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      data.amount,
      data.category_id,
      data.note ?? '',
      data.recurrence_frequency,
      data.is_active ? 1 : 0,
      data.last_generated_date ?? null
    );

    const created = await getDb().getFirstAsync<RecurringTemplate>(
      'SELECT * FROM recurring_templates WHERE id = ?',
      result.lastInsertRowId
    );
    if (!created) throw new Error('Failed to create recurring template');
    return created;
  },

  async getActiveTemplates(): Promise<RecurringTemplate[]> {
    return await getDb().getAllAsync<RecurringTemplate>(
      'SELECT * FROM recurring_templates WHERE is_active = 1 ORDER BY created_at DESC'
    );
  },

  async getAllTemplates(): Promise<RecurringTemplate[]> {
    return await getDb().getAllAsync<RecurringTemplate>(
      'SELECT * FROM recurring_templates ORDER BY created_at DESC'
    );
  },

  async getTemplateById(id: number): Promise<RecurringTemplate | null> {
    const result = await getDb().getFirstAsync<RecurringTemplate>(
      'SELECT * FROM recurring_templates WHERE id = ?',
      id
    );
    return result ?? null;
  },

  async updateTemplate(
    id: number,
    data: Partial<Omit<RecurringTemplate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note); }
    if (data.recurrence_frequency !== undefined) { fields.push('recurrence_frequency = ?'); values.push(data.recurrence_frequency); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (data.last_generated_date !== undefined) { fields.push('last_generated_date = ?'); values.push(data.last_generated_date); }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await getDb().runAsync(
      `UPDATE recurring_templates SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  },

  async updateLastGeneratedDate(id: number, date: string): Promise<void> {
    await getDb().runAsync(
      "UPDATE recurring_templates SET last_generated_date = ?, updated_at = datetime('now') WHERE id = ?",
      date,
      id
    );
  },

  async deactivateTemplate(id: number): Promise<void> {
    await getDb().runAsync(
      "UPDATE recurring_templates SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
      id
    );
  },

  async reactivateTemplate(id: number): Promise<void> {
    await getDb().runAsync(
      "UPDATE recurring_templates SET is_active = 1, updated_at = datetime('now') WHERE id = ?",
      id
    );
  },

  async deleteTemplate(id: number): Promise<void> {
    // Both DELETEs must succeed or neither — prevents orphaned expense
    // rows referencing a template that no longer exists on crash.
    try {
      await getDb().withTransactionAsync(async () => {
        await getDb().runAsync('DELETE FROM expenses WHERE recurring_template_id = ?', id);
        await getDb().runAsync('DELETE FROM recurring_templates WHERE id = ?', id);
      });
    } catch (error) {
      console.error(`Failed to delete recurring template ${id}:`, error);
      throw error;
    }
  },
};
