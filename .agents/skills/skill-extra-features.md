# SKILL: Extra Features (Checklist & Motivational Quotes)

## Propósito
Integrar valor agregado a la sesión de estudio mediante una lista de tareas de enfoque rápido y frases motivacionales académicas, manteniendo el principio 100% offline y libre de anuncios (HU-006).

## Especificaciones de Requisitos (Specs)

### Requisito 1: Mini Lista de Tareas de Sesión (Checklist)
- **Componente:** Módulo colapsable o sección inferior en la pantalla del temporizador.
- **Acciones:**
  - Agregar tarea rápida (ej. "Leer capítulo 2", "Resolver ejercicios 1 a 5").
  - Marcar / Desmarcar tarea como completada (efecto tachado visual).
  - Eliminar tarea individual o limpiar tareas completadas.
- **Persistencia:** Guardar las tareas en `AsyncStorage` para no perderlas al cerrar la app.

### Requisito 2: Frases Motivacionales Académicas
- **Fuente de datos:** Archivo JSON local (`src/constants/quotes.json`) con al menos 10 frases de enfoque, disciplina y hábitos de estudio.
- **Comportamiento:**
  - Al iniciar o cambiar a una fase de **Estudio**, seleccionar y mostrar una frase motivacional aleatoria.
  - Diseño: Tarjeta discreta con tipografía clara y los colores corporativos de la Academia Cotopaxi (Azul Marino `#001A49` y Dorado `#E2A900`).

## Pautas de Código
- Implementar `ChecklistSection.js` como componente reutilizable.
- Garantizar que ninguna de estas características requiera conexión a internet ni consumo de APIs externas.