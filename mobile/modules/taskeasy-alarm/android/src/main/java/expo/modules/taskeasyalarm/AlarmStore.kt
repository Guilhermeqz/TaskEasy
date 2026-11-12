package expo.modules.taskeasyalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import org.json.JSONObject
import java.util.Calendar

object AlarmStore {
  const val FIRE = "taskeasy.alarm.FIRE"
  const val STOP = "taskeasy.alarm.STOP"
  const val STOPPED = "taskeasy.alarm.STOPPED"
  private fun prefs(context: Context) = context.getSharedPreferences("taskeasy_alarms", Context.MODE_PRIVATE)
  private fun read(context: Context) = JSONObject(prefs(context).getString("entries", "{}") ?: "{}")
  private fun write(context: Context, entries: JSONObject) {
    check(prefs(context).edit().putString("entries", entries.toString()).commit()) { "Não foi possível persistir os despertadores." }
  }
  private fun manager(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  fun canSchedule(context: Context) = Build.VERSION.SDK_INT < 31 || manager(context).canScheduleExactAlarms()

  private fun operation(context: Context, key: String, flags: Int): PendingIntent? = PendingIntent.getBroadcast(
    context, 0, Intent(context, AlarmReceiver::class.java).setAction(FIRE)
      .setData(Uri.parse("taskeasy://alarm/${Uri.encode(key)}")), flags or PendingIntent.FLAG_IMMUTABLE
  )

  private fun disarm(context: Context, key: String) {
    operation(context, key, PendingIntent.FLAG_NO_CREATE)?.let { manager(context).cancel(it); it.cancel() }
    if (AlarmService.currentKey == key) context.stopService(Intent(context, AlarmService::class.java))
  }

  private fun nextDaily(hour: String): Long = Calendar.getInstance().apply {
    val parts = hour.split(":")
    set(Calendar.HOUR_OF_DAY, parts[0].toInt()); set(Calendar.MINUTE, parts[1].toInt())
    set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
    if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
  }.timeInMillis

  private fun arm(context: Context, key: String, entry: JSONObject) {
    if (!canSchedule(context) || entry.optBoolean("fired") || entry.getLong("at") <= System.currentTimeMillis()) return
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent(context, AlarmActivity::class.java)
    val show = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    manager(context).setAlarmClock(AlarmManager.AlarmClockInfo(entry.getLong("at"), show),
      requireNotNull(operation(context, key, PendingIntent.FLAG_UPDATE_CURRENT)))
  }

  @Synchronized fun activateUser(context: Context, userId: String?) {
    if (prefs(context).getString("user", null) == userId) return
    val entries = read(context)
    entries.keys().forEach { disarm(context, it) }
    context.stopService(Intent(context, AlarmService::class.java))
    check(prefs(context).edit().putString("user", userId).putString("entries", "{}").commit())
  }

  @Synchronized fun cancel(context: Context, userId: String, taskId: String) {
    if (prefs(context).getString("user", null) != userId) return
    val key = "$userId:$taskId"
    disarm(context, key)
    val entries = read(context); entries.remove(key); write(context, entries)
  }

  @Synchronized fun upsert(context: Context, userId: String, task: Map<String, Any?>) {
    if (prefs(context).getString("user", null) != userId) return
    val id = (task["id"] as Number).toLong().toString()
    val key = "$userId:$id"
    if (task["enabled"] != true) { cancel(context, userId, id); return }
    val hour = task["hour"] as String
    require(Regex("([01]\\d|2[0-3]):[0-5]\\d").matches(hour))
    val entries = read(context)
    val previous = entries.optJSONObject(key)
    val signature = task["signature"] as String
    if (previous != null && previous.optString("signature") == signature) {
      if (previous.optBoolean("repeats") && previous.getLong("at") <= System.currentTimeMillis()) {
        previous.put("at", nextDaily(hour)); entries.put(key, previous); write(context, entries)
      }
      arm(context, key, previous); return
    }
    disarm(context, key)
    val repeats = task["repeats"] == true
    val entry = JSONObject().put("user", userId).put("title", task["title"] as String)
      .put("body", task["body"] as String).put("hour", hour).put("repeats", repeats)
      .put("at", if (repeats) nextDaily(hour) else (task["at"] as Number).toLong())
      .put("signature", signature).put("fired", false)
    entries.put(key, entry); write(context, entries); arm(context, key, entry)
  }

  @Synchronized fun sync(context: Context, userId: String, tasks: List<Map<String, Any?>>) {
    if (prefs(context).getString("user", null) != userId) return
    val keep = tasks.filter { it["enabled"] == true }.map { "$userId:${(it["id"] as Number).toLong()}" }.toSet()
    val entries = read(context)
    entries.keys().asSequence().toList().filter { it !in keep }.forEach { disarm(context, it); entries.remove(it) }
    write(context, entries)
    tasks.forEach { upsert(context, userId, it) }
  }

  @Synchronized fun consume(context: Context, key: String): JSONObject? {
    val entries = read(context)
    val entry = entries.optJSONObject(key) ?: return null
    if (entry.optString("user") != prefs(context).getString("user", null) || entry.optBoolean("fired")
      || entry.getLong("at") > System.currentTimeMillis() + 2000) return null
    val ringing = JSONObject(entry.toString()).put("key", key)
    if (entry.optBoolean("repeats")) {
      entry.put("at", nextDaily(entry.getString("hour")))
      entries.put(key, entry); write(context, entries); arm(context, key, entry)
    } else {
      entry.put("fired", true); entries.put(key, entry); write(context, entries)
    }
    return ringing
  }

  @Synchronized fun restore(context: Context) {
    val entries = read(context)
    entries.keys().forEach { key ->
      val entry = entries.getJSONObject(key)
      if (entry.optBoolean("repeats")) entry.put("at", nextDaily(entry.getString("hour")))
      arm(context, key, entry)
    }
    write(context, entries)
  }
}
