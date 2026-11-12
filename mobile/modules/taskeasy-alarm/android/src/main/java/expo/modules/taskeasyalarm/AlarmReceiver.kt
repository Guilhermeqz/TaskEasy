package expo.modules.taskeasyalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      AlarmStore.STOP -> context.stopService(Intent(context, AlarmService::class.java))
      AlarmStore.FIRE -> {
        val key = intent.data?.lastPathSegment ?: return
        val alarm = AlarmStore.consume(context, key) ?: return
        val service = Intent(context, AlarmService::class.java).putExtra("key", key).putExtra("title", alarm.getString("title"))
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service) else context.startService(service)
      }
      else -> AlarmStore.restore(context)
    }
  }
}
