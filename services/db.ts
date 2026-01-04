import * as SQLite from 'expo-sqlite';

export const dbRequest = SQLite.openDatabaseSync('expense_tracker.db');

export const initDatabase = async () => {
    try {
        await dbRequest.execAsync(`
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                budget_limit REAL DEFAULT 0,
                is_archived BOOLEAN DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                category_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                note TEXT,
                is_recurring BOOLEAN DEFAULT 0,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            
            -- Insert default categories if they don't exist
            INSERT OR IGNORE INTO categories (id, name, icon, color, budget_limit) VALUES 
            (1, 'Food', 'utensils', '#FF6B6B', 0),
            (2, 'Entertainment', 'film', '#4ECDC4', 0),
            (3, 'Travel', 'plane', '#1A535C', 0),
            (4, 'Shopping', 'shopping-bag', '#FF9F1C', 0),
            (5, 'Bills', 'file-text', '#2E86AB', 0),
            (6, 'Health', 'activity', '#10b981', 0);

            -- Force update names to full version (fix for previous accidental truncation)
            UPDATE categories SET name = 'Food' WHERE id = 1;
            UPDATE categories SET name = 'Entertainment' WHERE id = 2;
            UPDATE categories SET name = 'Travel' WHERE id = 3;
            UPDATE categories SET name = 'Shopping' WHERE id = 4;
            UPDATE categories SET name = 'Bills' WHERE id = 5;
            UPDATE categories SET name = 'Health' WHERE id = 6;

            -- Default settings
            INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', '$');

            -- Safety: Ensure no null budget limits exist
            UPDATE categories SET budget_limit = 0 WHERE budget_limit IS NULL;
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

export const runTransaction = async (callback: () => Promise<void>) => {
  await dbRequest.withTransactionAsync(callback);
};
