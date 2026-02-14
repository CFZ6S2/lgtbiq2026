# Changelog

## v0.6.0

- Validación: Zod y contrato de error uniforme en chat, moderación, export y delete
- Guards: bloqueos, visibilidad y modo incógnito aplicados de forma consistente en variantes
- SSE: heartbeats y limpieza de suscriptores para conexiones estables
- Testing: suite DEMO (chat, guards, me, report, mod) con start-server-and-test; CI corre `test:all`
- Moderación DEMO remoto: gateo triple (DEMO + initData demo + `x-demo-secret`/`DEMO_SECRET`) en API/Vercel
- Export: `format=json|csv` con respuesta JSON uniforme en local/API/Vercel
- Documentación: README y `.env.example` actualizados con DEMO/DEMO_SECRET y uso de tests

Cambios de contrato: sin breaking changes; los campos añadidos son opcionales con defaults.

