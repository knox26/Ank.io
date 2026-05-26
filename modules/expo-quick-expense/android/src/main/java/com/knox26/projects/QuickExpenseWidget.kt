package com.knox26.projects

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.widget.RemoteViews

class QuickExpenseWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_TEMPLATE_TAP = "com.knox26.projects.WIDGET_TEMPLATE_TAP"
        const val EXTRA_TEMPLATE_ID = "template_id"
        const val EXTRA_WIDGET_ID = "widget_id"
        const val EXTRA_TIMESTAMP = "tap_timestamp"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager,
                                            appWidgetId: Int, newOptions: Bundle) {
        updateWidget(context, appWidgetManager, appWidgetId)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        val stateManager = WidgetStateManager.getInstance(context)
        stateManager.clearAllForWidgets(appWidgetIds)
    }

    private fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        try {
            val views = buildRemoteViews(context, appWidgetId)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            // Crash-safe: show minimal fallback
            val fallback = RemoteViews(context.packageName, R.layout.widget_error_state)
            fallback.setTextViewText(R.id.error_text, "Tap to reload")
            try {
                appWidgetManager.updateAppWidget(appWidgetId, fallback)
            } catch (_: Exception) { }
        }
    }

    private fun buildRemoteViews(context: Context, appWidgetId: Int): RemoteViews {
        val cacheManager = WidgetCacheManager.getInstance(context)
        val stateManager = WidgetStateManager.getInstance(context)
        val isDark = isDarkMode(context)

        val cacheData = cacheManager.read()

        if (cacheData == null || cacheData.templates.isEmpty()) {
            return buildEmptyState(context, isDark)
        }

        val selection = stateManager.getSelection(appWidgetId)

        val views = RemoteViews(context.packageName, R.layout.widget_quick_expense)

        // Set background based on theme
        val bgColor = if (isDark) Color.parseColor("#1E293B") else Color.parseColor("#F8FAFC")
        views.setInt(R.id.widget_root, "setBackgroundColor", bgColor)

        val templates = cacheData.templates.take(MAX_BUBBLES)

        // Distribute templates across 2 rows
        val rowSize = (templates.size + 1) / 2

        // Build row 1
        val row1Templates = templates.take(rowSize)
        views.removeAllViews(R.id.widget_row_1)
        for (t in row1Templates) {
            val bubble = buildBubble(context, t, appWidgetId, selection, isDark)
            views.addView(R.id.widget_row_1, bubble)
        }

        // Build row 2
        val row2Templates = templates.drop(rowSize)
        views.removeAllViews(R.id.widget_row_2)
        if (row2Templates.isEmpty()) {
            views.setViewVisibility(R.id.widget_row_2, android.view.View.GONE)
        } else {
            views.setViewVisibility(R.id.widget_row_2, android.view.View.VISIBLE)
            for (t in row2Templates) {
                val bubble = buildBubble(context, t, appWidgetId, selection, isDark)
                views.addView(R.id.widget_row_2, bubble)
            }
        }

        // Hide overlays
        views.setViewVisibility(R.id.widget_success_overlay, android.view.View.GONE)
        views.setViewVisibility(R.id.widget_error_overlay, android.view.View.GONE)

        return views
    }

    private fun buildBubble(context: Context, template: TemplateCacheEntry,
                            appWidgetId: Int, selection: WidgetSelectionState?,
                            isDark: Boolean): RemoteViews {
        val bubble = RemoteViews(context.packageName, R.layout.widget_template_item)

        // Category color
        val color = try {
            Color.parseColor(template.categoryColor)
        } catch (_: Exception) {
            Color.parseColor("#607D8B")
        }

        if (selection != null && selection.selectedTemplateId == template.id) {
            // Selected state
            bubble.setInt(R.id.template_bubble, "setBackgroundColor", color)
            bubble.setTextColor(R.id.bubble_icon, getContrastColor(color))
            bubble.setTextColor(R.id.bubble_amount, getContrastColor(color))
            bubble.setTextColor(R.id.bubble_name, getContrastColor(color))
        } else {
            // Default state
            bubble.setInt(R.id.template_bubble, "setBackgroundColor",
                if (isDark) Color.parseColor("#334155") else Color.parseColor("#E2E8F0"))
            val textColor = if (isDark) Color.parseColor("#F1F5F9") else Color.parseColor("#1E293B")
            bubble.setTextColor(R.id.bubble_icon, textColor)
            bubble.setTextColor(R.id.bubble_amount, textColor)
            bubble.setTextColor(R.id.bubble_name, textColor)
        }

        // Category icon - use emoji mapping
        val iconEmoji = mapIconToEmoji(template.categoryIcon)
        bubble.setTextViewText(R.id.bubble_icon, iconEmoji)

        // Amount
        val amountText = formatAmount(template.amount)
        bubble.setTextViewText(R.id.bubble_amount, amountText)

        // Name
        bubble.setTextViewText(R.id.bubble_name,
            if (template.name.length > 10) template.name.take(9) + "…" else template.name)

        // Accessibility
        val desc = "Add ${template.name} expense $amountText"
        bubble.setContentDescription(R.id.template_bubble, desc)

        // PendingIntent for double-tap confirm
        val intent = Intent(context, ExpenseWidgetReceiver::class.java).apply {
            action = ACTION_TEMPLATE_TAP
            putExtra(EXTRA_TEMPLATE_ID, template.id)
            putExtra(EXTRA_WIDGET_ID, appWidgetId)
            putExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
            data = android.net.Uri.parse("widget://${appWidgetId}/${template.id}")
        }
        val requestCode = appWidgetId * 1000 + template.id.toInt()
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, requestCode, intent, flags
        )
        bubble.setOnClickPendingIntent(R.id.template_bubble, pendingIntent)

        return bubble
    }

    private fun buildEmptyState(context: Context, isDark: Boolean): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_empty_state)
        val textColor = if (isDark) Color.parseColor("#94A3B8") else Color.parseColor("#64748B")
        views.setTextColor(R.id.empty_title, textColor)
        views.setTextColor(R.id.empty_subtitle, textColor)

        // Deep-link CTA to templates screen
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (intent != null) {
            intent.putExtra("screen", "templates")
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pi = PendingIntent.getActivity(context, 2000, intent, flags)
            views.setOnClickPendingIntent(R.id.empty_subtitle, pi)
        }
        return views
    }

    private fun formatAmount(cents: Long): String {
        val whole = cents / 100
        val fractional = cents % 100
        return if (fractional == 0L) "₹$whole" else "₹$whole.${fractional.toString().padStart(2, '0')}"
    }

    private fun mapIconToEmoji(iconName: String): String {
        return when (iconName) {
            "utensils" -> "🍽️"
            "film" -> "🎬"
            "plane" -> "✈️"
            "shopping-bag" -> "🛍️"
            "file-text" -> "📄"
            "activity" -> "💪"
            "home" -> "🏠"
            "book" -> "📖"
            "music" -> "🎵"
            "car" -> "🚗"
            "coffee" -> "☕"
            "gift" -> "🎁"
            "heart" -> "❤️"
            "briefcase" -> "💼"
            "smartphone" -> "📱"
            "zap" -> "⚡"
            "sun" -> "☀️"
            "moon" -> "🌙"
            "star" -> "⭐"
            "wifi" -> "📶"
            "users" -> "👥"
            "calendar" -> "📅"
            "clock" -> "🕐"
            "map-pin" -> "📍"
            "dollar-sign" -> "💰"
            "piggy-bank" -> "🐷"
            "credit-card" -> "💳"
            "banknote" -> "💵"
            "building" -> "🏢"
            "thermometer" -> "🌡️"
            "umbrella" -> "☂️"
            "camera" -> "📷"
            "headphones" -> "🎧"
            "gamepad" -> "🎮"
            "tv" -> "📺"
            else -> "📌"
        }
    }

    private fun getContrastColor(color: Int): Int {
        val luminance = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color))
        return if (luminance > 150) Color.parseColor("#0F172A") else Color.parseColor("#F8FAFC")
    }

    private fun isDarkMode(context: Context): Boolean {
        val nightMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        return nightMode == Configuration.UI_MODE_NIGHT_YES
    }
}
