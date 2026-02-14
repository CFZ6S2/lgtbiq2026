# Seguridad

## Reporte de vulnerabilidades
- No abras issues públicos para vulnerabilidades.
- Envía un reporte privado por correo a security@example.org con:
  - Descripción del problema y posibles impactos
  - Pasos para reproducir
  - Alcance afectado (servidor/cliente)

## SLA y divulgación
- Confirmación del reporte: dentro de 72 horas.
- Evaluación y mitigación: según severidad.
- Divulgación responsable: se coordinará tras la corrección.

## Buenas prácticas del proyecto
- Nunca incluir secretos en el repositorio.
- Usar variables de entorno según `.env.example`.
- Revisar accesibilidad y privacidad (incógnito, ocultar distancia).

## Modo demo (DEMO)
- El modo demo permite autenticación sin `BOT_TOKEN` usando `initData` de demostración.
- Debe activarse solo en desarrollo, mediante `DEMO=true` en el entorno local.
- Nunca habilitar `DEMO` en producción: puede permitir acceso no autenticado.
- Auditoría: revisar despliegues para asegurar `DEMO` está desactivado (`DEMO` ausente o distinto de `true`).
