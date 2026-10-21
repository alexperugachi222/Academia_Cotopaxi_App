# AGENTS.md — Cotopaxi Pomodoro

## 1. Contexto del proyecto

Cotopaxi Pomodoro es una aplicación móvil de temporizador Pomodoro para la Academia Cotopaxi, construida con Expo y React Native. La aplicación permite gestionar fases de estudio, descansos cortos y descansos largos, configurar las duraciones del ciclo, conservar la sesión y utilizar notificaciones cuando estén disponibles y autorizadas.

La aplicación ya existe y funciona. El objetivo principal es mantenerla, corregir problemas concretos y ampliarla de forma controlada; no reconstruirla desde cero.

## 2. Tecnologías y estructura conocida

- Expo SDK: `~57.0.30`.
- React: `19.2.3`.
- React Native: `0.86.3`.
- JavaScript para los archivos de la aplicación; el proyecto también tiene TypeScript configurado mediante `tsconfig.json`.
- `expo-notifications` para las notificaciones nativas.
- `@react-native-async-storage/async-storage` para almacenamiento local.
- EAS Build para compilar la aplicación.
- Punto de entrada: `index.js`, que registra `App` y lo envuelve con `ErrorBoundary`.
- `App.js`: preparación de permisos y pantalla principal.
- `src/screens/TimerScreen.js`: interfaz principal del temporizador.
- `src/components/SettingsModal.js`: modal de ajustes.
- `src/components/ErrorBoundary.js`: presentación controlada de errores de renderizado.
- `src/hooks/usePomodoroEngine.js`: lógica y estado del temporizador.
- `src/services/notifications.js`: configuración, programación y gestión de notificaciones.
- `src/constants/theme.js`: colores compartidos de la interfaz.

Antes de modificar cualquier ruta, comprueba la estructura real del repositorio. Esta lista describe la estructura conocida, no autoriza a crear carpetas equivalentes innecesarias.

## 3. Skills del proyecto: consultar antes de trabajar

Busca y consulta las skills existentes cuando la tarea esté relacionada con ellas. Las skills son la referencia de requisitos y criterios especializados; este archivo define cómo debe trabajar el agente.

- `.agents/skills/skill-pomodoro-core.md`: reglas y requisitos de la lógica Pomodoro.
- `.agents/skills/skill-cotopaxi-ui-theme.md`: identidad visual, componentes y pautas de interfaz.

Si las rutas o los nombres han cambiado, localiza las skills disponibles antes de asumir que no existen. No dupliques sus contenidos completos en este archivo ni inventes requisitos que no estén respaldados por las skills, el código actual o una solicitud explícita.

## 4. Funcionalidades que se deben preservar

Al realizar cambios, conserva las funciones existentes salvo que el usuario solicite expresamente modificarlas:

- Iniciar, pausar, continuar y reiniciar el temporizador, incluyendo su confirmación.
- Distinguir las fases de estudio, descanso corto y descanso largo.
- Mostrar el tiempo restante en formato `MM:SS` y el progreso del ciclo Pomodoro.
- Permitir configurar las duraciones y el número de pomodoros del ciclo, validar los valores y restaurar los valores predeterminados.
- Guardar y recuperar los ajustes y el estado de la sesión cuando corresponda.
- Gestionar notificaciones, permisos, finalización de fases y detención de alarmas según las capacidades del dispositivo.
- Mostrar errores comprensibles sin cerrar inesperadamente la aplicación.
- Abrir directamente el temporizador, sin añadir inicio de sesión, registro ni publicidad salvo que el usuario cambie explícitamente ese requisito.

No afirmes que las notificaciones funcionan en todos los entornos. Comprueba las limitaciones de Expo Go, del development build, del sistema operativo y de los permisos.

## 5. Identidad visual

La interfaz debe respetar la identidad visual existente de Academia Cotopaxi y el tema centralizado en `src/constants/theme.js`.

- Azul marino: `#001A49`.
- Dorado: `#E2A900`.
- Rojo: `#C8102E`.
- Blanco: `#FFFFFF`.
- Fondo neutro: `#F4F6F8`.
- Texto secundario: `#667085`.

Usa los estilos y componentes existentes antes de introducir otros nuevos. Mantén la interfaz móvil, legible y accesible, con controles claramente identificables. No cambies colores, textos, distribución o comportamiento visual sin una razón relacionada con la tarea.

## 6. Reglas para modificar el código

1. Lee los archivos relevantes y las skills correspondientes antes de editar.
2. Identifica el objetivo concreto y realiza el cambio mínimo que lo resuelva.
3. Respeta la arquitectura actual. No migres a Expo Router, TypeScript, otra librería de estado ni otra estructura de carpetas solo por preferencia: la aplicación conocida utiliza `App.js`, `src/screens/`, `src/hooks/` y `src/services/`.
4. No reemplaces una implementación funcional completa cuando una modificación localizada sea suficiente.
5. No elimines funcionalidades, validaciones, manejo de errores ni persistencia para simplificar el código.
6. No agregues dependencias si puede resolverse con las herramientas existentes. Si una dependencia nueva parece necesaria, justifica el motivo y verifica su compatibilidad con el SDK actual.
7. No edites manualmente `ios/` o `android/` si son carpetas nativas generadas por Continuous Native Generation. Configura los cambios nativos mediante `app.json` o config plugins, según corresponda.
8. No inventes APIs de Expo o React Native basándote solo en memoria. Comprueba la documentación de la versión instalada antes de usar o cambiar APIs específicas.
9. No cambies configuraciones de EAS, identificadores del paquete, permisos, versiones o archivos de firma sin que la tarea lo requiera.
10. No afirmes que ejecutaste pruebas, lint, compilaciones o verificaciones si realmente no se ejecutaron.
11. Si los requisitos entran en conflicto, señala el conflicto y pregunta cuando la decisión pueda afectar funcionalidades o datos existentes.
12. Explica brevemente qué archivos cambiaste, por qué y qué comprobaciones realizaste.

## 7. Compatibilidad con Expo

Antes de cambiar código relacionado con Expo, EAS o React Native:

1. Revisa la versión instalada de `expo` en `package.json`.
2. Consulta la documentación correspondiente a esa versión en `https://docs.expo.dev/versions/v57.0.0/`.
3. Para localizar documentación específica, consulta `https://docs.expo.dev/llms.txt` y sigue los enlaces relevantes.
4. Usa `npx expo install <paquete>` para instalar dependencias compatibles con Expo. Si el repositorio usa Bun (por ejemplo, contiene `bun.lock`), utiliza el ejecutor de Bun donde corresponda.
5. Recuerda que las notificaciones nativas pueden requerir un development build y permisos del dispositivo; no asumas que Expo Go reproduce todo el comportamiento nativo.

## 8. Comprobaciones antes de dar una tarea por terminada

Ejecuta las verificaciones que estén disponibles y sean pertinentes. No agregues scripts o herramientas de lint que el proyecto no tenga configurados sin explicar por qué.

Comandos útiles:

```bash
npx expo-doctor
npx tsc --noEmit
npx expo lint
```

El proyecto puede no tener configurado un script de lint o todas las herramientas pueden no estar instaladas. Si un comando no está disponible o falla por una configuración previa, informa el resultado claramente y no lo presentes como una verificación exitosa.

Cuando el cambio afecte al temporizador, revisa como mínimo los escenarios pertinentes: inicio, pausa, continuación, reinicio, transición de fase, recuperación de sesión y persistencia. Cuando afecte notificaciones, considera permisos concedidos y denegados, app en primer plano y segundo plano, y las limitaciones del entorno de prueba.

## 9. Límites de actuación

- No reconstruyas la aplicación completa para cumplir una tarea pequeña.
- No cambies requisitos de usuario de manera implícita.
- No borres archivos, datos, configuraciones ni dependencias sin explicar la necesidad.
- No introduzcas credenciales, secretos ni datos personales en el repositorio.
- No des por hecho que una funcionalidad está probada solo porque el código parece correcto.
- Prioriza estabilidad, compatibilidad, claridad y mantenimiento por encima de refactorizaciones innecesarias.

## 10. Formato de respuesta al finalizar una tarea

Resume el trabajo en español sencillo e incluye:

- **Cambios realizados:** archivos y comportamiento afectado.
- **Motivo:** qué problema o requisito resuelve.
- **Verificaciones:** comandos y pruebas realmente ejecutados, con sus resultados.
- **Pendientes o limitaciones:** cualquier comprobación que no se pudo realizar o condición del entorno que pueda afectar al resultado.
