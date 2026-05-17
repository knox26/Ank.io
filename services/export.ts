import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from './db';

/**
 * Sanitize a cell value to prevent CSV formula injection.
 * Spreadsheet apps interpret cells starting with =, +, -, @ as formulas.
 * Prefixing with a single quote (') neutralizes this.
 */
function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

/**
 * Escape and quote a CSV field value.
 * Wraps in double quotes if the value contains commas, quotes, or newlines.
 * Doubles internal quotes per RFC 4180.
 */
function escapeCsvField(value: string): string {
  const sanitized = sanitizeCsvCell(value);
  if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n') || sanitized.includes('\r')) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/**
 * Export expenses as a CSV file via the OS share sheet.
 */
export async function exportDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Sharing is not available. Ensure you have rebuilt your dev client to include expo-sharing.',
      };
    }

    const database = getDb();

    const expenses = await database.getAllAsync<{
      id: number;
      amount: number;
      date: string;
      note: string;
      is_recurring: number;
      recurrence_frequency: string | null;
      recurring_template_id: number | null;
      category_name: string;
    }>(`
      SELECT e.id, e.amount, e.date, e.note, e.is_recurring, e.recurrence_frequency, e.recurring_template_id, c.name as category_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.date ASC
    `);

    const header = ['ID', 'Date', 'Category', 'Amount', 'Note', 'Recurring', 'Frequency', 'Template ID'].join(',');
    const rows = expenses.map(e => {
      const amount = (e.amount / 100).toFixed(2);
      const isRecurring = e.is_recurring ? 'Yes' : 'No';
      const frequency = e.recurrence_frequency || '';
      const categoryName = escapeCsvField(e.category_name || 'Uncategorized');
      const safeNote = escapeCsvField(e.note || '');

      return [e.id, e.date, categoryName, amount, safeNote, isRecurring, escapeCsvField(frequency), e.recurring_template_id ?? ''].join(',');
    });

    const csvContent = [header, ...rows].join('\n');

    const fileUri = `${FileSystem.cacheDirectory}AnkIo_Expenses.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export AnkIo Expenses',
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to export database:', error);
    return { success: false, error: `Export failed: ${error}` };
  }
}
