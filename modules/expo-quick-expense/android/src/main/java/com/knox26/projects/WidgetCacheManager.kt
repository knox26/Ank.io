package com.knox26.projects

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.util.Locale

data class TemplateCacheEntry(
    val id: Long,
    val name: String,
    val amount: Long,
    val categoryIcon: String,
    val categoryColor: String,
    val note: String?
)

/**
 * Widget cache stored in SharedPreferences.
 * JSON blob with cacheVersion + checksum for corruption/version detection.
 * Auto-rebuilds from ContentProvider on corruption or version mismatch.
 */
class WidgetCacheManager private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    data class CacheData(
        val templates: List<TemplateCacheEntry>,
        val timestamp: Long,
        val checksum: String
    )

    fun read(): CacheData? {
        val json = prefs.getString(KEY_DATA, null) ?: return null
        val storedChecksum = prefs.getString(KEY_CHECKSUM, null) ?: return null
        val storedVersion = prefs.getInt(KEY_VERSION, -1)

        if (storedVersion != CACHE_VERSION) {
            clear()
            return null
        }

        val computedChecksum = sha256(json)
        if (computedChecksum != storedChecksum) {
            clear()
            return null
        }

        return try {
            val obj = JSONObject(json)
            val arr = obj.getJSONArray("templates")
            val templates = (0 until arr.length()).map { i ->
                val t = arr.getJSONObject(i)
                TemplateCacheEntry(
                    id = t.getLong("id"),
                    name = t.getString("name"),
                    amount = t.getLong("amount"),
                    categoryIcon = t.getString("icon"),
                    categoryColor = t.getString("color"),
                    note = t.optString("note", null)
                )
            }
            CacheData(
                templates = templates,
                timestamp = obj.getLong("timestamp"),
                checksum = computedChecksum
            )
        } catch (_: Exception) {
            clear()
            null
        }
    }

    fun write(templates: List<TemplateCacheEntry>) {
        val arr = JSONArray()
        for (t in templates) {
            arr.put(JSONObject().apply {
                put("id", t.id)
                put("name", t.name)
                put("amount", t.amount)
                put("icon", t.categoryIcon)
                put("color", t.categoryColor)
                if (t.note != null) put("note", t.note)
            })
        }
        val root = JSONObject().apply {
            put("templates", arr)
            put("timestamp", System.currentTimeMillis())
        }
        val json = root.toString()
        val checksum = sha256(json)
        prefs.edit()
            .putInt(KEY_VERSION, CACHE_VERSION)
            .putString(KEY_DATA, json)
            .putString(KEY_CHECKSUM, checksum)
            .apply()
    }

    fun isValid(): Boolean {
        val version = prefs.getInt(KEY_VERSION, -1)
        if (version != CACHE_VERSION) return false
        val json = prefs.getString(KEY_DATA, null) ?: return false
        val storedChecksum = prefs.getString(KEY_CHECKSUM, null) ?: return false
        return sha256(json) == storedChecksum
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    // Analytics hooks (lightweight)
    fun recordUsage(templateId: Long) {
        val counts = prefs.getString(KEY_USAGE_COUNTS, null)
            ?.let { JSONObject(it) } ?: JSONObject()
        val key = templateId.toString()
        counts.put(key, counts.optInt(key, 0) + 1)
        prefs.edit()
            .putString(KEY_USAGE_COUNTS, counts.toString())
            .putLong(KEY_LAST_USED_ID, templateId)
            .putLong(KEY_LAST_ADD_TS, System.currentTimeMillis())
            .putLong(KEY_TOTAL_ADDS, prefs.getLong(KEY_TOTAL_ADDS, 0) + 1)
            .apply()
    }

    fun getTemplateUsageCount(templateId: Long): Int {
        val counts = prefs.getString(KEY_USAGE_COUNTS, null)
            ?.let { JSONObject(it) } ?: return 0
        return counts.optInt(templateId.toString(), 0)
    }

    fun clearAnalyticsForWidget() {
        prefs.edit()
            .remove(KEY_USAGE_COUNTS)
            .remove(KEY_LAST_USED_ID)
            .remove(KEY_TOTAL_ADDS)
            .apply()
    }

    companion object {
        private const val PREFS_NAME = "widget_cache"
        private const val CACHE_VERSION = 1
        private const val KEY_VERSION = "cache_version"
        private const val KEY_DATA = "cache_data"
        private const val KEY_CHECKSUM = "cache_checksum"
        private const val KEY_USAGE_COUNTS = "usage_counts"
        private const val KEY_LAST_USED_ID = "last_used_template_id"
        private const val KEY_LAST_ADD_TS = "last_add_timestamp"
        private const val KEY_TOTAL_ADDS = "total_widget_adds"

        @Volatile
        private var instance: WidgetCacheManager? = null

        fun getInstance(context: Context): WidgetCacheManager {
            return instance ?: synchronized(this) {
                instance ?: WidgetCacheManager(context.applicationContext).also {
                    instance = it
                }
            }
        }

        private fun sha256(input: String): String {
            val digest = MessageDigest.getInstance("SHA-256")
            val hash = digest.digest(input.toByteArray(Charsets.UTF_8))
            return hash.joinToString("") { "%02x".format(Locale.ROOT, it) }
        }
    }
}
