import dotenv from 'dotenv';

dotenv.config();

const env: any = process.env as any;

export const config = {
  // Entorno
  NODE_ENV: env['NODE_ENV'] || 'development',
  PORT: parseInt(env['PORT'] || '3001'),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: env['TELEGRAM_BOT_TOKEN'] || '',
  TELEGRAM_BOT_USERNAME: env['TELEGRAM_BOT_USERNAME'] || '',
  
  // Base de datos
  DATABASE_URL: env['DATABASE_URL'] || '',
  
  // JWT
  JWT_SECRET: env['JWT_SECRET'] || 'your-secret-key-change-this',
  JWT_EXPIRES_IN: env['JWT_EXPIRES_IN'] || '7d',
  
  // Firebase
  FIREBASE_PROJECT_ID: env['FIREBASE_PROJECT_ID'] || '',
  FIREBASE_PRIVATE_KEY: (env['FIREBASE_PRIVATE_KEY'] || '').replace(/\\n/g, '\n'),
  FIREBASE_CLIENT_EMAIL: env['FIREBASE_CLIENT_EMAIL'] || '',
  
  // CORS
  CORS_ORIGIN: env['CORS_ORIGIN'] || 'http://localhost:3000',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: parseInt(env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  
  // Validación
  validate() {
    const required = [
      'TELEGRAM_BOT_TOKEN',
      'DATABASE_URL',
      'JWT_SECRET'
    ];
    
    const missing = required.filter(key => !this[key as keyof typeof config]);
    
    if (missing.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    }
    
    if (this.NODE_ENV === 'production' && this.JWT_SECRET === 'your-secret-key-change-this') {
      throw new Error('Por favor cambia el JWT_SECRET en producción');
    }
  }
};

// Validar configuración al importar
config.validate();
