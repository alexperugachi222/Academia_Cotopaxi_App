# SKILL: Background & Notifications Specialist

## Propósito
Asegurar el cálculo preciso del tiempo transcurrido en segundo plano/pantalla bloqueada y gestionar las alertas nativas del sistema operativo[cite: 1].

## Especificaciones de Requisitos (Specs)

### Requisito 1: Persistencia en Segundo Plano y Cierre (HU-003)
- **Bloqueo / Minimizado:** Guardar timestamp de finalización esperado (`targetEndTime = Date.now() + tiempoRestante`). Al reabrir, calcular `tiempoRestante = targetEndTime - Date.now()`[cite: 1].
- **Cierre de la app (Apps recientes):** Guardar el estado activo en almacenamiento persisite. Al volver a abrir, recuperar la sesión y actualizar el tiempo restante correcto[cite: 1].
- **Finalización con app cerrada:** Si el tiempo expiró mientras la app estaba cerrada, mostrar la fase como "Terminada" al abrirla y lanzar la notificación/aviso[cite: 1].
- **App pausada al cerrar:** Si se cierra estando en pausa, reabrir en pausa con el mismo tiempo restante exacto sin emitir alertas[cite: 1].

### Requisito 2: Alertas y Notificaciones Nativas (HU-004)
- **Modo Sonido:** Emitir notificación con sonido y vibración indicando la fase finalizada[cite: 1].
- **Modo Silencio / Vibración:** Disparar aviso tipo alarma que suene, vibre y sea visible en la pantalla de bloqueo[cite: 1].
- **Acción de Detención:** Al tocar la notificación o el botón "Detener", silenciar la alarma y abrir la app mostrando la siguiente fase precargada[cite: 1].
- **Explicación de Permisos:** Antes de solicitar el permiso de notificaciones por primera vez, mostrar un modal interno explicando la necesidad del permiso para el funcionamiento de las alarmas[cite: 1].
