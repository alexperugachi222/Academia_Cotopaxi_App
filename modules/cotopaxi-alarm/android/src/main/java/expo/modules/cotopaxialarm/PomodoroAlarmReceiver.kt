package expo.modules.cotopaxialarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PomodoroAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val alarm = PomodoroAlarmScheduler.consume(context) ?: return
    PomodoroAlarmService.start(context, alarm.first, alarm.second)
  }
}
