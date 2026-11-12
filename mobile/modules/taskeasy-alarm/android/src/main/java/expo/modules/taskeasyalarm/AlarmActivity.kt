package expo.modules.taskeasyalarm

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class AlarmActivity : Activity() {
  private lateinit var title: TextView
  private val stopped = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) { finish() }
  }

  override fun onCreate(state: Bundle?) {
    super.onCreate(state)
    if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true) }
    else @Suppress("DEPRECATION") window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    val layout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER
      setPadding(48, 48, 48, 48); setBackgroundColor(Color.rgb(247, 249, 246))
    }
    layout.addView(TextView(this).apply { text = "TaskEasy · Despertador"; textSize = 20f; gravity = Gravity.CENTER })
    title = TextView(this).apply {
      text = intent.getStringExtra("title") ?: "Hora da sua tarefa"
      textSize = 30f; gravity = Gravity.CENTER; setTextColor(Color.rgb(35, 54, 45)); setPadding(0, 48, 0, 48)
    }
    layout.addView(title)
    layout.addView(Button(this).apply {
      text = "Parar despertador"
      setOnClickListener { stopService(Intent(this@AlarmActivity, AlarmService::class.java)); finish() }
    })
    layout.addView(TextView(this).apply {
      text = "Parar o toque não marca a tarefa como concluída."; textSize = 16f
      gravity = Gravity.CENTER; setPadding(0, 32, 0, 0)
    })
    setContentView(layout)
    if (Build.VERSION.SDK_INT >= 33) registerReceiver(stopped, IntentFilter(AlarmStore.STOPPED), RECEIVER_NOT_EXPORTED)
    else @Suppress("DEPRECATION") registerReceiver(stopped, IntentFilter(AlarmStore.STOPPED))
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent); setIntent(intent)
    title.text = intent.getStringExtra("title") ?: "Hora da sua tarefa"
  }

  override fun onDestroy() { unregisterReceiver(stopped); super.onDestroy() }
}
