import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// Usar la instancia de Firebase Admin ya inicializada
// Si no está inicializada, inicializarla
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = getFirestore();