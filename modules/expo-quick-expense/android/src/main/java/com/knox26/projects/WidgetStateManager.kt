package com.knox26.projects

import android.content.Context
import android.content.SharedPreferences

data class WidgetSelectionState(
    val selectedTemplateId: Long,
    val timestamp: Long
) {
    val isStale: Boolean
        get() = System.currentTimeMillis() - timestamp > STALE_THRESHOLD_MS

    companion object {
        private const val STALE_THRESHOLD_MS = 5 * 60 * 1000L // 5 minutes
    }
}

/**
 * Per-widget-instance selection state persistence.
 * Lazy invalidation: stale state cleared on next interaction, no AlarmManager needed.
 */
class WidgetStateManager private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun getSelection(appWidgetId: Int): WidgetSelectionState? {
        val json = prefs.getString(stateKey(appWidgetId), null) ?: return null
        return try {
            val parts = json.split("|")
            val state = WidgetSelectionState(
                selectedTemplateId = parts[0].toLong(),
                timestamp = parts[1].toLong()
            )
            if (state.isStale) {
                clearSelection(appWidgetId)
                null
            } else {
                state
            }
        } catch (_: Exception) {
            clearSelection(appWidgetId)
            null
        }
    }

    fun setSelection(appWidgetId: Int, templateId: Long) {
        val json = "$templateId|${System.currentTimeMillis()}"
        prefs.edit().putString(stateKey(appWidgetId), json).apply()
    }

    fun clearSelection(appWidgetId: Int) {
        prefs.edit().remove(stateKey(appWidgetId)).apply()
    }

    fun clearAllStale() {
        val editor = prefs.edit()
        prefs.all.keys.forEach { key ->
            if (key.startsWith(KEY_PREFIX)) {
                val json = prefs.getString(key, null) ?: return@forEach
                try {
                    val parts = json.split("|")
                    val ts = parts[1].toLong()
                    if (System.currentTimeMillis() - ts > WidgetSelectionState.STALE_THRESHOLD_MS) {
                        editor.remove(key)
                    }
                } catch (_: Exception) {
                    editor.remove(key)
                }
            }
        }
        editor.apply()
    }

    fun clearAllForWidgets(appWidgetIds: IntArray) {
        val editor = prefs.edit()
        appWidgetIds.forEach { id ->
            editor.remove(stateKey(id))
        }
        editor.apply()
    }

    companion object {
        private const val PREFS_NAME = "widget_states"
        private const val KEY_PREFIX = "widget_state_"

        @Volatile
        private var instance: WidgetStateManager? = null

        fun getInstance(context: Context): WidgetStateManager {
            return instance ?: synchronized(this) {
                instance ?: WidgetStateManager(context.applicationContext).also {
                    instance = it
                }
            }
        }

        private fun stateKey(appWidgetId: Int): String = "${KEY_PREFIX}${appWidgetId}"

        const val STALE_THRESHOLD_MS = 5 * 60 * 1000L
    }
}
