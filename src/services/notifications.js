import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

export const POMODORO_NOTIFICATION_CATEGORY = 'pomodoro-phase-complete';
export const POMODORO_NOTIFICATION_CHANNEL = 'pomodoro-alarm';
export const STOP_ALARM_ACTION = 'stop-pomodoro-alarm';

const NOTIFICATION_DATA_KEY = 'cotopaxiPomodoro';
const isNativeNotificationsSupported = Platform.OS === 'android' || Platform.OS === 'ios';

let notificationsModule;
let notificationsModulePromise;
let notificationHandlerConfigured = false;
let notificationConfigurationPromise;

async function loadNotificationsModule() {
  if (!isNativeNotificationsSupported || isRunningInExpoGo()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((module) => {
        notificationsModule = module;
        if (!notificationHandlerConfigured) {
          module.setNotificationHandler({
            handleNotification: async () => ({
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
              priority: module.AndroidNotificationPriority.MAX,
            }),
          });
          notificationHandlerConfigured = true;
        }
        return module;
      })
      .catch((error) => {
        notificationsModulePromise = null;
        throw error;
      });
  }

  return notificationsModulePromise;
}

export function configureNotifications() {
  if (!isNativeNotificationsSupported || isRunningInExpoGo()) {
    return Promise.resolve(false);
  }

  if (!notificationConfigurationPromise) {
    notificationConfigurationPromise = (async () => {
      const Notifications = await loadNotificationsModule();
      if (!Notifications) {
        return false;
      }

      if (Platform.OS === 'android') {
        const {
          AndroidAudioContentType,
          AndroidAudioUsage,
          AndroidImportance,
          AndroidNotificationVisibility,
        } = Notifications;
        await Notifications.setNotificationChannelAsync(POMODORO_NOTIFICATION_CHANNEL, {
          name: 'Alarmas Pomodoro',
          description: 'Alertas al finalizar una fase de estudio o descanso.',
          importance: AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 500, 250, 500, 250, 800],
          enableVibrate: true,
          bypassDnd: true,
          lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
          audioAttributes: {
            usage: AndroidAudioUsage.ALARM,
            contentType: AndroidAudioContentType.SONIFICATION,
            flags: {
              enforceAudibility: true,
              requestHardwareAudioVideoSynchronization: false,
            },
          },
        });
      }

      await Notifications.setNotificationCategoryAsync(POMODORO_NOTIFICATION_CATEGORY, [
        {
          identifier: STOP_ALARM_ACTION,
          buttonTitle: 'Detener',
          options: { isDestructive: true, opensAppToForeground: true },
        },
      ]);
      return true;
    })().catch((error) => {
      notificationConfigurationPromise = null;
      throw error;
    });
  }

  return notificationConfigurationPromise;
}

export async function getNotificationPermission() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return { granted: false, canAskAgain: false, criticalAlertsGranted: false };
  }

  const permission = await Notifications.getPermissionsAsync();
  const granted =
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  return {
    granted,
    canAskAgain: permission.canAskAgain,
    criticalAlertsGranted: permission.ios?.allowsCriticalAlerts === true,
  };
}

export async function requestNotificationPermission() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return { granted: false, canAskAgain: false, criticalAlertsGranted: false };
  }

  const permission = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
      allowCriticalAlerts: true,
    },
    android: {},
  });

  return {
    granted:
      permission.granted ||
      permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
    canAskAgain: permission.canAskAgain,
    criticalAlertsGranted: permission.ios?.allowsCriticalAlerts === true,
  };
}

function createPhaseNotificationContent(Notifications, { phaseLabel, phaseToken }, criticalAlertsGranted) {
  return {
    title: 'Fase Pomodoro terminada',
    body: `Terminó ${phaseLabel}. Toca para continuar con la siguiente fase.`,
    sound: Platform.OS === 'ios' && criticalAlertsGranted ? 'defaultCritical' : 'default',
    categoryIdentifier: POMODORO_NOTIFICATION_CATEGORY,
    data: { [NOTIFICATION_DATA_KEY]: true, phaseToken, phaseLabel },
    ...(Platform.OS === 'ios'
      ? { interruptionLevel: criticalAlertsGranted ? 'critical' : 'timeSensitive' }
      : {
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 250, 500, 250, 800],
        }),
  };
}

export async function schedulePhaseNotification({ phaseLabel, targetEndTime, phaseToken }) {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const { granted, criticalAlertsGranted } = await getNotificationPermission();
  if (!granted) {
    return null;
  }

  await cancelScheduledPhaseNotifications();

  return Notifications.scheduleNotificationAsync({
    content: createPhaseNotificationContent(
      Notifications,
      { phaseLabel, phaseToken },
      criticalAlertsGranted,
    ),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(targetEndTime),
      ...(Platform.OS === 'android' ? { channelId: POMODORO_NOTIFICATION_CHANNEL } : {}),
    },
  });
}

export async function presentPhaseCompletionNotification({ phaseLabel, phaseToken }) {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const { granted, criticalAlertsGranted } = await getNotificationPermission();
  if (!granted) {
    return null;
  }

  const presented = await Notifications.getPresentedNotificationsAsync();
  const alreadyPresented = presented.some(
    (notification) =>
      notification.request.content.data?.[NOTIFICATION_DATA_KEY] === true &&
      notification.request.content.data?.phaseToken === phaseToken,
  );
  if (alreadyPresented) {
    return null;
  }

  await cancelScheduledPhaseNotifications();
  return Notifications.scheduleNotificationAsync({
    content: createPhaseNotificationContent(
      Notifications,
      { phaseLabel, phaseToken },
      criticalAlertsGranted,
    ),
    trigger:
      Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(Date.now() + 1000),
            channelId: POMODORO_NOTIFICATION_CHANNEL,
          }
        : null,
  });
}

export async function cancelScheduledPhaseNotifications() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const phaseNotifications = scheduled.filter(
    (notification) => notification.content.data?.[NOTIFICATION_DATA_KEY] === true,
  );
  await Promise.all(
    phaseNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

export async function stopPhaseNotification(notificationIdentifier) {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return;
  }

  await cancelScheduledPhaseNotifications();
  if (notificationIdentifier) {
    await Notifications.dismissNotificationAsync(notificationIdentifier);
  } else {
    const presented = await Notifications.getPresentedNotificationsAsync();
    const phaseNotifications = presented.filter(
      (notification) =>
        notification.request.content.data?.[NOTIFICATION_DATA_KEY] === true,
    );
    await Promise.all(
      phaseNotifications.map((notification) =>
        Notifications.dismissNotificationAsync(notification.request.identifier),
      ),
    );
  }
}

export function addNotificationResponseListener(listener) {
  if (!notificationsModule) {
    return { remove() {} };
  }
  return notificationsModule.addNotificationResponseReceivedListener(listener);
}

export function getInitialNotificationResponse() {
  return notificationsModule?.getLastNotificationResponse() ?? null;
}

export async function clearInitialNotificationResponse() {
  await notificationsModule?.clearLastNotificationResponseAsync();
}

export function isPomodoroNotification(response) {
  return (
    response?.notification?.request?.content?.data?.[NOTIFICATION_DATA_KEY] === true
  );
}
