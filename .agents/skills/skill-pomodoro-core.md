# SKILL: Pomodoro Core Engine

## Propósito
Gestionar la lógica de estados del temporizador, control de tiempos y la alternancia de fases de la técnica Pomodoro[cite: 1].

## Especificaciones de Requisitos (Specs)

### Requisito 1: Control de Sesión (HU-001)
- **Iniciar:** Inicia la cuenta regresiva desde el tiempo configurado para la fase actual (`MM:SS`)[cite: 1].
- **Pausar / Continuar:** Detiene la cuenta regresiva y la reanuda desde el segundo exacto en que se pausó[cite: 1].
- **Reiniciar:** Muestra diálogo de confirmación[cite: 1].
  - *Si confirma:* Restablece el temporizador al tiempo inicial de la fase activa[cite: 1].
  - *Si cancela:* Mantiene la cuenta en el tiempo en que se encontraba[cite: 1].

### Requisito 2: Alternancia de Fases (HU-002)
- **Fase de Estudio terminada (Pomodoros < límite):** Cambia a "Descanso Corto" y la deja **lista para que el usuario la inicie** (sin auto-arranque automático involuntario)[cite: 1].
- **Fase de Estudio terminada (Pomodoros = límite, defecto 4):** Cambia a "Descanso Largo", la deja **lista para iniciar** y reinicia el contador de pomodoros a 0[cite: 1].
- **Descanso terminado (Corto o Largo):** Cambia a "Fase de Estudio" y la deja **lista para iniciar**[cite: 1].
- **Visualización:** Mostrar permanentemente si se está en estudio o descanso y cuántos pomodoros se han completado dentro del ciclo[cite: 1].
