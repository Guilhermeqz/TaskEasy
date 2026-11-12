package expo.modules.taskeasyalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class AlarmService : Service() {
  companion object {
    @Volatile var ringing = false
    @Volatile var currentKey: String? = null
    const val CHANNEL = "taskeasy_alarm_playback_v1"
    const val NOTIFICATION_ID = 9100
  }
  private var player: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var vibrator: Vibrator? = null
  private var fallbackTone: ToneGenerator? = null
  private val handler = Handler(Looper.getMainLooper())
  private val beep = object : Runnable {
    override fun run() {
      if (ringing) { fallbackTone?.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 1000); handler.postDelayed(this, 1400) }
    }
  }

  private fun startFallbackTone() {
    if (fallbackTone != null || !ringing) return
    try { fallbackTone = ToneGenerator(AudioManager.STREAM_ALARM, 80); handler.post(beep) } catch (_: Exception) {}
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent == null) { stopSelf(); return START_NOT_STICKY }
    currentKey = intent.getStringExtra("key")
    val title = intent.getStringExtra("title") ?: "Hora da sua tarefa"
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(NotificationChannel(CHANNEL, "Despertadores de tarefas", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Toque contínuo até parar o despertador"
      setSound(null, null); enableVibration(false)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    })
    val screen = PendingIntent.getActivity(this, 0, Intent(this, AlarmActivity::class.java)
      .putExtra("title", title).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val stop = PendingIntent.getBroadcast(this, 1, Intent(this, AlarmReceiver::class.java).setAction(AlarmStore.STOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else @Suppress("DEPRECATION") Notification.Builder(this)
    val notification = builder.setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(title)
      .setContentText("Horário da tarefa. Toque em Parar despertador para silenciar.")
      .setCategory(Notification.CATEGORY_ALARM).setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOngoing(true).setAutoCancel(false).setContentIntent(screen).setFullScreenIntent(screen, true)
      .addAction(Notification.Action.Builder(null, "Parar despertador", stop).build()).build()
    if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    else startForeground(NOTIFICATION_ID, notification)
    if (!ringing) {
      ringing = true
      wakeLock = (getSystemService(POWER_SERVICE) as PowerManager).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "TaskEasy:Alarm").apply { acquire() }
      val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
      try {
        player = MediaPlayer().apply {
          setAudioAttributes(attributes)
          setDataSource(this@AlarmService, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
          isLooping = true
          setOnPreparedListener { if (ringing) it.start() }
          setOnErrorListener { _, _, _ -> startFallbackTone(); true }
          prepareAsync()
        }
      } catch (_: Exception) { player?.release(); player = null; startFallbackTone() }
      vibrator = if (Build.VERSION.SDK_INT >= 31) (getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        else @Suppress("DEPRECATION") (getSystemService(VIBRATOR_SERVICE) as Vibrator)
      if (Build.VERSION.SDK_INT >= 26) vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 800, 400), 0))
      else @Suppress("DEPRECATION") vibrator?.vibrate(longArrayOf(0, 800, 400), 0)
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    ringing = false; currentKey = null
    player?.release(); player = null
    handler.removeCallbacks(beep); fallbackTone?.release(); fallbackTone = null
    vibrator?.cancel()
    wakeLock?.let { if (it.isHeld) it.release() }; wakeLock = null
    stopForeground(STOP_FOREGROUND_REMOVE)
    sendBroadcast(Intent(AlarmStore.STOPPED).setPackage(packageName))
    super.onDestroy()
  }
}
