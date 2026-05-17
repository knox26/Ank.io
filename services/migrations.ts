import * as SQLite from 'expo-sqlite';

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
      const hasData = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM expenses'
      );

      if (hasData && hasData.count > 0) {
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
      const columnExists = async (table: string, column: string): Promise<boolean> => {
        const columns = await database.getAllAsync<{ name: string }>(
          `PRAGMA table_info(${table})`
        );
        return columns.some((c) => c.name === column);
      };

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

      await database.execAsync(`
        UPDATE categories SET created_at = datetime('now'), updated_at = datetime('now')
        WHERE created_at IS NULL OR created_at = '';
        UPDATE expenses SET created_at = datetime('now'), updated_at = datetime('now')
        WHERE created_at IS NULL OR created_at = '';
      `);

      await database.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses(date, category_id)`
      );
    },
  },
  {
    version: 4,
    description: 'Add recurrence_frequency column to expenses',
    up: async (database) => {
      const columns = await database.getAllAsync<{ name: string }>(
        'PRAGMA table_info(expenses)'
      );
      if (!columns.some((c) => c.name === 'recurrence_frequency')) {
        await database.execAsync(
          `ALTER TABLE expenses ADD COLUMN recurrence_frequency TEXT DEFAULT NULL`
        );
      }
    },
  },
  {
    version: 5,
    description: 'Add recurring_templates table and link expenses to templates',
    up: async (database) => {
      // Create the templates table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS recurring_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount INTEGER NOT NULL,
          category_id INTEGER,
          note TEXT DEFAULT '',
          recurrence_frequency TEXT NOT NULL CHECK(recurrence_frequency IN ('daily', 'weekly', 'monthly')),
          is_active INTEGER DEFAULT 1,
          last_generated_date TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );
      `);

      // Add linking column to expenses
      await database.execAsync(
        `ALTER TABLE expenses ADD COLUMN recurring_template_id INTEGER DEFAULT NULL`
      );

      // Create index for template-based queries
      await database.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_expenses_template_id ON expenses(recurring_template_id)`
      );

      // Migrate existing recurring expenses: each row becomes its own template + instance
      const recurring = await database.getAllAsync<{
        id: number; amount: number; category_id: number | null;
        note: string; recurrence_frequency: string; date: string;
        created_at: string; updated_at: string;
      }>('SELECT * FROM expenses WHERE is_recurring = 1');

      for (const row of recurring) {
        const freq = row.recurrence_frequency || 'monthly';
        // Set last_generated_date to today so we don't backfill months/years of history
        const today = new Date().toISOString().substring(0, 10);
        const result = await database.runAsync(
          `INSERT INTO recurring_templates
           (id, amount, category_id, note, recurrence_frequency, last_generated_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          row.id, row.amount, row.category_id, row.note || '', freq,
          today, row.created_at, row.updated_at
        );

        await database.runAsync(
          'UPDATE expenses SET recurring_template_id = ? WHERE id = ?',
          result.lastInsertRowId, row.id
        );
      }
    },
  },
];
/**
 * Run all pending migrations in order.
 * Uses PRAGMA user_version to track applied migrations.
 *
 * The user_version update is performed AFTER the transaction commits
 * successfully. PRAGMA user_version cannot be reliably set inside a
 * transaction on all SQLite implementations — if it silently fails,
 * migrations would re-run on every launch.
 */
export async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
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
        });

        await database.execAsync(`PRAGMA user_version = ${migration.version}`);

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
