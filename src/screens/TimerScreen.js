import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SettingsModal from '../components/SettingsModal';
import { colors } from '../constants/theme';
import usePomodoroEngine from '../hooks/usePomodoroEngine';

const PHASES = {
  study: { label: 'Estudio' },
  shortBreak: { label: 'Descanso Corto' },
  longBreak: { label: 'Descanso Largo' },
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TimerScreen() {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const {
    settings,
    settingsLoaded,
    settingsError,
    sessionError,
    isCounting,
    isPaused,
    alarmActive,
    currentPhase,
    completedPomodoros,
    pomodorosPerCycle,
    remainingSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopAlarm,
    updateSettings,
    restoreDefaultSettings,
  } = usePomodoroEngine();

  useEffect(() => {
    const error = settingsError || sessionError;
    if (error) {
      Alert.alert('Temporizador no disponible', error);
    }
  }, [sessionError, settingsError]);

  const displayedPomodoro =
    currentPhase === 'longBreak' ? pomodorosPerCycle : completedPomodoros + 1;
  const completedSegments =
    currentPhase === 'longBreak' ? pomodorosPerCycle : displayedPomodoro;
  const toggleTimer = isCounting ? pauseTimer : isPaused ? resumeTimer : startTimer;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>ACADEMIA COTOPAXI</Text>
        <Text style={styles.title}>Pomodoro</Text>
        <Text style={styles.subtitle}>Un paso a la vez. Mantén el enfoque.</Text>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.phaseLabel}>{PHASES[currentPhase].label}</Text>
        <View style={[styles.timerRing, isCounting && styles.activeTimerRing]}>
          <Text
            accessibilityLabel={`Tiempo restante ${formatTime(remainingSeconds)}`}
            style={[styles.timerText, isCounting && styles.activeTimerText]}
          >
            {formatTime(remainingSeconds)}
          </Text>
          <Text style={[styles.timerCaption, isCounting && styles.activeTimerCaption]}>
            {alarmActive
              ? 'Fase terminada · siguiente fase lista'
              : isCounting
                ? 'Mantén el enfoque'
                : isPaused
                  ? 'Temporizador pausado'
                  : 'Listo para comenzar'}
          </Text>
        </View>
        <Text style={styles.cycleLabel}>
          Pomodoro {displayedPomodoro} de {pomodorosPerCycle}
        </Text>
        <View style={styles.progressTrack} accessibilityLabel="Progreso del ciclo">
          {Array.from({ length: pomodorosPerCycle }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < completedSegments && styles.progressDotComplete,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          disabled={!settingsLoaded}
          onPress={toggleTimer}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            !settingsLoaded && styles.disabledButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isCounting ? 'Pausar' : isPaused ? 'Continuar' : 'Iniciar'}
          </Text>
        </Pressable>

        {alarmActive && (
          <Pressable
            accessibilityRole="button"
            onPress={stopAlarm}
            style={({ pressed }) => [
              styles.stopAlarmButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.stopAlarmButtonText}>Detener</Text>
          </Pressable>
        )}

        <View style={styles.secondaryControls}>
          <Pressable
            accessibilityRole="button"
            onPress={resetTimer}
            style={({ pressed }) => [
              styles.secondaryButton,
              styles.resetButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.resetButtonText}>Reiniciar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!settingsLoaded}
            onPress={() => setIsSettingsVisible(true)}
            style={({ pressed }) => [
              styles.secondaryButton,
              styles.settingsButton,
              pressed && styles.buttonPressed,
              !settingsLoaded && styles.disabledButton,
            ]}
          >
            <Text style={styles.settingsButtonText}>Ajustes</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footer}>ACADEMIA COTOPAXI · ENFOQUE Y BIENESTAR</Text>
      <SettingsModal
        visible={isSettingsVisible}
        settings={settings}
        onSave={updateSettings}
        onReset={restoreDefaultSettings}
        onClose={() => setIsSettingsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
  },
  header: {
    width: '100%',
    alignItems: 'center',
  },
  brand: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    marginTop: 8,
    color: colors.navy,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: colors.mutedText,
    fontSize: 14,
    textAlign: 'center',
  },
  timerCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    backgroundColor: colors.white,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  phaseLabel: {
    marginBottom: 12,
    color: colors.navy,
    fontSize: 18,
    fontWeight: '700',
  },
  timerRing: {
    width: '100%',
    maxWidth: 260,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: colors.gold,
    borderRadius: 150,
    backgroundColor: colors.white,
  },
  activeTimerRing: {
    backgroundColor: colors.navy,
  },
  timerText: {
    color: colors.navy,
    fontSize: 64,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: -2,
  },
  activeTimerText: {
    color: colors.gold,
  },
  timerCaption: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: 13,
  },
  activeTimerCaption: {
    color: colors.white,
  },
  cycleLabel: {
    marginTop: 15,
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.background,
  },
  progressDotComplete: {
    backgroundColor: colors.gold,
  },
  controls: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.navy,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  stopAlarmButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.red,
  },
  stopAlarmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    minHeight: 52,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  resetButton: {
    borderColor: colors.red,
  },
  resetButtonText: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '700',
  },
  settingsButton: {
    borderColor: colors.gold,
  },
  settingsButtonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  disabledButton: {
    opacity: 0.55,
  },
  footer: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
