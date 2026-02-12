## Objetivo
Consolidar el MVP en la miniapp con recomendaciones más precisas, gestión de matches, chat completo (historial y tiempo real), y un panel básico de moderación/seguridad.

## Recomendaciones avanzadas
- Añadir filtros por orientación e intenciones del usuario.
- Incorporar reglas de afinidad y exclusiones (p.ej. sin visibilidad del perfil, bloques).
- Preparar soporte de ubicación (ciudad/radio) para filtrar por distancia más adelante.

## Matches y estado de relación
- Endpoint para listar matches y estado del match.
- Normalizar claves compuestas para evitar duplicados.
- Notificaciones del Bot para nuevos matches (ya habilitadas, refinar copy y condiciones).

## Chat: historial y suscripción
- Endpoint de historial bilateral por peer.
- Suscripción SSE robusta: reconexión y limpieza de recursos.
- Marcado de lectura y ordenación por fecha; later: paginación.

## Moderación y Trust & Safety
- Endpoints: listar reportes, bloquear/desbloquear, marcar verificación.
- Reglas de visibilidad: perfiles reportados/flagged limitan alcance en /api/recs.
- Logs mínimos de moderación (sin datos sensibles).

## Seguridad y privacidad
- Validar initData en todos los endpoints con respuesta consistente.
- Políticas de visibilidad del perfil (incógnito, distancia) aplicadas en el feed.
- Hardening de payloads: tamaños máximos de texto y sanitización.

## Frontend miniapp
- Añadir UI de filtros en Descubrir (orientación/intenciones).
- Lista de matches con acceso directo al chat y carga de historial.
- Indicadores (enviado/entregado/leer) básicos.

## Deploy y Telegram
- Servir la web en HTTPS y configurar botón web_app en BotFather.
- Refinar mensajes del bot y errores visibles al usuario.

## Prisma y compatibilidad
- Mantener Prisma v6 estable; plan de migración a v7 moviendo la URL de datasource a config y constructor cuando se decida actualizar.

## Validación
- Pruebas manuales desde Telegram (initData), revisión de endpoints y reglas de filtrado.
- Métricas básicas: likes, matches, mensajes; preparar contadores.

¿Confirmas que avanzamos con este plan para implementarlo y dejarlo listo en el entorno actual?