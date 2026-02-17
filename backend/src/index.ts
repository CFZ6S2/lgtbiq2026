import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { validateTelegramAuth } from './middleware/auth';

// Importar rutas
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { chatRoutes } from './routes/chat';
import { matchRoutes } from './routes/matches';
import { mapRoutes } from './routes/map';

const app = express();

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.telegram.org"]
    }
  }
}));

// CORS
app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://your-app.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compresión
app.use(compression());

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV 
  });
});

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación de Telegram)
app.use('/api/users', validateTelegramAuth, userRoutes);
app.use('/api/chat', validateTelegramAuth, chatRoutes);
app.use('/api/matches', validateTelegramAuth, matchRoutes);
app.use('/api/map', validateTelegramAuth, mapRoutes);

// Ruta de prueba
app.get('/api/test', validateTelegramAuth, (req: any, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    user: req.user 
  });
});

// Manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

const PORT = config.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌍 Ambiente: ${config.NODE_ENV}`);
  console.log(`🔐 Autenticación Telegram: ${config.TELEGRAM_BOT_TOKEN ? 'Configurada' : 'No configurada'}`);
});

export default app;
