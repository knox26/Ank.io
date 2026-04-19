import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ─── Database Singleton ──────────────────────────────────────────

/**
 * Database singleton. Uses lazy initialization with error handling
 * to prevent crashes if the device has disk space issues at import time.
 * 
 * IMPORTANT: Always access via getDb() or the exported `db` constant.
 */
let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    try {
      _db = SQLite.openDatabaseSync('expense_tracker.db');
    } catch (error) {
      throw new Error(
        `Failed to open database. The device may be out of storage. Error: ${error}`
      );
    }
  }
  return _db;
}

/** Exported for backward compatibility — lazy-initialized. */
export const db = new Proxy({} as SQLite.SQLiteDatabase, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

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
      // NOTE: PRAGMA journal_mode and foreign_keys are set at connection
      // level in configurePragmas(), not inside migrations.
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
      // Check if there are any fractional amounts (indicating old REAL format)
      // This migration handles both fresh installs (no-op) and upgrades
      //
      // HISTORICAL NOTE (D5): The WHERE clause `amount < 100` was a heuristic
      // that assumed all pre-migration amounts under 100 were "dollars not cents".
      // This is a one-time migration from the initial release. It cannot be
      // changed retroactively — any edge cases have already been applied.
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

// ─── Connection Configuration ────────────────────────────────────

/**
 * Configure connection-level PRAGMAs that must be set on EVERY app launch.
 * These are connection-specific settings, NOT stored in the database file,
 * so they reset when the connection is reopened.
 *
 * - journal_mode = WAL: Enables Write-Ahead Logging for concurrent reads/writes
 * - foreign_keys = ON: Enforces FOREIGN KEY constraints
 * - wal_checkpoint(TRUNCATE): Reclaims WAL file space to prevent unbounded growth
 */
async function configurePragmas(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');
  // Checkpoint the WAL to reclaim disk space on each launch
  await database.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
}

// ─── Migration Runner ────────────────────────────────────────────

/**
 * Run all pending migrations in order.
 * Uses PRAGMA user_version to track applied migrations.
 * 
 * The user_version update is performed AFTER the transaction commits
 * successfully. PRAGMA user_version cannot be reliably set inside a
 * transaction on all SQLite implementations — if it silently fails,
 * migrations would re-run on every launch.
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      console.log(`Running migration v${migration.version}: ${migration.description}`);
      try {
        // Run the migration body inside a transaction for atomicity
        await database.withTransactionAsync(async () => {
          await migration.up(database);
        });

        // Set user_version OUTSIDE the transaction to avoid PRAGMA-in-transaction issues
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

// ─── Public API ──────────────────────────────────────────────────

/**
 * Initialize the database — configures PRAGMAs and runs all pending migrations.
 * Must be called once at app startup before any queries.
 * 
 * Execution order:
 * 1. Configure connection-level PRAGMAs (WAL, foreign keys, checkpoint)
 * 2. Run any pending schema migrations
 */
export async function initDatabase(): Promise<void> {
  try {
    const database = getDb();

    // Step 1: Set connection-level PRAGMAs (must run every launch)
    await configurePragmas(database);

    // Step 2: Run pending migrations
    await runMigrations(database);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Fatal: Database initialization failed:', error);
    throw error; // Let the app handle this — don't silently swallow
  }
}

// ─── CSV Export ──────────────────────────────────────────────────

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
 * Uses static imports for expo-file-system and expo-sharing.
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

    // Fetch all expenses with their category names
    const expenses = await database.getAllAsync<{
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
      const amount = (e.amount / 100).toFixed(2); // Convert cents to standard decimal
      const isRecurring = e.is_recurring ? 'Yes' : 'No';
      const categoryName = escapeCsvField(e.category_name || 'Uncategorized');
      const safeNote = escapeCsvField(e.note || '');
      
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
