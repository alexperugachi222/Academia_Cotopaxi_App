# SKILL: Storage & Custom Settings

## Propósito
Administrar los ajustes de duración de fases, su almacenamiento local seguro y la operatividad 100% offline sin publicidad[cite: 1].

## Especificaciones de Requisitos (Specs)

### Requisito 1: Configuración de Tiempos (HU-005)
- Permite personalizar:
  - Tiempo de estudio (Defecto: 25 min)[cite: 1].
  - Descanso corto (Defecto: 5 min)[cite: 1].
  - Descanso largo (Defecto: 15 min)[cite: 1].
  - Cantidad de pomodoros por ciclo (Defecto: 4)[cite: 1].
- **Validación de Entradas:** Bloquear campos vacíos, valores <= 0 o fuera de rango permitido. Mostrar mensajes de error indicando los rangos válidos[cite: 1].
- **Restablecimiento:** Opción con confirmación para volver a los valores por defecto (25/5/15/4)[cite: 1].
- **Regla de Cambio en Curso:** Si se modifica la duración de una fase mientras esta se encuentra corriendo, la fase actual termina con el tiempo con el que empezó y la nueva duración se aplica en el siguiente ciclo[cite: 1].

### Requisito 2: Operatividad Offline y Sin Registro (HU-006)
- Guardar preferencias usando `AsyncStorage`[cite: 1].
- Funcionamiento sin conexión a internet (Wi-Fi o datos móviles)[cite: 1].
- Aplicación libre de publicidad y accesible sin creación de cuentas[cite: 1].
