import * as SQLite from 'expo-sqlite';

// ─── Database Singleton ──────────────────────────────────────────

export const db = SQLite.openDatabaseSync('expense_tracker.db');

// ─── Migration System ───────────────────────────────────────────

interface Migration {
  version: number;
  description: string;
  up: (database: SQLite.SQLiteDatabase) => Promise<void>;
}

/**
 * Migrations are applied in order. Each migration runs inside a transaction.
 * SQLite PRAGMA user_version tracks which migrations have been applied.
 * 
 * RULES:
 * - Never modify an existing migration after it's been released.
 * - Always add new migrations to the end of the array.
 * - Each migration must be idempotent within its version.
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema with corrected types',
    up: async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          budget_limit INTEGER DEFAULT 0,
          is_archived INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount INTEGER NOT NULL,
          category_id INTEGER,
          date TEXT NOT NULL,
          note TEXT,
          is_recurring INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses(date, category_id);

        -- Default categories (amounts in cents)
        INSERT OR IGNORE INTO categories (id, name, icon, color, budget_limit) VALUES
          (1, 'Food', 'utensils', '#FF6B6B', 0),
          (2, 'Entertainment', 'film', '#4ECDC4', 0),
          (3, 'Travel', 'plane', '#1A535C', 0),
          (4, 'Shopping', 'shopping-bag', '#FF9F1C', 0),
          (5, 'Bills', 'file-text', '#2E86AB', 0),
          (6, 'Health', 'activity', '#10b981', 0);

        -- Default settings
        INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', '$');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'system');
      `);
    },
  },
  {
    version: 2,
    description: 'Migrate existing REAL amounts to INTEGER cents',
    up: async (database) => {
      // Check if there are any fractional amounts (indicating old REAL format)
      // This migration handles both fresh installs (no-op) and upgrades
      const hasData = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM expenses'
      );

      if (hasData && hasData.count > 0) {
        // Convert REAL amounts to INTEGER cents
        // e.g., 12.50 → 1250
        await database.execAsync(`
          UPDATE expenses SET amount = CAST(ROUND(amount * 100) AS INTEGER)
          WHERE amount != CAST(amount AS INTEGER) OR amount < 100;

          UPDATE categories SET budget_limit = CAST(ROUND(budget_limit * 100) AS INTEGER)
          WHERE budget_limit != CAST(budget_limit AS INTEGER)
            AND budget_limit > 0
            AND budget_limit < 100;
        `);
      }
    },
  },
  {
    version: 3,
    description: 'Add timestamps to existing tables (upgrade path for pre-migration databases)',
    up: async (database) => {
      // Helper: check if a column exists in a table
      const columnExists = async (table: string, column: string): Promise<boolean> => {
        const columns = await database.getAllAsync<{ name: string }>(
          `PRAGMA table_info(${table})`
        );
        return columns.some((c) => c.name === column);
      };

      // Add created_at / updated_at to categories if missing
      // NOTE: ALTER TABLE only allows constant defaults, so we use '' and backfill below
      if (!(await columnExists('categories', 'created_at'))) {
        await database.execAsync(
          `ALTER TABLE categories ADD COLUMN created_at TEXT DEFAULT ''`
        );
      }
      if (!(await columnExists('categories', 'updated_at'))) {
        await database.execAsync(
          `ALTER TABLE categories ADD COLUMN updated_at TEXT DEFAULT ''`
        );
      }

      // Add created_at / updated_at to expenses if missing
      if (!(await columnExists('expenses', 'created_at'))) {
        await database.execAsync(
          `ALTER TABLE expenses ADD COLUMN created_at TEXT DEFAULT ''`
        );
      }
      if (!(await columnExists('expenses', 'updated_at'))) {
        await database.execAsync(
          `ALTER TABLE expenses ADD COLUMN updated_at TEXT DEFAULT ''`
        );
      }

      // Backfill timestamps for existing rows that have NULL or empty
      await database.execAsync(`
        UPDATE categories SET created_at = datetime('now'), updated_at = datetime('now')
        WHERE created_at IS NULL OR created_at = '';
        UPDATE expenses SET created_at = datetime('now'), updated_at = datetime('now')
        WHERE created_at IS NULL OR created_at = '';
      `);

      // Ensure composite index exists
      await database.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses(date, category_id)`
      );
    },
  },
];

/**
 * Run all pending migrations in order.
 * Uses PRAGMA user_version to track applied migrations.
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');

  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      console.log(`Running migration v${migration.version}: ${migration.description}`);
      try {
        await database.withTransactionAsync(async () => {
          await migration.up(database);
          await database.execAsync(`PRAGMA user_version = ${migration.version}`);
        });
        console.log(`Migration v${migration.version} completed`);
      } catch (error) {
        console.error(`Migration v${migration.version} failed:`, error);
        throw new Error(
          `Database migration v${migration.version} failed. The app cannot start safely. Error: ${error}`
        );
      }
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Initialize the database — runs all pending migrations.
 * Must be called once at app startup before any queries.
 */
export async function initDatabase(): Promise<void> {
  try {
    await runMigrations(db);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Fatal: Database initialization failed:', error);
    throw error; // Let the app handle this — don't silently swallow
  }
}

/**
 * Export the database file for backup via the OS share sheet.
 */
export async function exportDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    const FileSystem = require('expo-file-system/legacy');
    const Sharing = require('expo-sharing');

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Sharing is not available. Ensure you have rebuilt your dev client to include expo-sharing.',
      };
    }

    // Fetch all expenses with their category names
    const expenses = await db.getAllAsync<{
      id: number;
      amount: number;
      date: string;
      note: string;
      is_recurring: number;
      category_name: string;
    }>(`
      SELECT e.id, e.amount, e.date, e.note, e.is_recurring, c.name as category_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.date ASC
    `);

    // Build CSV content
    const header = ['ID', 'Date', 'Category', 'Amount', 'Note', 'Recurring'].join(',');
    const rows = expenses.map(e => {
      // Escape quotes in note by doubling them, then wrap in quotes if there's a comma/quote
      let safeNote = e.note || '';
      if (safeNote.includes(',') || safeNote.includes('"') || safeNote.includes('\\n')) {
        safeNote = `"${safeNote.replace(/"/g, '""')}"`;
      }
      const amount = (e.amount / 100).toFixed(2); // Convert cents to standard decimal
      const isRecurring = e.is_recurring ? 'Yes' : 'No';
      const categoryName = e.category_name || 'Uncategorized';
      
      return [e.id, e.date, categoryName, amount, safeNote, isRecurring].join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    
    // Save to temp file
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
