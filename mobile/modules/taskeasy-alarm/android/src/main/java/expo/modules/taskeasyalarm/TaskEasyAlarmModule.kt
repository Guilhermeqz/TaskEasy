package expo.modules.taskeasyalarm

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TaskEasyAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("TaskEasyAlarm")
    AsyncFunction("getStatus") {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      mapOf(
        "exact" to AlarmStore.canSchedule(context),
        "notifications" to manager.areNotificationsEnabled(),
        "fullScreen" to (Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent()),
        "ringing" to AlarmService.ringing
      )
    }
    AsyncFunction("activateUser") { userId: String? -> AlarmStore.activateUser(context, userId) }
    AsyncFunction("upsert") { userId: String, task: Map<String, Any?> -> AlarmStore.upsert(context, userId, task) }
    AsyncFunction("sync") { userId: String, tasks: List<Map<String, Any?>> -> AlarmStore.sync(context, userId, tasks) }
    AsyncFunction("cancel") { userId: String, taskId: String -> AlarmStore.cancel(context, userId, taskId) }
    AsyncFunction("stop") { context.stopService(Intent(context, AlarmService::class.java)); Unit }
    AsyncFunction("openExactSettings") {
      if (Build.VERSION.SDK_INT >= 31) openSettings(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
    }
    AsyncFunction("openFullScreenSettings") {
      if (Build.VERSION.SDK_INT >= 34) openSettings(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
    }
    AsyncFunction("openNotificationSettings") {
      context.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
        .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun openSettings(action: String) {
    context.startActivity(Intent(action, Uri.parse("package:${context.packageName}"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }
}
