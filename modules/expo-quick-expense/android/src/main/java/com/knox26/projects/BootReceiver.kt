package com.knox26.projects

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        Log.d("QuickExpenseWidget", "Boot completed — validating widget cache")

        try {
            // Validate cache
            val cacheManager = WidgetCacheManager.getInstance(context)
            if (!cacheManager.isValid()) {
                cacheManager.clear()
                Log.d("QuickExpenseWidget", "Widget cache invalid — cleared for rebuild")
            }

            // Clear stale selection states
            val stateManager = WidgetStateManager.getInstance(context)
            stateManager.clearAllStale()

            // Request widget refresh
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetProvider = android.content.ComponentName(context, QuickExpenseWidget::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(widgetProvider)
            if (widgetIds.isNotEmpty()) {
                val refreshIntent = Intent(context, QuickExpenseWidget::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                }
                context.sendBroadcast(refreshIntent)
            }
        } catch (e: Exception) {
            Log.e("QuickExpenseWidget", "Boot recovery failed", e)
        }
    }
}
