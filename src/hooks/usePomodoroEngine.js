import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  loadTimerSession,
  resetSettings as resetStoredSettings,
  saveSettings,
  saveTimerSession,
} from '../services/storage';
import {
  addNotificationResponseListener,
  cancelScheduledPhaseNotifications,
  clearInitialNotificationResponse,
  configureNotifications,
  getInitialNotificationResponse,
  isPomodoroNotification,
  presentPhaseCompletionNotification,
  schedulePhaseNotification,
  stopPhaseNotification,
} from '../services/notifications';

const PHASE_LABELS = {
  study: 'Estudio',
  shortBreak: 'Descanso corto',
  longBreak: 'Descanso largo',
};

function createPhaseToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createInitialSession(settings) {
  return {
    currentPhase: 'study',
    completedPomodoros: 0,
    isCounting: false,
    isPaused: false,
    remainingSeconds: settings.studyDurationMinutes * 60,
    targetEndTime: null,
    phaseDurationSeconds: settings.studyDurationMinutes * 60,
    phaseToken: createPhaseToken(),
    alarmActive: false,
  };
}

export default function usePomodoroEngine() {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('study');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_SETTINGS.studyDurationMinutes * 60);
  const [isCounting, setIsCounting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);

  const phaseDurations = useMemo(
    () => ({
      study: settings.studyDurationMinutes * 60,
      shortBreak: settings.shortBreakDurationMinutes * 60,
      longBreak: settings.longBreakDurationMinutes * 60,
    }),
    [settings],
  );
  const deadlineRef = useRef(null);
  const activePhaseDurationRef = useRef(phaseDurations.study);
  const hasStartedPhaseRef = useRef(false);
  const phaseTokenRef = useRef(createPhaseToken());
  const scheduleGenerationRef = useRef(0);
  const sessionReadyRef = useRef(false);
  const responseQueueRef = useRef([]);
  const sessionRef = useRef(null);

  const currentSession = {
    currentPhase,
    completedPomodoros,
    isCounting,
    isPaused,
    remainingSeconds,
    targetEndTime: deadlineRef.current,
    phaseDurationSeconds: activePhaseDurationRef.current,
    phaseToken: phaseTokenRef.current,
    alarmActive,
  };
  sessionRef.current = currentSession;

  const reportSessionError = useCallback((error) => {
    const message =
      error instanceof Error ? error.message : 'No se pudo guardar la sesión del temporizador.';
    setSessionError(message);
  }, []);

  const persistSession = useCallback(
    (session) => {
      saveTimerSession(session).catch(reportSessionError);
    },
    [reportSessionError],
  );

  const setSession = useCallback((session) => {
    sessionRef.current = session;
    deadlineRef.current = session.targetEndTime;
    activePhaseDurationRef.current = session.phaseDurationSeconds;
    phaseTokenRef.current = session.phaseToken;
    hasStartedPhaseRef.current = session.isCounting || session.isPaused;
    setCurrentPhase(session.currentPhase);
    setCompletedPomodoros(session.completedPomodoros);
    setRemainingSeconds(session.remainingSeconds);
    setIsCounting(session.isCounting);
    setIsPaused(session.isPaused);
    setAlarmActive(session.alarmActive);
  }, []);

  const phaseDurationsRef = useRef(phaseDurations);
  const settingsRef = useRef(settings);
  phaseDurationsRef.current = phaseDurations;
  settingsRef.current = settings;

  const scheduleForRun = useCallback(async (session, generation) => {
    const notificationId = await schedulePhaseNotification({
      phaseLabel: PHASE_LABELS[session.currentPhase],
      targetEndTime: session.targetEndTime,
      phaseToken: session.phaseToken,
    });

    if (scheduleGenerationRef.current !== generation && notificationId) {
      await cancelScheduledPhaseNotifications();
    }
  }, []);

  const advanceFromCompletedPhase = useCallback(
    (finishedSession, notify) => {
      const durations = phaseDurationsRef.current;
      let nextSession;

      if (finishedSession.currentPhase === 'study') {
        const nextCompletedCount = finishedSession.completedPomodoros + 1;
        if (nextCompletedCount >= settingsRef.current.pomodorosPerCycle) {
          nextSession = {
            currentPhase: 'longBreak',
            completedPomodoros: 0,
            remainingSeconds: durations.longBreak,
            phaseDurationSeconds: durations.longBreak,
          };
        } else {
          nextSession = {
            currentPhase: 'shortBreak',
            completedPomodoros: nextCompletedCount,
            remainingSeconds: durations.shortBreak,
            phaseDurationSeconds: durations.shortBreak,
          };
        }
      } else {
        nextSession = {
          currentPhase: 'study',
          completedPomodoros: finishedSession.completedPomodoros,
          remainingSeconds: durations.study,
          phaseDurationSeconds: durations.study,
        };
      }

      const session = {
        ...nextSession,
        isCounting: false,
        isPaused: false,
        targetEndTime: null,
        phaseToken: createPhaseToken(),
        alarmActive: true,
      };
      scheduleGenerationRef.current += 1;
      setSession(session);
      persistSession(session);
      cancelScheduledPhaseNotifications().catch(reportSessionError);

      if (notify) {
        presentPhaseCompletionNotification({
          phaseLabel: PHASE_LABELS[finishedSession.currentPhase],
          phaseToken: finishedSession.phaseToken,
        }).catch(reportSessionError);
      }
    },
    [persistSession, reportSessionError, setSession],
  );

  const completePhaseRef = useRef(advanceFromCompletedPhase);
  completePhaseRef.current = advanceFromCompletedPhase;

  const processNotificationResponse = useCallback(
    (response) => {
      if (!isPomodoroNotification(response)) {
        return;
      }

      const session = sessionRef.current;
      const responsePhaseToken =
        response.notification.request.content.data?.phaseToken;

      if (
        responsePhaseToken === session?.phaseToken &&
        session.isCounting &&
        session.targetEndTime <= Date.now()
      ) {
        completePhaseRef.current(session, false);
      }

      stopPhaseNotification(response.notification.request.identifier).catch(
        reportSessionError,
      );
      if (session) {
        setSession({ ...sessionRef.current, alarmActive: false });
        persistSession({ ...sessionRef.current, alarmActive: false });
      }
    },
    [persistSession, reportSessionError, setSession],
  );

  useEffect(() => {
    let responseSubscription;
    let isMounted = true;
    async function restoreSession() {
      try {
        await configureNotifications();
        const initialResponse = getInitialNotificationResponse();
        responseSubscription = addNotificationResponseListener((response) => {
          if (!sessionReadyRef.current) {
            responseQueueRef.current.push(response);
            return;
          }
          processNotificationResponse(response);
        });

        const [storedSettings, storedSession] = await Promise.all([
          loadSettings(),
          loadTimerSession(),
        ]);
        if (!isMounted) {
          return;
        }

        setSettings(storedSettings);
        const durations = {
          study: storedSettings.studyDurationMinutes * 60,
          shortBreak: storedSettings.shortBreakDurationMinutes * 60,
          longBreak: storedSettings.longBreakDurationMinutes * 60,
        };
        let restored = storedSession
          ? {
              ...createInitialSession(storedSettings),
              ...storedSession,
              phaseToken: storedSession.phaseToken ?? createPhaseToken(),
              phaseDurationSeconds:
                storedSession.phaseDurationSeconds ?? durations[storedSession.currentPhase],
              alarmActive: storedSession.alarmActive ?? false,
            }
          : createInitialSession(storedSettings);

        settingsRef.current = storedSettings;
        phaseDurationsRef.current = durations;

        if (restored.isCounting && Number.isFinite(restored.targetEndTime)) {
          const secondsRemaining = Math.ceil((restored.targetEndTime - Date.now()) / 1000);
          if (secondsRemaining > 0) {
            restored = { ...restored, remainingSeconds: secondsRemaining };
            deadlineRef.current = restored.targetEndTime;
          } else {
            const finishedSession = {
              ...restored,
              isCounting: false,
              isPaused: false,
              remainingSeconds: 0,
            };
            deadlineRef.current = null;
            setSession(restored);
            const openedFromCompletionNotification =
              isPomodoroNotification(initialResponse) &&
              initialResponse.notification.request.content.data?.phaseToken ===
                restored.phaseToken;
            completePhaseRef.current(
              finishedSession,
              !openedFromCompletionNotification,
            );
            restored = sessionRef.current;
          }
        } else if (restored.isPaused) {
          restored = {
            ...restored,
            isCounting: false,
            isPaused: true,
            targetEndTime: null,
          };
          deadlineRef.current = null;
        } else {
          restored = {
            ...restored,
            isCounting: false,
            isPaused: false,
            targetEndTime: null,
            remainingSeconds: durations[restored.currentPhase],
            phaseDurationSeconds: durations[restored.currentPhase],
          };
          deadlineRef.current = null;
        }

        setSession(restored);
        sessionReadyRef.current = true;

        if (restored.isCounting && restored.targetEndTime > Date.now()) {
          scheduleGenerationRef.current += 1;
          scheduleForRun(restored, scheduleGenerationRef.current).catch(reportSessionError);
        } else if (!restored.isCounting) {
          persistSession(restored);
        }

        if (
          initialResponse &&
          !responseQueueRef.current.some(
            (response) =>
              response.notification.request.identifier ===
              initialResponse.notification.request.identifier,
          )
        ) {
          responseQueueRef.current.push(initialResponse);
        }
        const queuedResponses = responseQueueRef.current.splice(0);
        const seenResponses = new Set();
        queuedResponses.forEach((response) => {
          const responseId = `${response.notification.request.identifier}:${response.actionIdentifier}`;
          if (!seenResponses.has(responseId)) {
            seenResponses.add(responseId);
            processNotificationResponse(response);
          }
        });
        clearInitialNotificationResponse().catch(reportSessionError);
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo recuperar la sesión del temporizador.';
          setSessionError(message);
        }
      } finally {
        if (isMounted) {
          setSettingsLoaded(true);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
      sessionReadyRef.current = false;
      responseSubscription?.remove();
    };
  }, [
    persistSession,
    processNotificationResponse,
    reportSessionError,
    scheduleForRun,
    setSession,
  ]);

  useEffect(() => {
    if (!isCounting) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      const targetEndTime = deadlineRef.current;
      if (targetEndTime === null) {
        return;
      }

      const secondsRemaining = Math.ceil((targetEndTime - Date.now()) / 1000);
      if (secondsRemaining <= 0) {
        completePhaseRef.current(sessionRef.current, true);
      } else {
        setRemainingSeconds(secondsRemaining);
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, [isCounting]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const session = sessionRef.current;
      if (!sessionReadyRef.current || !session) {
        return;
      }

      if (nextAppState === 'active' && session.isCounting && session.targetEndTime) {
        const secondsRemaining = Math.ceil((session.targetEndTime - Date.now()) / 1000);
        if (secondsRemaining <= 0) {
          completePhaseRef.current(session, true);
        } else {
          const updatedSession = { ...session, remainingSeconds: secondsRemaining };
          setSession(updatedSession);
          persistSession(updatedSession);
        }
      } else if (nextAppState !== 'active') {
        persistSession(session);
      }
    });

    return () => subscription.remove();
  }, [persistSession, setSession]);

  const startTimer = useCallback(() => {
    if (isCounting || isPaused || !settingsLoaded || remainingSeconds <= 0) {
      return;
    }

    const targetEndTime = Date.now() + remainingSeconds * 1000;
    const session = {
      ...sessionRef.current,
      isCounting: true,
      isPaused: false,
      remainingSeconds,
      targetEndTime,
      phaseDurationSeconds: remainingSeconds,
      phaseToken: createPhaseToken(),
      alarmActive: false,
    };
    scheduleGenerationRef.current += 1;
    const generation = scheduleGenerationRef.current;
    setSession(session);
    persistSession(session);
    stopPhaseNotification().catch(reportSessionError);
    scheduleForRun(session, generation).catch(reportSessionError);
  }, [
    isCounting,
    isPaused,
    persistSession,
    remainingSeconds,
    reportSessionError,
    scheduleForRun,
    setSession,
    settingsLoaded,
  ]);

  const pauseTimer = useCallback(() => {
    const session = sessionRef.current;
    if (!session.isCounting || session.targetEndTime === null) {
      return;
    }

    const secondsRemaining = Math.max(
      0,
      Math.ceil((session.targetEndTime - Date.now()) / 1000),
    );
    if (secondsRemaining === 0) {
      completePhaseRef.current(session, true);
      return;
    }

    scheduleGenerationRef.current += 1;
    const pausedSession = {
      ...session,
      isCounting: false,
      isPaused: true,
      remainingSeconds: secondsRemaining,
      targetEndTime: null,
    };
    deadlineRef.current = null;
    setSession(pausedSession);
    persistSession(pausedSession);
    cancelScheduledPhaseNotifications().catch(reportSessionError);
  }, [persistSession, reportSessionError, setSession]);

  const resumeTimer = useCallback(() => {
    const session = sessionRef.current;
    if (!session.isPaused || session.remainingSeconds <= 0) {
      return;
    }

    const targetEndTime = Date.now() + session.remainingSeconds * 1000;
    const resumedSession = {
      ...session,
      isCounting: true,
      isPaused: false,
      targetEndTime,
      phaseToken: createPhaseToken(),
      alarmActive: false,
    };
    scheduleGenerationRef.current += 1;
    const generation = scheduleGenerationRef.current;
    setSession(resumedSession);
    persistSession(resumedSession);
    stopPhaseNotification().catch(reportSessionError);
    scheduleForRun(resumedSession, generation).catch(reportSessionError);
  }, [persistSession, reportSessionError, scheduleForRun, setSession]);

  const resetTimer = useCallback(() => {
    Alert.alert(
      'Reiniciar temporizador',
      '¿Quieres volver al tiempo inicial de esta fase?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            scheduleGenerationRef.current += 1;
            const session = {
              ...sessionRef.current,
              isCounting: false,
              isPaused: false,
              remainingSeconds: activePhaseDurationRef.current,
              targetEndTime: null,
              alarmActive: false,
              phaseToken: createPhaseToken(),
            };
            deadlineRef.current = null;
            setSession(session);
            persistSession(session);
            stopPhaseNotification().catch(reportSessionError);
          },
        },
      ],
      { cancelable: true },
    );
  }, [persistSession, reportSessionError, setSession]);

  const stopAlarm = useCallback(() => {
    const session = sessionRef.current;
    scheduleGenerationRef.current += 1;
    const stoppedSession = { ...session, alarmActive: false };
    setSession(stoppedSession);
    persistSession(stoppedSession);
    stopPhaseNotification().catch(reportSessionError);
  }, [persistSession, reportSessionError, setSession]);

  const applySettings = useCallback(
    async (saveSettingsChange) => {
      const savedSettings = await saveSettingsChange();
      const durations = {
        study: savedSettings.studyDurationMinutes * 60,
        shortBreak: savedSettings.shortBreakDurationMinutes * 60,
        longBreak: savedSettings.longBreakDurationMinutes * 60,
      };

      settingsRef.current = savedSettings;
      phaseDurationsRef.current = durations;
      setSettings(savedSettings);
      setSettingsError(null);

      const session = sessionRef.current;
      if (!session.isCounting && !session.isPaused) {
        const updatedSession = {
          ...session,
          remainingSeconds: durations[session.currentPhase],
          phaseDurationSeconds: durations[session.currentPhase],
          targetEndTime: null,
        };

        setSession(updatedSession);
        await saveTimerSession(updatedSession);
      }
    },
    [setSession],
  );

  const updateSettings = useCallback(
    (nextSettings) => applySettings(() => saveSettings(nextSettings)),
    [applySettings],
  );

  const restoreDefaultSettings = useCallback(
    () => applySettings(resetStoredSettings),
    [applySettings],
  );

  return {
    settings,
    settingsLoaded,
    settingsError,
    sessionError,
    isCounting,
    isPaused,
    currentPhase,
    completedPomodoros,
    pomodorosPerCycle: settings.pomodorosPerCycle,
    remainingSeconds,
    alarmActive,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopAlarm,
    updateSettings,
    restoreDefaultSettings,
  };
}
