import 'dotenv/config'

// Firebase configuration - optional for demo mode
let db = null
let app = null

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const { initializeApp, cert } = await import('firebase-admin/app')
    const { getFirestore } = await import('firebase-admin/firestore')
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    
    app = initializeApp({
      credential: cert(serviceAccount)
    })
    
    db = getFirestore(app)
  }
} catch (error) {
  console.warn('Firebase not configured:', error.message)
}

// Mock database for demo mode
const mockDb = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({ exists: false }),
      set: async (data) => ({ }),
      update: async (data) => ({ }),
      delete: async () => ({ })
    }),
    get: async () => ({ docs: [] }),
    add: async (data) => ({ id: 'mock-id' })
  })
}

const finalDb = db || mockDb
export { app, finalDb as db }