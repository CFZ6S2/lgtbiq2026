## Objetivo
Marcar mensajes como "leídos" automáticamente cuando el usuario los visualiza (al hacer scroll hasta el último entrante) y mantener recibos consistentes.

## Backend
- Reutilizar POST /api/chat/mark-read ya existente (no requiere cambios).
- Opcional: admitir `upToMessageId=null` para marcar todos los entrantes visibles (si fuera necesario, no planificado ahora).

## Frontend (WebApp)
- En app.js:
  - Usar IntersectionObserver para detectar cuándo el último mensaje entrante se hace visible en el viewport del contenedor `#chat-log`.
  - Al observar visibilidad del último entrante, llamar `/api/chat/mark-read` con `{ initData, peerUserId, upToMessageId }`.
  - Actualizar el estado visual (✓✓ azul) localmente al éxito.
  - Al recibir nuevos mensajes vía SSE, recalcular cuál es el "último entrante" y registrar/actualizar el observer.
  - Al cambiar de chat o paginar (loadOlderHistory), reconstruir el observer.
- UI: mantener los estilos existentes (msg-status/read) sin cambios.

## Verificación
- Casos: abrir chat y hacer scroll hasta el final; recibir nuevos mensajes; paginar hacia arriba y regresar al final; reconexiones SSE.
- Preview local y consola sin errores.

## Referencias
- server: [server.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js)
- webapp: [app.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/webapp/app.js), [index.html](file:///c:/Users/cesar/Documents/trae_projects/prisma/webapp/index.html)

¿Confirmas este plan para implementar el marcado de lectura al visualizar por scroll? Tras tu confirmación, procedo con los cambios y verificación.