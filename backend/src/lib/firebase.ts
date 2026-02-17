import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { config } from '../config';

// Configuración de Firebase Admin
const serviceAccount: ServiceAccount = {
  projectId: config.FIREBASE_PROJECT_ID,
  privateKey: config.FIREBASE_PRIVATE_KEY,
  clientEmail: config.FIREBASE_CLIENT_EMAIL,
};

// Inicializar Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: config.FIREBASE_PROJECT_ID,
});

// Exportar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configurar emulador en desarrollo
if (config.NODE_ENV === 'development') {
  (process.env as any)['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
  (process.env as any)['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';
}

export default app;
