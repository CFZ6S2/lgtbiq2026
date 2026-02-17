import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// import cors from 'cors';
import { 
  handleProfileSubmission, 
  handleRecommendations, 
  handleMatches, 
  handleChatHistory, 
  handleSendMessage,
  handleLikeUser,
  handleBlockUser,
  handleReportUser,
  handleMapNearby,
  handleMapConsent,
  handleMapLocation,
  handlePrivacySettings,
  handleUserExport,
  handleUserDelete,
  handleMarkMessagesRead,
  handleTypingIndicator,
  handleModerationReports,
  handleModerationVerify,
  handleModerationBlock,
  handleOrientations
} from './api';

admin.initializeApp();
const db = admin.firestore();

// Enable CORS
// const corsHandler = cors({ origin: true });

// Helper to wrap functions with CORS
// const withCors = (fn: functions.HttpsFunction) => {
//   return functions.https.onRequest((req, res) => {
//     corsHandler(req, res, () => fn(req, res));
//   });
// };

// Authentication helper
// const getAuthedUser = async (initData: string): Promise<any> => {
//   if (!initData) return null;
//   
//   const validation = validateInitData(initData, process.env.BOT_TOKEN || '');
//   if (!validation.valid || !validation.user) return null;
//   
//   const userDoc = await db.collection('users').doc(String(validation.user.id)).get();
//   return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
// };

// Main API function
export const api = functions.https.onRequest(async (req, res) => {
  const path = req.path;
  const method = req.method;
  
  try {
    switch (true) {
      // Profile endpoints
      case method === 'POST' && path === '/api/sendData':
        return handleProfileSubmission(req, res, db);
        
      // Discovery/Recommendations
      case method === 'POST' && path === '/api/recs':
        return handleRecommendations(req, res, db);
        
      // Matches
      case method === 'POST' && path === '/api/matches':
        return handleMatches(req, res, db);
        
      // Chat
      case method === 'POST' && path === '/api/chat/history':
        return handleChatHistory(req, res, db);
        
      case method === 'POST' && path === '/api/chat/send':
        return handleSendMessage(req, res, db);
        
      case method === 'POST' && path === '/api/chat/mark-read':
        return handleMarkMessagesRead(req, res, db);
        
      case method === 'POST' && path === '/api/chat/typing':
        return handleTypingIndicator(req, res, db);
        
      // Likes
      case method === 'POST' && path === '/api/like':
        return handleLikeUser(req, res, db);
        
      // Blocks
      case method === 'POST' && path === '/api/block':
        return handleBlockUser(req, res, db);
        
      // Reports
      case method === 'POST' && path === '/api/report':
        return handleReportUser(req, res, db);
        
      // Map features
      case method === 'GET' && path === '/api/map/nearby':
        return handleMapNearby(req, res, db);
        
      case method === 'POST' && path === '/api/map/consent':
        return handleMapConsent(req, res, db);
        
      case method === 'POST' && path === '/api/map/location':
        return handleMapLocation(req, res, db);
        
      // Privacy
      case method === 'POST' && path === '/api/privacy/incognito':
        return handlePrivacySettings(req, res, db);
        
      // User data
      case method === 'POST' && path === '/api/me/export':
        return handleUserExport(req, res, db);
        
      case method === 'POST' && path === '/api/me/delete':
        return handleUserDelete(req, res, db);
        
      // Utilities
      case method === 'GET' && path === '/api/orientations':
        return handleOrientations(req, res, db);
        
      // Moderation (admin only)
      case method === 'GET' && path === '/api/mod/reports':
        return handleModerationReports(req, res, db);
        
      case method === 'POST' && path === '/api/mod/verify':
        return handleModerationVerify(req, res, db);
        
      case method === 'POST' && path === '/api/mod/block-user':
        return handleModerationBlock(req, res, db);
        
      default:
        res.status(404).json({ ok: false, error: 'Not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Cloud Functions for background tasks
export const createMatch = functions.firestore
  .document('likes/{likeId}')
  .onCreate(async (snap, context) => {
    const likeData = snap.data();
    const { fromId, toId } = likeData;
    
    // Check for reciprocal like
    const reciprocalLike = await db.collection('likes')
      .where('fromId', '==', toId)
      .where('toId', '==', fromId)
      .limit(1)
      .get();
    
    if (!reciprocalLike.empty) {
      // Create match
      const aId = fromId < toId ? fromId : toId;
      const bId = fromId < toId ? toId : fromId;
      
      await db.collection('matches').doc(`${aId}_${bId}`).set({
        aId,
        bId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update stats
      const today = new Date().toISOString().split('T')[0];
      await db.collection('stats').doc(today).update({
        matches: admin.firestore.FieldValue.increment(1)
      });
    }
  });

export const updateStats = functions.firestore
  .document('likes/{likeId}')
  .onCreate(async (snap, context) => {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('stats').doc(today).set({
      likes: admin.firestore.FieldValue.increment(1),
      matches: 0,
      messages: 0
    }, { merge: true });
  });

export const updateMessageStats = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('stats').doc(today).set({
      messages: admin.firestore.FieldValue.increment(1)
    }, { merge: true });
  });

// Import and export new API functions
export {
  apiLegacyV2,
  apiDiscoveryV2,
  apiModerationV2,
  apiHealthV2
} from './api/index.js';