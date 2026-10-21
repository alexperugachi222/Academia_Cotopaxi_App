package expo.modules.cotopaxialarm

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CotopaxiAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CotopaxiAlarm")

    Function("scheduleAlarm") { targetEndTime: Double, phaseToken: String, phaseLabel: String ->
      val context = requireNotNull(appContext.reactContext)
      PomodoroAlarmScheduler.schedule(
        context,
        targetEndTime.toLong(),
        phaseToken,
        phaseLabel
      )
      phaseToken
    }

    Function("cancelScheduledAlarm") {
      PomodoroAlarmScheduler.cancel(requireNotNull(appContext.reactContext))
    }

    Function("startAlarm") { phaseToken: String, phaseLabel: String ->
      PomodoroAlarmService.start(
        requireNotNull(appContext.reactContext),
        phaseToken,
        phaseLabel
      )
      phaseToken
    }

    Function("isAlarmActive") {
      val context = requireNotNull(appContext.reactContext)
      context.getSharedPreferences(
        PomodoroAlarmService.PREFERENCES,
        android.content.Context.MODE_PRIVATE
      ).getString(PomodoroAlarmService.KEY_ACTIVE_TOKEN, null) != null
    }
  }
}
