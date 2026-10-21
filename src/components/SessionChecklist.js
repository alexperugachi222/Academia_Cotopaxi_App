import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../constants/theme';
import { loadChecklist, saveChecklist } from '../services/storage';

export default function SessionChecklist() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const tasksRef = useRef([]);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    loadChecklist()
      .then((storedTasks) => {
        if (isMounted) {
          tasksRef.current = storedTasks;
          setTasks(storedTasks);
        }
      })
      .catch((error) => {
        if (isMounted) {
          Alert.alert(
            'No se pudo cargar la lista',
            error instanceof Error ? error.message : 'Inténtalo de nuevo.',
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateTasks(update) {
    const nextTasks = update(tasksRef.current);
    tasksRef.current = nextTasks;
    setTasks(nextTasks);
    saveQueueRef.current = saveQueueRef.current
      .then(() => saveChecklist(nextTasks))
      .catch((error) => {
        Alert.alert(
          'No se pudo guardar la lista',
          error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        );
      });
  }

  function addTask() {
    const text = newTask.trim();
    if (!text || !isLoaded) {
      return;
    }

    updateTasks((currentTasks) => [
      ...currentTasks,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        completed: false,
      },
    ]);
    setNewTask('');
  }

  function toggleTask(taskId) {
    updateTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function removeTask(taskId) {
    updateTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de enfoque</Text>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="Nueva tarea"
          editable={isLoaded}
          onChangeText={setNewTask}
          onSubmitEditing={addTask}
          placeholder="Ej. Leer capítulo 2"
          placeholderTextColor={colors.mutedText}
          returnKeyType="done"
          style={styles.input}
          value={newTask}
        />
        <Pressable
          accessibilityLabel="Agregar tarea"
          accessibilityRole="button"
          disabled={!isLoaded || !newTask.trim()}
          onPress={addTask}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
            (!isLoaded || !newTask.trim()) && styles.disabled,
          ]}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>Agrega una tarea para esta sesión.</Text>
      ) : (
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Pressable
                accessibilityLabel={`${task.completed ? 'Desmarcar' : 'Completar'}: ${task.text}`}
                accessibilityRole="button"
                onPress={() => toggleTask(task.id)}
                style={styles.taskButton}
              >
                <View style={[styles.checkbox, task.completed && styles.checkboxComplete]}>
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.taskText, task.completed && styles.taskTextComplete]}>
                  {task.text}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Eliminar: ${task.text}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => removeTask(task.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    gap: 12,
  },
  title: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    minHeight: 46,
    flex: 1,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 10,
    color: colors.text,
    fontSize: 14,
  },
  addButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 30,
  },
  taskList: {
    gap: 4,
  },
  taskRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskButton: {
    minHeight: 42,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 5,
  },
  checkboxComplete: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  checkmark: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  taskText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  taskTextComplete: {
    color: colors.mutedText,
    textDecorationLine: 'line-through',
  },
  removeButton: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: colors.red,
    fontSize: 24,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.5,
  },
});
