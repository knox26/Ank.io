package com.knox26.projects

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Thread-safe SQLite access for the widget subsystem.
 * Uses its own SQLiteOpenHelper instance targeting the same DB file as expo-sqlite.
 * WAL mode allows safe coexistence — serialized write executor prevents conflicts.
 */
class NativeDatabaseManager private constructor(context: Context) {

    private val writeExecutor = Executors.newSingleThreadExecutor()

    private val helper = object : SQLiteOpenHelper(
        context,
        DB_NAME,
        null,
        DB_VERSION
    ) {
        override fun onCreate(db: SQLiteDatabase) {
            // Schema is managed by expo-sqlite migrations.
            // No-op here — DB is already created by the RN app on first launch.
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
            // Schema migrations are managed by expo-sqlite.
            // No-op here — the RN app handles upgrades.
        }

        override fun onConfigure(db: SQLiteDatabase) {
            super.onConfigure(db)
            db.setForeignKeyConstraintsEnabled(true)
        }
    }

    val readableDb: SQLiteDatabase
        get() = helper.readableDatabase

    /**
     * Execute a block within a transaction with retry on lock contention.
     * All writes are serialized through a single-threaded executor.
     */
    fun <T> runInTransaction(retries: Int = 3, block: (SQLiteDatabase) -> T): T {
        val future = writeExecutor.submit<T> {
            var attempt = 0
            var backoffMs = 100L
            while (true) {
                try {
                    val db = helper.writableDatabase
                    db.beginTransaction()
                    try {
                        val result = block(db)
                        db.setTransactionSuccessful()
                        return@submit result
                    } finally {
                        db.endTransaction()
                    }
                } catch (e: Exception) {
                    attempt++
                    if (attempt >= retries) throw e
                    try {
                        TimeUnit.MILLISECONDS.sleep(backoffMs)
                    } catch (_: InterruptedException) {
                        Thread.currentThread().interrupt()
                        throw e
                    }
                    backoffMs *= 2
                }
            }
            @Suppress("UNREACHABLE_CODE")
            throw IllegalStateException("unreachable")
        }
        return future.get()
    }

    fun close() {
        writeExecutor.shutdown()
        helper.close()
    }

    companion object {
        private const val DB_NAME = "expense_tracker.db"
        private const val DB_VERSION = 1

        @Volatile
        private var instance: NativeDatabaseManager? = null

        fun getInstance(context: Context): NativeDatabaseManager {
            return instance ?: synchronized(this) {
                instance ?: NativeDatabaseManager(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }
}
