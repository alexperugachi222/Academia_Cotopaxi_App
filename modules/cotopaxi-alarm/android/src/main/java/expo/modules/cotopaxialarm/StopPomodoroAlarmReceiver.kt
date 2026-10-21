package expo.modules.cotopaxialarm

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class StopPomodoroAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val token = intent?.getStringExtra(PomodoroAlarmService.EXTRA_TOKEN) ?: return
    val preferences = context.getSharedPreferences(
      PomodoroAlarmService.PREFERENCES,
      Context.MODE_PRIVATE
    )
    if (preferences.getString(PomodoroAlarmService.KEY_ACTIVE_TOKEN, null) != token) {
      return
    }

    preferences.edit()
      .putString(PomodoroAlarmService.KEY_STOPPED_TOKEN, token)
      .remove(PomodoroAlarmService.KEY_ACTIVE_TOKEN)
      .remove(PomodoroAlarmService.KEY_ACTIVE_LABEL)
      .apply()

    PomodoroAlarmScheduler.cancel(context)
    (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
      .cancel(PomodoroAlarmService.NOTIFICATION_ID)
    context.stopService(Intent(context, PomodoroAlarmService::class.java))
  }
}
