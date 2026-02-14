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
