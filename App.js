import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TimerScreen from './src/screens/TimerScreen';
import {
  configureNotifications,
  getNotificationPermission,
  requestNotificationPermission,
} from './src/services/notifications';
import { colors } from './src/constants/theme';

export default function App() {
  const [showNotificationExplanation, setShowNotificationExplanation] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepareNotifications() {
      try {
        const notificationsAvailable = await configureNotifications();
        if (isMounted && !notificationsAvailable) {
          Alert.alert(
            'Prueba en Expo Go',
            'El temporizador funciona en Expo Go, pero este cliente no incluye el módulo nativo de notificaciones de esta versión. Para probar alarmas y notificaciones, ejecuta la app con un development build.',
          );
          return;
        }
        const permission = await getNotificationPermission();
        if (isMounted && !permission.granted && permission.canAskAgain) {
          setShowNotificationExplanation(true);
        }
      } catch (error) {
        Alert.alert(
          'Notificaciones no disponibles',
          error instanceof Error ? error.message : 'No se pudieron preparar las alarmas.',
        );
      }
    }

    prepareNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  async function enableNotifications() {
    setIsRequestingPermission(true);
    try {
      const permission = await requestNotificationPermission();
      setShowNotificationExplanation(false);
      if (!permission.granted) {
        Alert.alert(
          'Permiso no concedido',
          'El temporizador seguirá funcionando, pero las alertas no podrán mostrarse fuera de la app.',
        );
      } else if (!permission.criticalAlertsGranted) {
        Alert.alert(
          'Permiso de alertas críticas no disponible',
          'Las notificaciones normales funcionarán. Para sonar con el modo silencio activado, iOS requiere autorización especial de Apple para alertas críticas.',
        );
      }
    } catch (error) {
      Alert.alert(
        'No se pudo solicitar el permiso',
        error instanceof Error ? error.message : 'Inténtalo de nuevo desde los ajustes del dispositivo.',
      );
    } finally {
      setIsRequestingPermission(false);
    }
  }

  return (
    <View style={styles.app}>
      <TimerScreen />
      <StatusBar style="auto" />
      <Modal
        animationType="fade"
        onRequestClose={() => setShowNotificationExplanation(false)}
        transparent
        visible={showNotificationExplanation}
      >
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionEyebrow}>ALERTAS POMODORO</Text>
            <Text style={styles.permissionTitle}>¿Activar notificaciones?</Text>
            <Text style={styles.permissionMessage}>
              Cotopaxi Pomodoro puede avisarte cuando termine una fase, incluso si la app está en segundo plano o el celular está bloqueado. Las alertas usan sonido y vibración según los permisos y ajustes del dispositivo.
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={isRequestingPermission}
              onPress={enableNotifications}
              style={({ pressed }) => [
                styles.permissionPrimary,
                pressed && styles.permissionPressed,
                isRequestingPermission && styles.permissionDisabled,
              ]}
            >
              <Text style={styles.permissionPrimaryText}>
                {isRequestingPermission ? 'Solicitando…' : 'Continuar'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isRequestingPermission}
              onPress={() => setShowNotificationExplanation(false)}
              style={({ pressed }) => [
                styles.permissionSecondary,
                pressed && styles.permissionPressed,
              ]}
            >
              <Text style={styles.permissionSecondaryText}>Ahora no</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  permissionOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  permissionCard: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.white,
  },
  permissionEyebrow: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  permissionTitle: {
    marginTop: 8,
    color: colors.navy,
    fontSize: 24,
    fontWeight: '800',
  },
  permissionMessage: {
    marginTop: 12,
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
  permissionPrimary: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: colors.navy,
  },
  permissionPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  permissionSecondary: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  permissionSecondaryText: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '600',
  },
  permissionPressed: {
    opacity: 0.78,
  },
  permissionDisabled: {
    opacity: 0.55,
  },
});
