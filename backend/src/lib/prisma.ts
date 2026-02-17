import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Declarar global para evitar múltiples instancias en desarrollo
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: config.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (config.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Manejo de desconexión
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;