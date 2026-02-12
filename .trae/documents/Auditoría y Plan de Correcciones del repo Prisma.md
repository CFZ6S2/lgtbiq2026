## Resumen de Arquitectura
- Backend local: server HTTP con SSE y rutas REST en [server.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js).
- Backend serverless: subconjunto de rutas en [server.vercel.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.vercel.js) y alternativa en [api/index.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/api/index.js).
- Frontend WebApp: [index.html](file:///c:/Users/cesar/Documents/trae_projects/prisma/webapp/index.html), [app.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/webapp/app.js), [styles.css](file:///c:/Users/cesar/Documents/trae_projects/prisma/webapp/styles.css).
- Base de datos: Prisma PostgreSQL en [schema.prisma](file:///c:/Users/cesar/Documents/trae_projects/prisma/prisma/schema.prisma) y cliente en [db.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/db.js).

## Fallos Críticos Detectados
- Bloque fuera de lugar dentro de handleProfileSubmission en [server.js:L107-L136](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L107-L136).
- Ruta duplicada /api/mod/block-user en [server.js:L1114-L1147](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L1114-L1147) y [server.js:L1149-L1178](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L1149-L1178).
- Falta import de url en [server.vercel.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.vercel.js#L167-L170).
- [db.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/db.js#L3) fuerza DATABASE_URL = '' si falta.
- Vercel no sirve estáticos de WebApp ni docs; rutas ausentes comparado con local.
- Rate limiting inconsistente entre local y Vercel/API.
- Validación/límites de payload insuficientes; logging solo con console.*.

## Correcciones Prioritarias (Implementación)
1. Reubicar /api/chat/typing en [server.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js): sacar el bloque de L107-L136 y declararlo como ruta POST uniforme junto a otras.
2. Eliminar duplicado /api/mod/block-user: conservar bloque [L1114-L1147](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L1114-L1147) y borrar [L1149-L1178](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L1149-L1178).
3. Añadir `import url from 'url'` en cabecera de [server.vercel.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.vercel.js).
4. Arreglar configuración de Prisma en [db.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/db.js): cargar dotenv y lanzar error si falta DATABASE_URL.
5. Servir estáticos en Vercel copiando handlers GET de [api/index.js:L178-L211](file:///c:/Users/cesar/Documents/trae_projects/prisma/api/index.js#L178-L211) a [server.vercel.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.vercel.js).
6. Igualar rate limiting en Vercel/API replicando util `checkRate` de [server.js:L15-L26](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L15-L26).

## Paridad de Endpoints en Vercel
- Implementar en [server.vercel.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.vercel.js):
  - `/api/privacy/incognito` (lógica de [server.js:L576-L609](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L576-L609)).
  - `/api/chat/mark-read` (lógica de [server.js:L958-L1006](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js#L958-L1006)).
  - `/api/chat/send-media` (adaptar a storage externo o deshabilitar temporalmente).
  - SSE y eventos `typing` y `receipt:update` alineados con [server.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/server.js).

## Seguridad y Observabilidad
- Añadir límites de tamaño de JSON y validaciones estrictas en todas las rutas (p. ej. content-length y tipos).
- Integrar librería de logging (pino/winston) con niveles y correlationId.
- Sanitizar strings de entrada y filtrar datos sensibles en logs.

## DevX y Configuración
- Crear `.env.example` con `DATABASE_URL`, `BOT_TOKEN`, `MOD_ADMINS`.
- Actualizar [README.md](file:///c:/Users/cesar/Documents/trae_projects/prisma/README.md) incluyendo que `DATABASE_URL` es obligatoria en local y guía rápida (Neon/Postgres).
- Mantener `earlyAccess: true` de Prisma si es estable para el proyecto; documentar riesgos.

## Tests y CI
- Unit tests de [validateInitData.js](file:///c:/Users/cesar/Documents/trae_projects/prisma/bot/validateInitData.js) (HMAC bueno/malo, modo demo).
- Integration tests de recomendaciones, like/match, chat history.
- CI básico: lint + tests + `prisma validate` y `db push --dry-run`.

## Checklist de Acción
- Corregir 3 bugs inmediatos (bloque fuera de lugar, ruta duplicada, import faltante).
- Unificar rate limiting y paridad de endpoints en Vercel/API.
- Mejorar configuración de Prisma y documentación `.env`.
- Añadir límites/validaciones y logging estructurado.
- Definir y ejecutar plan de tests y CI.

¿Confirmas que procedamos con estas correcciones priorizadas? 