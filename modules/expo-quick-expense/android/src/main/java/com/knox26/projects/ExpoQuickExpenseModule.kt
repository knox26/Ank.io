package com.knox26.projects

import android.appwidget.AppWidgetManager
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoQuickExpenseModule : Module() {

    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    private var pendingSync = false

    override fun definition() = ModuleDefinition {
        Name("ExpoQuickExpense")

        AsyncFunction("syncWidgetCache") {
            scheduleSync()
        }

        Function("requestWidgetUpdate") {
            doWidgetUpdate()
        }
    }

    private fun scheduleSync() {
        synchronized(this) {
            if (pendingSync) return
            pendingSync = true
            handler.postDelayed({
                synchronized(this@ExpoQuickExpenseModule) {
                    pendingSync = false
                }
                doSync()
            }, 300)
        }
    }

    private fun doSync() {
        try {
            val context = appContext.reactContext ?: return
            val cacheManager = WidgetCacheManager.getInstance(context)
            val dbManager = NativeDatabaseManager.getInstance(context)

            val db = dbManager.readableDb
            val cursor = db.rawQuery("""
                SELECT et.id, et.name, et.amount, et.note,
                       c.icon AS category_icon, c.color AS category_color
                FROM expense_templates et
                LEFT JOIN categories c ON et.category_id = c.id
                WHERE c.is_archived = 0 OR c.is_archived IS NULL
                ORDER BY et.created_at DESC
            """.trimIndent(), null)

            val templates = mutableListOf<TemplateCacheEntry>()
            while (cursor.moveToNext()) {
                templates.add(
                    TemplateCacheEntry(
                        id = cursor.getLong(0),
                        name = cursor.getString(1),
                        amount = cursor.getLong(2),
                        note = cursor.getString(3),
                        categoryIcon = cursor.getString(4) ?: "layers",
                        categoryColor = cursor.getString(5) ?: "#607D8B"
                    )
                )
            }
            cursor.close()

            cacheManager.write(templates)
            doWidgetUpdate()
        } catch (e: Exception) {
            android.util.Log.e("ExpoQuickExpense", "Cache sync failed", e)
        }
    }

    private fun doWidgetUpdate() {
        try {
            val context = appContext.reactContext ?: return
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = android.content.ComponentName(
                context, QuickExpenseWidget::class.java
            )
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
            if (widgetIds.isNotEmpty()) {
                val intent = Intent(context, QuickExpenseWidget::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                }
                context.sendBroadcast(intent)
            }
        } catch (e: Exception) {
            android.util.Log.e("ExpoQuickExpense", "Widget update failed", e)
        }
    }
}
