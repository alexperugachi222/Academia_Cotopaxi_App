import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@cotopaxi-pomodoro/settings';
const TIMER_SESSION_KEY = '@cotopaxi-pomodoro/timer-session';
const CHECKLIST_KEY = '@cotopaxi-pomodoro/checklist';

export const DEFAULT_SETTINGS = Object.freeze({
  studyDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  pomodorosPerCycle: 4,
});

export const SETTINGS_RANGES = Object.freeze({
  studyDurationMinutes: { min: 1, max: 180 },
  shortBreakDurationMinutes: { min: 1, max: 120 },
  longBreakDurationMinutes: { min: 1, max: 120 },
  pomodorosPerCycle: { min: 1, max: 12 },
});

export const SETTINGS_FIELDS = Object.freeze([
  {
    key: 'studyDurationMinutes',
    label: 'Tiempo de estudio',
    unit: 'minutos',
  },
  {
    key: 'shortBreakDurationMinutes',
    label: 'Descanso corto',
    unit: 'minutos',
  },
  {
    key: 'longBreakDurationMinutes',
    label: 'Descanso largo',
    unit: 'minutos',
  },
  {
    key: 'pomodorosPerCycle',
    label: 'Pomodoros por ciclo',
    unit: 'pomodoros',
  },
]);

export function validateSettings(settings) {
  const errors = {};

  for (const { key } of SETTINGS_FIELDS) {
    const value = settings[key];
    const { min, max } = SETTINGS_RANGES[key];
    if (!Number.isInteger(value) || value < min || value > max) {
      errors[key] = `Ingresa un número entero entre ${min} y ${max}.`;
    }
  }

  return errors;
}

export async function loadSettings() {
  const serializedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
  if (serializedSettings === null) {
    return { ...DEFAULT_SETTINGS };
  }

  let storedSettings;
  try {
    storedSettings = JSON.parse(serializedSettings);
  } catch (error) {
    throw new Error('No se pudieron leer los ajustes guardados.', { cause: error });
  }

  if (!storedSettings || typeof storedSettings !== 'object' || Array.isArray(storedSettings)) {
    throw new Error('Los ajustes guardados tienen un formato no válido.');
  }

  const settings = { ...DEFAULT_SETTINGS, ...storedSettings };
  const errors = validateSettings(settings);
  if (Object.keys(errors).length > 0) {
    throw new Error('Los ajustes guardados contienen valores fuera de rango.');
  }

  return settings;
}

export async function saveSettings(settings) {
  const errors = validateSettings(settings);
  if (Object.keys(errors).length > 0) {
    throw new Error(`No se pueden guardar los ajustes: ${Object.values(errors).join(' ')}`);
  }

  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return { ...settings };
}

export async function resetSettings() {
  return saveSettings(DEFAULT_SETTINGS);
}

export async function loadTimerSession() {
  const serializedSession = await AsyncStorage.getItem(TIMER_SESSION_KEY);
  if (serializedSession === null) {
    return null;
  }

  let session;
  try {
    session = JSON.parse(serializedSession);
  } catch (error) {
    throw new Error('No se pudo recuperar la sesión del temporizador.', { cause: error });
  }

  const validPhases = ['study', 'shortBreak', 'longBreak'];
  if (
    !session ||
    typeof session !== 'object' ||
    !validPhases.includes(session.currentPhase) ||
    !Number.isInteger(session.completedPomodoros) ||
    session.completedPomodoros < 0 ||
    !Number.isInteger(session.remainingSeconds) ||
    session.remainingSeconds < 0 ||
    typeof session.isCounting !== 'boolean' ||
    typeof session.isPaused !== 'boolean' ||
    (session.isCounting && session.isPaused) ||
    (session.isCounting && !Number.isFinite(session.targetEndTime))
  ) {
    throw new Error('La sesión guardada del temporizador tiene un formato no válido.');
  }

  return session;
}

export async function saveTimerSession(session) {
  await AsyncStorage.setItem(TIMER_SESSION_KEY, JSON.stringify(session));
}

export async function loadChecklist() {
  const serializedChecklist = await AsyncStorage.getItem(CHECKLIST_KEY);
  if (serializedChecklist === null) {
    return [];
  }

  let tasks;
  try {
    tasks = JSON.parse(serializedChecklist);
  } catch (error) {
    throw new Error('No se pudo leer la lista de tareas guardada.', { cause: error });
  }

  if (
    !Array.isArray(tasks) ||
    tasks.some(
      (task) =>
        !task ||
        typeof task !== 'object' ||
        typeof task.id !== 'string' ||
        typeof task.text !== 'string' ||
        typeof task.completed !== 'boolean',
    )
  ) {
    throw new Error('La lista de tareas guardada tiene un formato no válido.');
  }

  return tasks;
}

export async function saveChecklist(tasks) {
  if (
    !Array.isArray(tasks) ||
    tasks.some(
      (task) =>
        !task ||
        typeof task !== 'object' ||
        typeof task.id !== 'string' ||
        typeof task.text !== 'string' ||
        typeof task.completed !== 'boolean',
    )
  ) {
    throw new Error('No se puede guardar una lista de tareas con formato no válido.');
  }

  await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(tasks));
}
