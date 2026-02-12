## Objetivo
Implementar recibos de entrega/lectura en el chat: campos en mensajes, endpoints para marcar como leído, eventos SSE para actualizaciones y UI con doble check.

## Modelo de Datos (Prisma)
- Añadir a Message: `deliveredAt DateTime?`, `readAt DateTime?` y un índice por `(toUserId, readAt)`.
- Mantener compatibilidad con datos existentes.
- Archivo: [schema.prisma](file:///c:/Users/cesar/Documents/trae_projects/prisma/prisma/schema.prisma).

## Backend (API)
- Marcar entrega automática:
  - Enviar en `/api/chat/send` con `deliveredAt = now()` al guardar.
- Nuevo endpoint: `POST /api/chat/mark-read`
  - Body: `{ initData, peerUserId, upToMessageId? }`.
  - Acciones: `UPDATE Message SET readAt = now() WHERE fromUserId = peer AND toUserId = me AND (id <= upToMessageId OR upToMessageId IS NULL) AND readAt IS NULL`.
- SSE (`/api/chat/subscribe`):
  - Emitir eventos `message:new` y `receipt:update` con `{ id, deliveredAt, readAt }`.
- Seguridad: validar `initData` (incluye modo demo ya soportado) en todos los endpoints.
- Archivos probables: servidor actual en [server.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js) y validación en [validateInitData.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/validateInitData.js).

## Frontend (WebApp)
- Render de mensajes en [app.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/webapp/app.js):
  - Mostrar estado: un check (enviado), doble gris (entregado), doble azul (leído).
  - Al abrir un chat: tras `loadChatHistory(peerId)`, llamar `POST /api/chat/mark-read` para todos los mensajes entrantes visibles.
  - Suscribirse a SSE y actualizar el DOM con `receipt:update`.
- HTML/CSS: agregar pequeños íconos/estilos en [index.html](file:///c:/Users/cesar/Documents/trae_projects/prisma/webapp/index.html) para los checks.

## Métricas y Moderación
- Actualizar conteo de mensajes leídos (opcional) en tabla `Stats` si existe.
- No exponer estados a otros usuarios más allá del destinatario.

## Verificación
- Flujo demo local: dos usuarios simulados (el actual y peer) para probar envío/lectura.
- Pruebas: abrir chat, enviar mensaje, verificar transición enviado→entregado→leído, reconexión SSE sin errores.

## Migración
- Ejecutar generación de cliente Prisma y sincronización de esquema.
- Confirmar que no rompe endpoints existentes.

¿Confirmas este plan para implementar los recibos de lectura? Tras tu confirmación, haré los cambios en los archivos mencionados, realizaré las migraciones y validaré el comportamiento en la preview local.