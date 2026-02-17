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
exports.handleCreateUserReport = exports.handleGetUserProfile = exports.handleUpdateDiscoverySettings = exports.handleGetDiscoverySettings = exports.moderationHandlers = exports.handleDiscoveryStats = exports.handleDiscoveryAction = exports.handleDiscoverySettings = exports.handleRecommendations = exports.apiUsersV2 = exports.apiHealthV2 = exports.apiModerationV2 = exports.apiDiscoveryV2 = exports.apiLegacyV2 = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const recommendations_js_1 = require("./recommendations.js");
Object.defineProperty(exports, "handleRecommendations", { enumerable: true, get: function () { return recommendations_js_1.handleRecommendations; } });
Object.defineProperty(exports, "handleDiscoverySettings", { enumerable: true, get: function () { return recommendations_js_1.handleDiscoverySettings; } });
Object.defineProperty(exports, "handleDiscoveryAction", { enumerable: true, get: function () { return recommendations_js_1.handleDiscoveryAction; } });
Object.defineProperty(exports, "handleDiscoveryStats", { enumerable: true, get: function () { return recommendations_js_1.handleDiscoveryStats; } });
const moderation_js_1 = require("./moderation.js");
Object.defineProperty(exports, "moderationHandlers", { enumerable: true, get: function () { return moderation_js_1.moderationHandlers; } });
const legacy_js_1 = require("./legacy.js");
const users_js_1 = require("./users.js");
Object.defineProperty(exports, "handleGetDiscoverySettings", { enumerable: true, get: function () { return users_js_1.handleGetDiscoverySettings; } });
Object.defineProperty(exports, "handleUpdateDiscoverySettings", { enumerable: true, get: function () { return users_js_1.handleUpdateDiscoverySettings; } });
Object.defineProperty(exports, "handleGetUserProfile", { enumerable: true, get: function () { return users_js_1.handleGetUserProfile; } });
Object.defineProperty(exports, "handleCreateUserReport", { enumerable: true, get: function () { return users_js_1.handleCreateUserReport; } });
// Initialize Firebase Admin
const db = admin.firestore();
// CORS handler
const corsHandler = (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
};
// Error handler
const errorHandler = (error, req, res) => {
    console.error('API Error:', error);
    res.status(500).json({
        ok: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};
// Legacy endpoints (existing functionality)
exports.apiLegacyV2 = functions
    .region('us-central1')
    .https
    .onRequest((req, res) => {
    corsHandler(req, res, () => {
        try {
            const path = req.path;
            switch (path) {
                case '/api/sendData':
                    (0, legacy_js_1.handleProfileSubmission)(req, res, db);
                    break;
                case '/api/matches':
                    (0, legacy_js_1.handleMatches)(req, res, db);
                    break;
                case '/api/chatHistory':
                    (0, legacy_js_1.handleChatHistory)(req, res, db);
                    break;
                case '/api/sendMessage':
                    (0, legacy_js_1.handleSendMessage)(req, res, db);
                    break;
                default:
                    res.status(404).json({ ok: false, error: 'Endpoint not found' });
            }
        }
        catch (error) {
            errorHandler(error, req, res);
        }
    });
});
// Discovery and Recommendations API
exports.apiDiscoveryV2 = functions
    .region('us-central1')
    .https
    .onRequest((req, res) => {
    corsHandler(req, res, () => {
        try {
            const path = req.path;
            switch (path) {
                case '/api/recommendations':
                    (0, recommendations_js_1.handleRecommendations)(req, res);
                    break;
                case '/api/discovery/settings':
                    (0, recommendations_js_1.handleDiscoverySettings)(req, res);
                    break;
                case '/api/discovery/action':
                    (0, recommendations_js_1.handleDiscoveryAction)(req, res);
                    break;
                case '/api/discovery/stats':
                    (0, recommendations_js_1.handleDiscoveryStats)(req, res);
                    break;
                default:
                    res.status(404).json({ ok: false, error: 'Endpoint not found' });
            }
        }
        catch (error) {
            errorHandler(error, req, res);
        }
    });
});
// Moderation API
exports.apiModerationV2 = functions
    .region('us-central1')
    .https
    .onRequest((req, res) => {
    corsHandler(req, res, () => {
        try {
            const path = req.path;
            switch (path) {
                case '/api/moderation/action':
                    moderation_js_1.moderationHandlers.createAction(req, res, () => { });
                    break;
                case '/api/moderation/reverse':
                    moderation_js_1.moderationHandlers.reverseAction(req, res, () => { });
                    break;
                case '/api/moderation/reports/pending':
                    moderation_js_1.moderationHandlers.getPendingReports(req, res, () => { });
                    break;
                case '/api/moderation/reports/resolve':
                    moderation_js_1.moderationHandlers.resolveReport(req, res, () => { });
                    break;
                case '/api/moderation/reports/create':
                    moderation_js_1.moderationHandlers.createReport(req, res);
                    break;
                case '/api/moderation/stats':
                    moderation_js_1.moderationHandlers.getStats(req, res, () => { });
                    break;
                case '/api/moderation/audit/:userId':
                    moderation_js_1.moderationHandlers.getUserAuditLog(req, res, () => { });
                    break;
                default:
                    res.status(404).json({ ok: false, error: 'Endpoint not found' });
            }
        }
        catch (error) {
            errorHandler(error, req, res);
        }
    });
});
// Health check endpoint
exports.apiHealthV2 = functions
    .region('us-central1')
    .https
    .onRequest((req, res) => {
    corsHandler(req, res, () => {
        res.json({
            ok: true,
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            features: {
                recommendations: true,
                moderation: true,
                discovery: true,
                legacy: true,
                users: true
            }
        });
    });
});
// Users API - Preferencias y configuración de usuario
exports.apiUsersV2 = functions
    .region('us-central1')
    .https
    .onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const path = req.path;
            const method = req.method;
            switch (path) {
                // Configuración de descubrimiento
                case '/api/users/discovery':
                    if (method === 'GET') {
                        await (0, users_js_1.handleGetDiscoverySettings)(req, res);
                    }
                    else if (method === 'PUT') {
                        await (0, users_js_1.handleUpdateDiscoverySettings)(req, res);
                    }
                    return;
                // Perfil de usuario
                case '/api/users/profile':
                    if (method === 'GET') {
                        await (0, users_js_1.handleGetUserProfile)(req, res);
                    }
                    return;
                // Reportar usuario
                case '/api/users/report':
                    if (method === 'POST') {
                        await (0, users_js_1.handleCreateUserReport)(req, res);
                    }
                    return;
                default:
                    res.status(404).json({ ok: false, error: 'Endpoint not found' });
            }
        }
        catch (error) {
            console.error('Users API Error:', error);
            res.status(500).json({ ok: false, error: 'Internal server error' });
        }
    });
});
//# sourceMappingURL=index.js.map