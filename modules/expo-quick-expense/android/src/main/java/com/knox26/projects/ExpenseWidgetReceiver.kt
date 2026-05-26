package com.knox26.projects

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.TimeoutCancellationException
import java.util.concurrent.ConcurrentHashMap

class ExpenseWidgetReceiver : BroadcastReceiver() {

    companion object {
        private const val DEBOUNCE_MS = 500L
        private const val ANR_TIMEOUT_MS = 3000L
        private const val COOLDOWN_MS = 500L
        private const val SUCCESS_SHOW_MS = 1500L
        const val ACTION_EXPENSE_ADDED = "com.knox26.projects.EXPENSE_ADDED"

        // Rate-limit: (widgetId, templateId) -> lastFireTime
        private val lastFireMap = ConcurrentHashMap<String, Long>()

        // Single application-scoped coroutine scope — avoids leaking scopes per broadcast
        private val appScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

        private fun rateLimitKey(widgetId: Int, templateId: Long): String = "${widgetId}_${templateId}"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val templateId = intent.getLongExtra(QuickExpenseWidget.EXTRA_TEMPLATE_ID, -1)
        val widgetId = intent.getIntExtra(QuickExpenseWidget.EXTRA_WIDGET_ID, -1)

        if (templateId == -1L || widgetId == -1) return

        // Rate limiting
        val key = rateLimitKey(widgetId, templateId)
        val now = System.currentTimeMillis()
        val lastFire = lastFireMap[key]
        if (lastFire != null && now - lastFire < DEBOUNCE_MS) {
            return // Drop duplicate
        }
        lastFireMap[key] = now

        val pendingResult = goAsync()

        appScope.launch {
            try {
                withTimeout(ANR_TIMEOUT_MS) {
                    processAdd(context, widgetId, templateId)
                }
            } catch (_: TimeoutCancellationException) {
                showError(context, widgetId, "Busy — try again")
            } catch (e: Exception) {
                showError(context, widgetId, "Couldn't add — tap to retry")
            } finally {
                pendingResult.finish()
            }
        }
    }

    private suspend fun processAdd(context: Context, widgetId: Int, templateId: Long) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val cacheManager = WidgetCacheManager.getInstance(context)
        val stateManager = WidgetStateManager.getInstance(context)
        val dbManager = NativeDatabaseManager.getInstance(context)

        // Read template from cache
        val cacheData = cacheManager.read() ?: run {
            showError(context, widgetId, "No templates — add one in the app")
            return
        }
        val template = cacheData.templates.find { it.id == templateId } ?: run {
            showError(context, widgetId, "Template unavailable")
            return
        }

        // Defensive validation: check template exists in DB and category is active
        val valid = validateTemplate(context, templateId)
        if (!valid) {
            showError(context, widgetId, "Template unavailable")
            return
        }

        // Insert expense via ContentProvider
        val values = ContentValues().apply {
            put("amount", template.amount)
            put("note", template.note ?: "")
        }

        // Get category_id from DB
        val categoryId = getCategoryIdForTemplate(context, templateId)
        values.put("category_id", categoryId)

        val insertUri = context.contentResolver.insert(
            ExpenseContentProvider.EXPENSES_URI, values
        )

        if (insertUri != null) {
            // Record usage analytics
            cacheManager.recordUsage(templateId)

            // Cancel debounce clear (cooldown overrides)
            stateManager.clearSelection(widgetId)

            // Show success
            showSuccess(context, widgetId, template)

            // Restore template view after delay
            delay(SUCCESS_SHOW_MS)
            restoreWidget(context, widgetId)

            // Broadcast to RN app (so it refreshes if open)
            val addedIntent = Intent(ACTION_EXPENSE_ADDED)
            context.sendBroadcast(addedIntent)
        } else {
            showError(context, widgetId, "Couldn't add — tap to retry")
        }
    }

    private fun validateTemplate(context: Context, templateId: Long): Boolean {
        return try {
            val uri = android.net.Uri.withAppendedPath(
                ExpenseContentProvider.VALIDATE_URI, templateId.toString()
            )
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            val valid = cursor != null && cursor.moveToFirst()
            cursor?.close()
            valid
        } catch (_: Exception) {
            false
        }
    }

    private fun getCategoryIdForTemplate(context: Context, templateId: Long): Long {
        return try {
            val uri = android.net.Uri.withAppendedPath(
                ExpenseContentProvider.VALIDATE_URI, templateId.toString()
            )
            val cursor = context.contentResolver.query(uri, null, null, null, null)
            var catId = 0L
            if (cursor != null && cursor.moveToFirst()) {
                val idx = cursor.getColumnIndex("cat_id")
                if (idx >= 0) catId = cursor.getLong(idx)
            }
            cursor?.close()
            catId
        } catch (_: Exception) {
            0L
        }
    }

    private fun showSuccess(context: Context, widgetId: Int, template: TemplateCacheEntry) {
        val views = RemoteViews(context.packageName, R.layout.widget_success_overlay)
        val amountText = formatAmount(template.amount)
        views.setTextViewText(R.id.success_text, "$amountText ${template.name}\nAdded!")
        views.setContentDescription(R.id.success_text, "$amountText ${template.name} expense added successfully")

        val appWidgetManager = AppWidgetManager.getInstance(context)
        appWidgetManager.partiallyUpdateAppWidget(widgetId, views)
    }

    private fun restoreWidget(context: Context, widgetId: Int) {
        try {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widget = QuickExpenseWidget()
            // Re-build full widget via AppWidgetManager update
            val intent = Intent(context, QuickExpenseWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(widgetId))
            }
            context.sendBroadcast(intent)
        } catch (_: Exception) { }
    }

    private fun showError(context: Context, widgetId: Int, message: String) {
        try {
            val views = RemoteViews(context.packageName, R.layout.widget_error_state)
            views.setTextViewText(R.id.error_text, message)
            views.setContentDescription(R.id.error_text, message)

            // Retry PendingIntent
            val intent = Intent(context, QuickExpenseWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(widgetId))
            }
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pi = PendingIntent.getBroadcast(context, 3000 + widgetId, intent, flags)
            views.setOnClickPendingIntent(R.id.error_text, pi)

            val appWidgetManager = AppWidgetManager.getInstance(context)
            appWidgetManager.partiallyUpdateAppWidget(widgetId, views)
        } catch (_: Exception) { }
    }

    private fun formatAmount(cents: Long): String {
        val whole = cents / 100
        val fractional = cents % 100
        return if (fractional == 0L) "₹$whole" else "₹$whole.${fractional.toString().padStart(2, '0')}"
    }
}
