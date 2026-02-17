"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiHealthV2 = exports.apiModerationV2 = exports.apiDiscoveryV2 = exports.apiLegacyV2 = exports.updateMessageStats = exports.updateStats = exports.createMatch = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// import cors from 'cors';
const api_1 = require("./api");
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
exports.api = functions.https.onRequest(async (req, res) => {
    const path = req.path;
    const method = req.method;
    try {
        switch (true) {
            // Profile endpoints
            case method === 'POST' && path === '/api/sendData':
                return (0, api_1.handleProfileSubmission)(req, res, db);
            // Discovery/Recommendations
            case method === 'POST' && path === '/api/recs':
                return (0, api_1.handleRecommendations)(req, res, db);
            // Matches
            case method === 'POST' && path === '/api/matches':
                return (0, api_1.handleMatches)(req, res, db);
            // Chat
            case method === 'POST' && path === '/api/chat/history':
                return (0, api_1.handleChatHistory)(req, res, db);
            case method === 'POST' && path === '/api/chat/send':
                return (0, api_1.handleSendMessage)(req, res, db);
            case method === 'POST' && path === '/api/chat/mark-read':
                return (0, api_1.handleMarkMessagesRead)(req, res, db);
            case method === 'POST' && path === '/api/chat/typing':
                return (0, api_1.handleTypingIndicator)(req, res, db);
            // Likes
            case method === 'POST' && path === '/api/like':
                return (0, api_1.handleLikeUser)(req, res, db);
            // Blocks
            case method === 'POST' && path === '/api/block':
                return (0, api_1.handleBlockUser)(req, res, db);
            // Reports
            case method === 'POST' && path === '/api/report':
                return (0, api_1.handleReportUser)(req, res, db);
            // Map features
            case method === 'GET' && path === '/api/map/nearby':
                return (0, api_1.handleMapNearby)(req, res, db);
            case method === 'POST' && path === '/api/map/consent':
                return (0, api_1.handleMapConsent)(req, res, db);
            case method === 'POST' && path === '/api/map/location':
                return (0, api_1.handleMapLocation)(req, res, db);
            // Privacy
            case method === 'POST' && path === '/api/privacy/incognito':
                return (0, api_1.handlePrivacySettings)(req, res, db);
            // User data
            case method === 'POST' && path === '/api/me/export':
                return (0, api_1.handleUserExport)(req, res, db);
            case method === 'POST' && path === '/api/me/delete':
                return (0, api_1.handleUserDelete)(req, res, db);
            // Utilities
            case method === 'GET' && path === '/api/orientations':
                return (0, api_1.handleOrientations)(req, res, db);
            // Moderation (admin only)
            case method === 'GET' && path === '/api/mod/reports':
                return (0, api_1.handleModerationReports)(req, res, db);
            case method === 'POST' && path === '/api/mod/verify':
                return (0, api_1.handleModerationVerify)(req, res, db);
            case method === 'POST' && path === '/api/mod/block-user':
                return (0, api_1.handleModerationBlock)(req, res, db);
            default:
                res.status(404).json({ ok: false, error: 'Not found' });
        }
    }
    catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
});
// Cloud Functions for background tasks
exports.createMatch = functions.firestore
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
exports.updateStats = functions.firestore
    .document('likes/{likeId}')
    .onCreate(async (snap, context) => {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('stats').doc(today).set({
        likes: admin.firestore.FieldValue.increment(1),
        matches: 0,
        messages: 0
    }, { merge: true });
});
exports.updateMessageStats = functions.firestore
    .document('messages/{messageId}')
    .onCreate(async (snap, context) => {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('stats').doc(today).set({
        messages: admin.firestore.FieldValue.increment(1)
    }, { merge: true });
});
// Import and export new API functions
var index_js_1 = require("./api/index.js");
Object.defineProperty(exports, "apiLegacyV2", { enumerable: true, get: function () { return index_js_1.apiLegacyV2; } });
Object.defineProperty(exports, "apiDiscoveryV2", { enumerable: true, get: function () { return index_js_1.apiDiscoveryV2; } });
Object.defineProperty(exports, "apiModerationV2", { enumerable: true, get: function () { return index_js_1.apiModerationV2; } });
Object.defineProperty(exports, "apiHealthV2", { enumerable: true, get: function () { return index_js_1.apiHealthV2; } });
//# sourceMappingURL=index.js.map