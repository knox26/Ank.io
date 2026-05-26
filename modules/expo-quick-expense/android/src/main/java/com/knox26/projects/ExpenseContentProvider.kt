package com.knox26.projects

import android.content.ContentProvider
import android.content.ContentValues
import android.content.UriMatcher
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.net.Uri

class ExpenseContentProvider : ContentProvider() {

    private lateinit var dbManager: NativeDatabaseManager

    companion object {
        private const val AUTHORITY = "com.knox26.projects.widget.provider"
        private const val TEMPLATES = 1
        private const val TEMPLATE_BY_ID = 2
        private const val EXPENSES = 3
        private const val VALIDATE_TEMPLATE = 4

        val TEMPLATES_URI: Uri = Uri.parse("content://$AUTHORITY/templates")
        val EXPENSES_URI: Uri = Uri.parse("content://$AUTHORITY/expenses")
        val VALIDATE_URI: Uri = Uri.parse("content://$AUTHORITY/validate")

        private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
            addURI(AUTHORITY, "templates", TEMPLATES)
            addURI(AUTHORITY, "templates/#", TEMPLATE_BY_ID)
            addURI(AUTHORITY, "expenses", EXPENSES)
            addURI(AUTHORITY, "validate/#", VALIDATE_TEMPLATE)
        }
    }

    override fun onCreate(): Boolean {
        dbManager = NativeDatabaseManager.getInstance(context!!)
        return true
    }

    override fun query(uri: Uri, projection: Array<String>?, selection: String?,
                       selectionArgs: Array<String>?, sortOrder: String?): Cursor? {
        val db = dbManager.readableDb
        return when (uriMatcher.match(uri)) {
            TEMPLATES -> {
                db.rawQuery("""
                    SELECT et.id, et.name, et.amount, et.category_id, et.note,
                           c.icon AS category_icon, c.color AS category_color, c.name AS category_name
                    FROM expense_templates et
                    LEFT JOIN categories c ON et.category_id = c.id
                    WHERE c.is_archived = 0 OR c.is_archived IS NULL
                    ORDER BY et.created_at DESC
                """.trimIndent(), null)
            }
            TEMPLATE_BY_ID -> {
                val id = uri.lastPathSegment?.toLongOrNull() ?: return null
                db.rawQuery("""
                    SELECT et.id, et.name, et.amount, et.category_id, et.note,
                           c.icon AS category_icon, c.color AS category_color, c.name AS category_name
                    FROM expense_templates et
                    LEFT JOIN categories c ON et.category_id = c.id
                    WHERE et.id = ?
                """.trimIndent(), arrayOf(id.toString()))
            }
            VALIDATE_TEMPLATE -> {
                val id = uri.lastPathSegment?.toLongOrNull() ?: return null
                db.rawQuery("""
                    SELECT et.id, et.amount, c.id AS cat_id, c.is_archived
                    FROM expense_templates et
                    LEFT JOIN categories c ON et.category_id = c.id
                    WHERE et.id = ?
                """.trimIndent(), arrayOf(id.toString()))
            }
            else -> null
        }
    }

    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        if (uriMatcher.match(uri) != EXPENSES) return null
        val vals = values ?: return null

        val date = vals.getAsString("date") ?: run {
            val now = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            now.format(java.util.Date())
        }

        return dbManager.runInTransaction(retries = 3) { db ->
            db.execSQL("""
                INSERT INTO expenses (amount, category_id, date, note, is_recurring, recurrence_frequency, recurring_template_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, NULL, NULL, datetime('now'), datetime('now'))
            """.trimIndent(), arrayOf(
                vals.getAsLong("amount"),
                vals.getAsLong("category_id"),
                date,
                vals.getAsString("note") ?: ""
            ))

            val cursor = db.rawQuery("SELECT last_insert_rowid()", null)
            val newId = if (cursor.moveToFirst()) cursor.getLong(0) else -1L
            cursor.close()

            Uri.withAppendedPath(EXPENSES_URI, newId.toString())
        }
    }

    override fun update(uri: Uri, values: ContentValues?, selection: String?,
                        selectionArgs: Array<String>?): Int = 0

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0

    override fun getType(uri: Uri): String? = when (uriMatcher.match(uri)) {
        TEMPLATES -> "vnd.android.cursor.dir/vnd.knox26.template"
        TEMPLATE_BY_ID -> "vnd.android.cursor.item/vnd.knox26.template"
        EXPENSES -> "vnd.android.cursor.dir/vnd.knox26.expense"
        else -> null
    }
}
