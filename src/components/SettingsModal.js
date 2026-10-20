import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../constants/theme';
import {
  DEFAULT_SETTINGS,
  SETTINGS_FIELDS,
  SETTINGS_RANGES,
  validateSettings,
} from '../services/storage';

function settingsToForm(settings) {
  return Object.fromEntries(
    SETTINGS_FIELDS.map(({ key }) => [key, String(settings[key])]),
  );
}

export default function SettingsModal({
  visible,
  settings,
  onSave,
  onReset,
  onClose,
}) {
  const [form, setForm] = useState(() => settingsToForm(settings ?? DEFAULT_SETTINGS));
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(settingsToForm(settings ?? DEFAULT_SETTINGS));
      setErrors({});
    }
  }, [settings, visible]);

  function updateField(key, value) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
  }

  async function saveChanges() {
    const parsedSettings = Object.fromEntries(
      SETTINGS_FIELDS.map(({ key }) => [
        key,
        form[key].trim() === '' ? NaN : Number(form[key]),
      ]),
    );
    const validationErrors = validateSettings(parsedSettings);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(parsedSettings);
      onClose();
    } catch (error) {
      Alert.alert(
        'No se pudieron guardar los ajustes',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function confirmReset() {
    Alert.alert(
      'Restablecer ajustes',
      '¿Quieres volver a 25 min de estudio, 5 min de descanso corto, 15 min de descanso largo y 4 pomodoros?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await onReset();
              setForm(settingsToForm(DEFAULT_SETTINGS));
              setErrors({});
            } catch (error) {
              Alert.alert(
                'No se pudieron restablecer los ajustes',
                error instanceof Error ? error.message : 'Inténtalo de nuevo.',
              );
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>PERSONALIZA TU RITMO</Text>
              <Text style={styles.title}>Ajustes</Text>
            </View>
            <Pressable
              accessibilityLabel="Cerrar ajustes"
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.fields}
            keyboardShouldPersistTaps="handled"
          >
            {SETTINGS_FIELDS.map(({ key, label, unit }) => {
              const { min, max } = SETTINGS_RANGES[key];
              return (
                <View key={key} style={styles.field}>
                  <Text style={styles.label}>{label}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      accessibilityLabel={label}
                      editable={!isSaving}
                      keyboardType="number-pad"
                      maxLength={3}
                      onChangeText={(value) => updateField(key, value)}
                      selectTextOnFocus
                      style={[styles.input, errors[key] && styles.inputInvalid]}
                      value={form[key]}
                    />
                    <Text style={styles.unit}>{unit}</Text>
                  </View>
                  <Text style={errors[key] ? styles.errorText : styles.rangeText}>
                    {errors[key] ?? `Valores válidos: ${min}–${max}.`}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={confirmReset}
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.pressed,
                isSaving && styles.disabled,
              ]}
            >
              <Text style={styles.resetText}>Restablecer</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={saveChanges}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
                isSaving && styles.disabled,
              ]}
            >
              <Text style={styles.saveText}>{isSaving ? 'Guardando…' : 'Guardar'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  panel: {
    maxHeight: '92%',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 4,
    color: colors.navy,
    fontSize: 28,
    fontWeight: '800',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  closeText: {
    marginTop: -3,
    color: colors.navy,
    fontSize: 30,
    lineHeight: 34,
  },
  fields: {
    paddingBottom: 16,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
  },
  inputInvalid: {
    color: colors.red,
  },
  unit: {
    color: colors.mutedText,
    fontSize: 14,
  },
  rangeText: {
    color: colors.mutedText,
    fontSize: 12,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  resetButton: {
    minHeight: 52,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.red,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  resetText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 52,
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.navy,
  },
  saveText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.55,
  },
});
