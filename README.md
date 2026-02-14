# Plataforma LGBTI Telegram

Miniapp de descubrimiento, likes, matches y chat para la comunidad LGBTI, integrada con Telegram WebApp.

## Características
- Perfil inclusivo con pronombres, género, orientación e intenciones.
- Descubrimiento con filtros por orientación, intenciones y distancia.
- Likes y matches recíprocos con notificaciones vía Bot API.
- Chat en tiempo real con SSE y historial bilateral.
- Moderación básica (reportes, verificación, bloqueos) con acceso de admins.
- Métricas diarias de likes, matches y mensajes.

## Variables de entorno
```bash
DATABASE_URL=postgresql://user:password@host:port/dbname?schema=public
BOT_TOKEN=your_bot_token
MOD_ADMINS=telegram_user_id_1,telegram_user_id_2
PORT=8080
HTTPS_CERT_PATH=./cert.pem  # opcional
HTTPS_KEY_PATH=./key.pem     # opcional
HTTPS_PORT=8443              # opcional
```

## Despliegue local
```bash
npm install
npm run db:push  # requiere DATABASE_URL configurada
npm run db:push
npm start
```

Configura `DATABASE_URL` en `.env` (puedes copiar de `.env.example`). Se recomienda usar Neon (Postgres gestionado) si no tienes Postgres local.

## Despliegue en Vercel
1. Conecta el repositorio en Vercel.
2. Configura variables: `DATABASE_URL` (Neon), `BOT_TOKEN`, `MOD_ADMINS`.
3. vercel.json ya enruta a `bot/server.vercel.js`.
4. Ejecuta `prisma db push` apuntando a Neon para crear tablas.

## Neon (Postgres)
- Crea un proyecto en Neon y copia la `DATABASE_URL` de Postgres.
- Usa `DATABASE_URL` también en local si no tienes Postgres instalado.

## Uso
1. Abre tu bot en Telegram y pulsa el botón de WebApp.
2. Completa tu perfil y aplica filtros.
3. Descubre personas, da likes y chatea cuando haya match.
4. Los admins pueden acceder a la sección Moderación dentro de la miniapp.

## Contribuir
- Lee las pautas en [CONTRIBUTING.md](CONTRIBUTING.md)
- Código de Conducta: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Plantillas:
  - Issues: [bug_report](.github/ISSUE_TEMPLATE/bug_report.md), [feature_request](.github/ISSUE_TEMPLATE/feature_request.md)
  - Pull Requests: [pull_request_template](.github/pull_request_template.md)

## Seguridad
- Revisa el proceso de reporte en [SECURITY.md](SECURITY.md)

## Versionado
- Seguimos SemVer: MAJOR.MINOR.PATCH
- Etiquetas de release en Git (`vX.Y.Z`) y changelog en PRs

## Demo mode y tests
- `npm run test:validation` levanta el servidor local con `DEMO=true` y ejecuta los suites (chat, guards, me, report, mod).
- Para “smoke tests” remotos contra API/Vercel usa `test:parity:remote`:
  - Define `TEST_BASES` con las URLs destino.
  - Para incluir moderación en DEMO remoto, el deployment debe tener:
    - `DEMO=true`
    - `DEMO_SECRET=<valor>`
  - El cliente debe enviar el header `x-demo-secret: <DEMO_SECRET>`.
- Nota: Nunca habilitar `DEMO=true` en producción o previews.

## Deployment Checklist (Map)
> Objetivo: evitar habilitar el mapa por error en Production.  
> Recomendación: habilitar primero en Preview/Staging, validar 409/402 y recién después avanzar a Fase 3 (mapa real).

### Flags por entorno

**Production (por ahora)**
- `FEATURE_MAP=false`
- `MAP_REQUIRE_CONSENT=false` (opcional)
- `MAP_PAID=true|false` (irrelevante si FEATURE_MAP=false)

**Preview/Staging (para probar consentimiento sin paywall)**
- `FEATURE_MAP=true`
- `MAP_REQUIRE_CONSENT=true`
- `MAP_PAID=false`

**Preview/Staging (para probar paywall después del consentimiento)**
- `FEATURE_MAP=true`
- `MAP_REQUIRE_CONSENT=true`
- `MAP_PAID=true`

### Seguridad / hard rules
- Nunca habilitar `DEMO=true` en Production/Preview.
- Si se habilita moderación DEMO en remoto (solo en entornos controlados):
  - requiere `DEMO=true`, `initData=demo_init_data` y header `x-demo-secret: <DEMO_SECRET>`.

### Pasos de despliegue (Vercel/API)
1. Setear env vars en el entorno correcto (Preview/Staging).
2. Redeploy del deployment para que tome las vars.
3. Verificar el endpoint:
   - `FEATURE_MAP=false` → 404
   - `MAP_REQUIRE_CONSENT=true` y sin consentimiento → 409 `CONSENT_REQUIRED`
   - `MAP_PAID=true` → 402 `PAYMENT_REQUIRED`
   - OK (stub) → 200 `{ ok:true, locations: [] }`

Ejemplo:
```bash
curl -i "https://<preview-url>/api/map/nearby?initData=demo_init_data"
```

### Rollback rápido
- Volver `FEATURE_MAP=false` en el entorno afectado y redeploy.

### Variables extra (Mapa)
- `MAP_LOCATION_MAX_AGE_MIN` (default 1440): antigüedad máxima de ubicación para aparecer en nearby.
- `MAP_GEOHASH_OUT_PRECISION`:
  - `0`/unset → no truncar (solo jitter)
  - `6` → truncado moderado + jitter (recomendado para Preview)
  - `5` → truncado agresivo (usar solo si se necesita mayor privacidad)
- `MAP_JITTER_MIN_M` y `MAP_JITTER_MAX_M`:
  - rango de jitter determinístico en metros aplicado a cada marker
  - default: 80–250 (subir si querés romper más la grilla visual)
