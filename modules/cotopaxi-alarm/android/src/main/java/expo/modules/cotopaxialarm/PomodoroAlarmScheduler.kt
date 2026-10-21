package expo.modules.cotopaxialarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

internal object PomodoroAlarmScheduler {
  private const val PREFERENCES = "cotopaxi_pomodoro_alarm"
  private const val KEY_SCHEDULED_TOKEN = "scheduled_token"
  private const val KEY_SCHEDULED_LABEL = "scheduled_label"
  private const val KEY_SCHEDULED_AT = "scheduled_at"
  private const val REQUEST_CODE = 7401

  fun schedule(context: Context, targetEndTime: Long, token: String, label: String) {
    cancel(context)

    val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
    preferences.edit()
      .putString(KEY_SCHEDULED_TOKEN, token)
      .putString(KEY_SCHEDULED_LABEL, label)
      .putLong(KEY_SCHEDULED_AT, targetEndTime)
      .apply()

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pendingIntent = createPendingIntent(context)
    val triggerAt = maxOf(targetEndTime, System.currentTimeMillis() + 1000)

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
      try {
        alarmManager.setExactAndAllowWhileIdle(
          AlarmManager.RTC_WAKEUP,
          triggerAt,
          pendingIntent
        )
      } catch (error: SecurityException) {
        Log.w("CotopaxiAlarm", "Exact alarm permission unavailable; using an inexact alarm.", error)
        alarmManager.setAndAllowWhileIdle(
          AlarmManager.RTC_WAKEUP,
          triggerAt,
          pendingIntent
        )
      }
    } else {
      alarmManager.setAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        triggerAt,
        pendingIntent
      )
    }
  }

  fun cancel(context: Context) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.cancel(createPendingIntent(context))
    context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_SCHEDULED_TOKEN)
      .remove(KEY_SCHEDULED_LABEL)
      .remove(KEY_SCHEDULED_AT)
      .apply()
  }

  fun consume(context: Context): Pair<String, String>? {
    val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
    val token = preferences.getString(KEY_SCHEDULED_TOKEN, null) ?: return null
    val label = preferences.getString(KEY_SCHEDULED_LABEL, "la fase actual") ?: "la fase actual"
    val targetEndTime = preferences.getLong(KEY_SCHEDULED_AT, 0L)

    if (targetEndTime > System.currentTimeMillis()) {
      schedule(context, targetEndTime, token, label)
      return null
    }

    preferences.edit()
      .remove(KEY_SCHEDULED_TOKEN)
      .remove(KEY_SCHEDULED_LABEL)
      .remove(KEY_SCHEDULED_AT)
      .apply()
    return token to label
  }

  private fun createPendingIntent(context: Context): PendingIntent {
    val intent = Intent(context, PomodoroAlarmReceiver::class.java)
    return PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
