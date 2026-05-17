import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

// ─── Database Singleton ──────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
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
  await database.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
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
    throw error;
  }
}
