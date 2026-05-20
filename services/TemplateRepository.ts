import { ExpenseTemplate } from '../types';
import { getDb } from './db';

export const TemplateRepository = {
  async createTemplate(
    data: Omit<ExpenseTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ExpenseTemplate> {
    const result = await getDb().runAsync(
      `INSERT INTO expense_templates (name, amount, category_id, note)
       VALUES (?, ?, ?, ?)`,
      data.name,
      data.amount,
      data.category_id,
      data.note ?? ''
    );

    const created = await getDb().getFirstAsync<ExpenseTemplate>(
      'SELECT * FROM expense_templates WHERE id = ?',
      result.lastInsertRowId
    );
    if (!created) throw new Error('Failed to create expense template');
    return created;
  },

  async getAllTemplates(): Promise<ExpenseTemplate[]> {
    return await getDb().getAllAsync<ExpenseTemplate>(
      'SELECT * FROM expense_templates ORDER BY created_at DESC'
    );
  },

  async getTemplateById(id: number): Promise<ExpenseTemplate | null> {
    const result = await getDb().getFirstAsync<ExpenseTemplate>(
      'SELECT * FROM expense_templates WHERE id = ?',
      id
    );
    return result ?? null;
  },

  async updateTemplate(
    id: number,
    data: Partial<Omit<ExpenseTemplate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note); }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await getDb().runAsync(
      `UPDATE expense_templates SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  },

  async deleteTemplate(id: number): Promise<void> {
    await getDb().runAsync('DELETE FROM expense_templates WHERE id = ?', id);
  },
};
