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
npm run db:push
npm start
```

## Despliegue en Vercel
1. Conecta el repositorio en Vercel.
2. Configura las variables de entorno en el panel.
3. La ruta raíz apunta a `bot/server.js`.

## Uso
1. Abre tu bot en Telegram y pulsa el botón de WebApp.
2. Completa tu perfil y aplica filtros.
3. Descubre personas, da likes y chatea cuando haya match.
4. Los admins pueden acceder a la sección Moderación dentro de la miniapp.