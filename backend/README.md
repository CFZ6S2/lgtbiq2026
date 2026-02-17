# 🏳️‍🌈 Backend LGBTIQ+ Dating App

Backend refactoreado con Express.js y TypeScript para la aplicación de citas LGBTIQ+.

## 🚀 Características

- **Express.js + TypeScript**: Arquitectura moderna y type-safe
- **PostgreSQL + Prisma**: ORM robusto con migraciones
- **Firebase Admin**: Autenticación y Firestore para chat en tiempo real
- **Telegram WebApp Auth**: Autenticación segura vía Telegram
- **JWT**: Tokens seguros para sesiones
- **Rate Limiting**: Protección contra abuso
- **Validación con Zod**: Validación de datos robusta
- **Middleware de seguridad**: Helmet, CORS, compresión

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Firebase Project con Admin SDK
- Telegram Bot

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
cd backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Entorno
NODE_ENV=development
PORT=3001

# Telegram Bot (obtenido de @BotFather)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username

# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/lgbtq_dating?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Firebase Admin (obtenido de Firebase Console)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 4. Configurar base de datos
```bash
# Generar cliente Prisma
npm run prisma:generate

# Crear y aplicar migraciones
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver datos
npm run prisma:studio
```

### 5. Iniciar el servidor
```bash
# Desarrollo con hot-reload
npm run dev

# Producción
npm run build
npm start
```

## 📡 Endpoints de la API

### 🔐 Autenticación
- `POST /api/auth/telegram` - Autenticar vía Telegram WebApp
- `POST /api/auth/refresh` - Refrescar token JWT
- `POST /api/auth/logout` - Cerrar sesión

### 👤 Usuarios
- `GET /api/users/profile` - Obtener perfil del usuario
- `PUT /api/users/profile` - Actualizar perfil
- `POST /api/users/photos` - Subir foto de perfil
- `GET /api/users/nearby` - Obtener usuarios cercanos

### 💬 Chat
- `POST /api/chat/messages` - Enviar mensaje
- `GET /api/chat/messages` - Obtener mensajes de conversación
- `GET /api/chat/conversations` - Listar conversaciones del usuario
- `POST /api/chat/messages/read` - Marcar mensajes como leídos

### ❤️ Matches
- `POST /api/matches/swipe` - Realizar like/dislike/superlike
- `GET /api/matches/my-matches` - Obtener matches activos
- `PUT /api/matches/status` - Actualizar estado de match (bloquear/reportar)
- `GET /api/matches/swipes/recent` - Obtener swipes recientes

### 🗺️ Mapa
- `POST /api/map/location` - Actualizar ubicación
- `GET /api/map/nearby` - Buscar usuarios cercanos
- `GET /api/map/user/:userId/location` - Obtener ubicación de match
- `GET /api/map/events` - Obtener eventos LGBTIQ+ cercanos

## 🔒 Seguridad

### Autenticación Telegram
El sistema utiliza la autenticación nativa de Telegram WebApp:

```javascript
// En tu frontend Telegram WebApp
const initData = window.Telegram.WebApp.initData;

// Enviar al backend
const response = await fetch('/api/auth/telegram', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ initData })
});
```

### Validación de Datos
Todos los endpoints utilizan Zod para validación:

```typescript
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  interests: z.array(z.string()).max(10).optional(),
  preferences: z.object({
    ageRange: z.object({
      min: z.number().min(18).max(100),
      max: z.number().min(18).max(100)
    }).optional(),
    distance: z.number().min(1).max(500).optional(),
    gender: z.enum(['male', 'female', 'other', 'all']).optional()
  }).optional()
});
```

### Rate Limiting
- 100 requests por IP cada 15 minutos
- Headers `X-RateLimit-Limit` y `X-RateLimit-Remaining`

## 🏗️ Arquitectura

```
src/
├── config.ts              # Configuración y variables de entorno
├── index.ts               # Punto de entrada del servidor
├── lib/
│   ├── prisma.ts         # Cliente Prisma
│   └── firebase.ts       # Firebase Admin SDK
├── middleware/
│   ├── auth.ts           # Autenticación Telegram/JWT
│   ├── errorHandler.ts   # Manejo centralizado de errores
│   ├── validation.ts     # Middleware de validación Zod
│   └── asyncHandler.ts   # Wrapper para async/await
├── routes/
│   ├── auth.ts           # Rutas de autenticación
│   ├── users.ts          # Rutas de usuarios
│   ├── chat.ts           # Rutas de chat (Firestore)
│   ├── matches.ts        # Rutas de matches
│   └── map.ts            # Rutas de mapa/ubicación
└── types/
    └── index.ts          # Definiciones de tipos
```

## 🔍 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev                 # Iniciar con hot-reload
npm run build              # Compilar TypeScript
npm run start              # Iniciar servidor compilado

# Base de datos
npm run prisma:generate    # Generar cliente Prisma
npm run prisma:migrate     # Ejecutar migraciones
npm run prisma:studio      # Abrir Prisma Studio
npm run prisma:seed        # Ejecutar seeders

# Calidad de código
npm run lint               # Linting con ESLint
npm run type-check         # Verificar tipos TypeScript

# Testing
npm run test               # Ejecutar tests
npm run test:watch         # Tests con watch mode
```

### Debugging

En VS Code, crea `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

## 🚀 Despliegue

### Vercel

1. Instala Vercel CLI:
```bash
npm i -g vercel
```

2. Configura variables de entorno en Vercel Dashboard

3. Despliega:
```bash
vercel --prod
```

### Railway

1. Conecta tu repo de GitHub
2. Configura variables de entorno
3. Railway detectará automáticamente el proyecto Node.js

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](../LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas:

1. Verifica que todas las variables de entorno estén configuradas
2. Asegúrate de que PostgreSQL esté ejecutándose
3. Comprueba que Firebase Admin SDK esté correctamente configurado
4. Revisa los logs del servidor para errores específicos

Para más ayuda, abre un issue en el repositorio.