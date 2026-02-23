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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramBot = exports.apiUsersV2 = exports.apiHealthV2 = exports.apiModerationV2 = exports.apiDiscoveryV2 = exports.apiLegacyV2 = exports.updateMessageStats = exports.updateStats = exports.createMatch = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const api_1 = require("./api");
const bot_1 = require("./bot");
Object.defineProperty(exports, "telegramBot", { enumerable: true, get: function () { return bot_1.telegramBot; } });
// admin.initializeApp() is already called in bot.ts if needed, but we should ensure it's only called once
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// Enable CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Main API function
exports.api = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        const rawPath = req.path || '/';
        const path = rawPath.replace(/^\/api(\/|$)/i, '/');
        const method = req.method;
        try {
            switch (true) {
                // Profile endpoints
                case method === 'POST' && path === '/sendData':
                    return (0, api_1.handleProfileSubmission)(req, res, db);
                // Discovery/Recommendations
                case method === 'POST' && path === '/recs':
                    return (0, api_1.handleRecommendations)(req, res, db);
                // Matches
                case method === 'POST' && path === '/matches':
                    return (0, api_1.handleMatches)(req, res, db);
                // Chat
                case method === 'POST' && path === '/chat/history':
                    return (0, api_1.handleChatHistory)(req, res, db);
                case method === 'POST' && path === '/chat/send':
                    return (0, api_1.handleSendMessage)(req, res, db);
                case method === 'POST' && path === '/chat/mark-read':
                    return (0, api_1.handleMarkMessagesRead)(req, res, db);
                case method === 'POST' && path === '/chat/typing':
                    return (0, api_1.handleTypingIndicator)(req, res, db);
                // Likes
                case method === 'POST' && path === '/like':
                    return (0, api_1.handleLikeUser)(req, res, db);
                // Blocks
                case method === 'POST' && path === '/block':
                    return (0, api_1.handleBlockUser)(req, res, db);
                // Reports
                case method === 'POST' && path === '/report':
                    return (0, api_1.handleReportUser)(req, res, db);
                // Map features
                case method === 'GET' && path === '/map/nearby':
                    return (0, api_1.handleMapNearby)(req, res, db);
                case method === 'POST' && path === '/map/consent':
                    return (0, api_1.handleMapConsent)(req, res, db);
                case method === 'POST' && path === '/map/location':
                    return (0, api_1.handleMapLocation)(req, res, db);
                // Privacy
                case method === 'POST' && path === '/privacy/incognito':
                    return (0, api_1.handlePrivacySettings)(req, res, db);
                // User data
                case method === 'POST' && path === '/me/export':
                    return (0, api_1.handleUserExport)(req, res, db);
                case method === 'POST' && path === '/me/delete':
                    return (0, api_1.handleUserDelete)(req, res, db);
                // Utilities
                case method === 'GET' && path === '/orientations':
                    return (0, api_1.handleOrientations)(req, res, db);
                // Auth
                case method === 'POST' && path === '/auth/telegram':
                    return (0, api_1.handleTelegramAuth)(req, res, db);
                case method === 'GET' && path === '/mod/reports':
                    return (0, api_1.handleModerationReports)(req, res, db);
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
        return Promise.resolve();
    });
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
Object.defineProperty(exports, "apiUsersV2", { enumerable: true, get: function () { return index_js_1.apiUsersV2; } });
//# sourceMappingURL=index.js.map