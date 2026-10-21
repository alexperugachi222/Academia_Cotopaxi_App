package expo.modules.cotopaxialarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.IOException

class PomodoroAlarmService : Service() {
  private var mediaPlayer: MediaPlayer? = null
  private var vibrator: Vibrator? = null

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val preferences = getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
    val token = intent?.getStringExtra(EXTRA_TOKEN)
      ?: preferences.getString(KEY_ACTIVE_TOKEN, null)
    val label = intent?.getStringExtra(EXTRA_LABEL)
      ?: preferences.getString(KEY_ACTIVE_LABEL, null)

    if (token.isNullOrBlank() || label.isNullOrBlank() ||
      preferences.getString(KEY_STOPPED_TOKEN, null) == token
    ) {
      stopSelf(startId)
      return START_NOT_STICKY
    }

    if (preferences.getString(KEY_ACTIVE_TOKEN, null) == token && mediaPlayer?.isPlaying == true) {
      return START_STICKY
    }

    preferences.edit()
      .putString(KEY_ACTIVE_TOKEN, token)
      .putString(KEY_ACTIVE_LABEL, label)
      .apply()

    startAsForeground(buildAlarmNotification(token, label))
    startLoopingSound()
    startRepeatingVibration()
    return START_STICKY
  }

  override fun onDestroy() {
    stopAlarmEffects()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startAsForeground(notification: Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun startLoopingSound() {
    val alarmUri: Uri? = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
    if (alarmUri == null) {
      Log.e("CotopaxiAlarm", "No system alarm or notification sound is available.")
      return
    }

    val player = MediaPlayer()
    try {
      player.setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
      player.setDataSource(this, alarmUri)
      player.setWakeMode(applicationContext, PowerManager.PARTIAL_WAKE_LOCK)
      player.isLooping = true
      player.prepare()
      player.start()
      mediaPlayer = player
    } catch (error: IOException) {
      player.release()
      Log.e("CotopaxiAlarm", "Could not play the repeating alarm sound.", error)
    } catch (error: IllegalStateException) {
      player.release()
      Log.e("CotopaxiAlarm", "Could not initialize the repeating alarm sound.", error)
    }
  }

  private fun startRepeatingVibration() {
    val systemVibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      getSystemService(VibratorManager::class.java)?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    } ?: return

    val pattern = longArrayOf(0, 600, 250, 600, 250, 1000)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      systemVibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      systemVibrator.vibrate(pattern, 0)
    }
    vibrator = systemVibrator
  }

  private fun buildAlarmNotification(token: String, label: String): Notification {
    val stopIntent = Intent(this, StopPomodoroAlarmReceiver::class.java)
      .putExtra(EXTRA_TOKEN, token)
    val stopPendingIntent = PendingIntent.getBroadcast(
      this,
      STOP_REQUEST_CODE,
      stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle("Temporizador terminado")
      .setContentText("Terminó $label. Detén la alarma con el botón.")
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .addAction(0, "Detener alarma", stopPendingIntent)
      .build()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel = NotificationChannel(
      CHANNEL_ID,
      "Alarma Pomodoro",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Alarma repetitiva que se detiene desde su notificación."
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setSound(null, null)
      enableVibration(false)
    }
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  private fun stopAlarmEffects() {
    mediaPlayer?.let { player ->
      if (player.isPlaying) {
        player.stop()
      }
      player.release()
    }
    mediaPlayer = null
    vibrator?.cancel()
    vibrator = null
  }

  companion object {
    internal const val PREFERENCES = "cotopaxi_pomodoro_alarm"
    internal const val KEY_ACTIVE_TOKEN = "active_token"
    internal const val KEY_ACTIVE_LABEL = "active_label"
    internal const val KEY_STOPPED_TOKEN = "stopped_token"
    internal const val EXTRA_TOKEN = "phase_token"
    internal const val EXTRA_LABEL = "phase_label"
    internal const val NOTIFICATION_ID = 7402
    private const val CHANNEL_ID = "cotopaxi-repeating-alarm"
    private const val START_ACTION = "com.academiacotopaxi.pomodoro.START_ALARM"
    private const val STOP_REQUEST_CODE = 7403

    fun start(context: Context, token: String, label: String) {
      val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
      if (preferences.getString(KEY_STOPPED_TOKEN, null) == token) {
        return
      }
      val activeToken = preferences.getString(KEY_ACTIVE_TOKEN, null)
      if (activeToken != null && activeToken != token) {
        Log.w("CotopaxiAlarm", "Ignored a second alarm while one is already active.")
        return
      }
      preferences
        .edit()
        .putString(KEY_ACTIVE_TOKEN, token)
        .putString(KEY_ACTIVE_LABEL, label)
        .apply()
      val intent = Intent(context, PomodoroAlarmService::class.java)
        .setAction(START_ACTION)
        .putExtra(EXTRA_TOKEN, token)
        .putExtra(EXTRA_LABEL, label)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }
  }
}
