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
exports.handleStats = exports.handleOrientations = exports.handleModerationBlock = exports.handleModerationVerify = exports.handleModerationReports = exports.handleTypingIndicator = exports.handleMarkMessagesRead = exports.handleUserDelete = exports.handleUserExport = exports.handlePrivacySettings = exports.handleMapLocation = exports.handleMapConsent = exports.handleMapNearby = exports.handleReportUser = exports.handleBlockUser = exports.handleLikeUser = exports.handleSendMessage = exports.handleChatHistory = exports.handleMatches = exports.handleRecommendations = exports.handleProfileSubmission = void 0;
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const geofire = __importStar(require("geofire-common"));
// const db = admin.firestore();
// Validation schemas
const ZSendDataBody = zod_1.z.object({
    initData: zod_1.z.string().optional(),
    profile: zod_1.z.object({
        username: zod_1.z.string().optional(),
        displayName: zod_1.z.string(),
        pronouns: zod_1.z.string().optional(),
        gender: zod_1.z.string().optional(),
        genderCustom: zod_1.z.string().optional(),
        orientations: zod_1.z.array(zod_1.z.string()).optional(),
        intents: zod_1.z.object({
            lookingFriends: zod_1.z.boolean().optional(),
            lookingRomance: zod_1.z.boolean().optional(),
            lookingPoly: zod_1.z.boolean().optional(),
            transInclusive: zod_1.z.boolean().optional()
        }).optional(),
        location: zod_1.z.object({
            city: zod_1.z.string().optional(),
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional()
        }).optional(),
        privacy: zod_1.z.object({
            incognito: zod_1.z.boolean().optional(),
            hideDistance: zod_1.z.boolean().optional(),
            profileVisible: zod_1.z.boolean().optional()
        }).optional(),
        meta: zod_1.z.object({
            language: zod_1.z.string().optional()
        }).optional()
    })
});
// const ZRecsBody = z.object({
//   initData: z.string(),
//   filterOrientations: z.array(z.string()).optional(),
//   intentsFriends: z.boolean().optional(),
//   intentsRomance: z.boolean().optional(),
//   intentsPoly: z.boolean().optional(),
//   onlyVerified: z.boolean().optional(),
//   city: z.string().optional(),
//   maxDistanceKm: z.number().optional()
// });
// Helper functions
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const sendJSON = (res, status, data) => {
    res.status(status).json(data);
};
// API Handlers
const handleProfileSubmission = async (req, res, db) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    try {
        const body = ZSendDataBody.parse(req.body);
        const { initData, profile } = body;
        // Validate initData if provided
        let telegramId = null;
        if (initData) {
            // Validate Telegram initData (implementation needed)
            telegramId = 'validated_telegram_id'; // Placeholder
        }
        // Create or update user
        const userRef = db.collection('users').doc();
        const userData = {
            telegramId,
            username: profile.username || null,
            email: null,
            emailVerified: false,
            displayName: profile.displayName,
            language: ((_a = profile.meta) === null || _a === void 0 ? void 0 : _a.language) || 'es',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await userRef.set(userData);
        const userId = userRef.id;
        // Create profile
        const profileRef = db.collection('profiles').doc(userId);
        const profileData = {
            userId,
            pronouns: profile.pronouns || null,
            gender: profile.gender || null,
            genderCustom: profile.genderCustom || null,
            intentsFriends: ((_b = profile.intents) === null || _b === void 0 ? void 0 : _b.lookingFriends) || false,
            intentsRomance: ((_c = profile.intents) === null || _c === void 0 ? void 0 : _c.lookingRomance) || false,
            intentsPoly: ((_d = profile.intents) === null || _d === void 0 ? void 0 : _d.lookingPoly) || false,
            transInclusive: ((_e = profile.intents) === null || _e === void 0 ? void 0 : _e.transInclusive) !== false,
            city: ((_f = profile.location) === null || _f === void 0 ? void 0 : _f.city) || null,
            latitude: ((_g = profile.location) === null || _g === void 0 ? void 0 : _g.latitude) || null,
            longitude: ((_h = profile.location) === null || _h === void 0 ? void 0 : _h.longitude) || null,
            geoHash: ((_j = profile.location) === null || _j === void 0 ? void 0 : _j.latitude) && ((_k = profile.location) === null || _k === void 0 ? void 0 : _k.longitude) ?
                geofire.geohashForLocation([profile.location.latitude, profile.location.longitude]) : null,
            locationUpdatedAt: ((_l = profile.location) === null || _l === void 0 ? void 0 : _l.latitude) && ((_m = profile.location) === null || _m === void 0 ? void 0 : _m.longitude) ?
                admin.firestore.FieldValue.serverTimestamp() : null
        };
        await profileRef.set(profileData);
        // Create privacy settings
        const privacyRef = db.collection('privacySettings').doc(userId);
        const privacyData = {
            userId,
            incognito: ((_o = profile.privacy) === null || _o === void 0 ? void 0 : _o.incognito) || false,
            hideDistance: ((_p = profile.privacy) === null || _p === void 0 ? void 0 : _p.hideDistance) || false,
            profileVisible: ((_q = profile.privacy) === null || _q === void 0 ? void 0 : _q.profileVisible) !== false,
            mapConsent: false,
            mapConsentAt: null
        };
        await privacyRef.set(privacyData);
        // Handle orientations
        if (profile.orientations && profile.orientations.length > 0) {
            const orientationDocs = await Promise.all(profile.orientations.map(name => db.collection('orientations').where('name', '==', name).limit(1).get()));
            const orientationIds = orientationDocs.map(doc => doc.empty ? null : doc.docs[0].id).filter(Boolean);
            // Add orientations to profile subcollection
            const batch = db.batch();
            orientationIds.forEach(orientationId => {
                const ref = profileRef.collection('orientations').doc(orientationId);
                batch.set(ref, { orientationId: orientationId, addedAt: admin.firestore.FieldValue.serverTimestamp() });
            });
            await batch.commit();
        }
        sendJSON(res, 200, { ok: true, userId });
    }
    catch (error) {
        console.error('Profile submission error:', error);
        sendJSON(res, 500, { ok: false, error: 'Internal server error' });
    }
};
exports.handleProfileSubmission = handleProfileSubmission;
const handleRecommendations = async (req, res, db) => {
    try {
        // const body = ZRecsBody.parse(req.body);
        // const { initData } = body;
        // Validate user (simplified - implement proper validation)
        const userId = 'validated_user_id'; // Placeholder
        // Get user's own profile
        const userProfile = await db.collection('profiles').doc(userId).get();
        if (!userProfile.exists) {
            return sendJSON(res, 404, { ok: false, error: 'Profile not found' });
        }
        // const userData = userProfile.data();
        // Get blocked users
        const blocks = await db.collection('blocks')
            .where('blockerId', '==', userId)
            .get();
        const blockedIds = blocks.docs.map(doc => doc.data().blockedId);
        // Get users who blocked current user
        const blockedBy = await db.collection('blocks')
            .where('blockedId', '==', userId)
            .get();
        const blockedByIds = blockedBy.docs.map(doc => doc.data().blockerId);
        const excludedIds = [...blockedIds, ...blockedByIds, userId];
        // Build query for candidates
        let query = db.collection('profiles')
            .where('userId', 'not-in', excludedIds)
            .limit(50);
        // Apply filters
        const candidates = await query.get();
        // Filter and process candidates
        const recs = [];
        for (const doc of candidates.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            const userData = userDoc.data();
            // Check privacy settings
            const privacyDoc = await db.collection('privacySettings').doc(data.userId).get();
            const privacy = privacyDoc.data();
            if ((privacy === null || privacy === void 0 ? void 0 : privacy.incognito) || !(privacy === null || privacy === void 0 ? void 0 : privacy.profileVisible))
                continue;
            // Calculate distance if location available
            let distanceKm = null;
            if ((userData === null || userData === void 0 ? void 0 : userData.latitude) && (userData === null || userData === void 0 ? void 0 : userData.longitude) && data.latitude && data.longitude) {
                distanceKm = Math.round(haversineKm(userData.latitude, userData.longitude, data.latitude, data.longitude));
            }
            recs.push({
                id: data.userId,
                displayName: (userData === null || userData === void 0 ? void 0 : userData.displayName) || 'Usuario',
                username: userData === null || userData === void 0 ? void 0 : userData.username,
                pronouns: data.pronouns,
                gender: data.gender,
                orientations: [],
                telegramId: userData === null || userData === void 0 ? void 0 : userData.telegramId,
                city: data.city,
                distanceKm: (privacy === null || privacy === void 0 ? void 0 : privacy.hideDistance) ? null : distanceKm
            });
        }
        sendJSON(res, 200, { ok: true, recs: recs.slice(0, 20) });
    }
    catch (error) {
        console.error('Recommendations error:', error);
        sendJSON(res, 500, { ok: false, error: 'Internal server error' });
    }
};
exports.handleRecommendations = handleRecommendations;
const handleMatches = async (req, res, db) => {
    // Implementation for matches endpoint
    sendJSON(res, 200, { ok: true, matches: [] });
};
exports.handleMatches = handleMatches;
const handleChatHistory = async (req, res, db) => {
    // Implementation for chat history
    sendJSON(res, 200, { ok: true, messages: [] });
};
exports.handleChatHistory = handleChatHistory;
const handleSendMessage = async (req, res, db) => {
    // Implementation for sending messages
    sendJSON(res, 200, { ok: true, id: 'message_id' });
};
exports.handleSendMessage = handleSendMessage;
const handleLikeUser = async (req, res, db) => {
    // Implementation for liking users
    sendJSON(res, 200, { ok: true, matched: false });
};
exports.handleLikeUser = handleLikeUser;
const handleBlockUser = async (req, res, db) => {
    // Implementation for blocking users
    sendJSON(res, 200, { ok: true });
};
exports.handleBlockUser = handleBlockUser;
const handleReportUser = async (req, res, db) => {
    // Implementation for reporting users
    sendJSON(res, 200, { ok: true });
};
exports.handleReportUser = handleReportUser;
const handleMapNearby = async (req, res, db) => {
    // Implementation for nearby users map
    sendJSON(res, 200, { ok: true, locations: [] });
};
exports.handleMapNearby = handleMapNearby;
const handleMapConsent = async (req, res, db) => {
    // Implementation for map consent
    sendJSON(res, 200, { ok: true });
};
exports.handleMapConsent = handleMapConsent;
const handleMapLocation = async (req, res, db) => {
    // Implementation for updating location
    sendJSON(res, 200, { ok: true });
};
exports.handleMapLocation = handleMapLocation;
const handlePrivacySettings = async (req, res, db) => {
    // Implementation for privacy settings
    sendJSON(res, 200, { ok: true });
};
exports.handlePrivacySettings = handlePrivacySettings;
const handleUserExport = async (req, res, db) => {
    // Implementation for data export
    sendJSON(res, 200, { ok: true, format: 'json', data: {} });
};
exports.handleUserExport = handleUserExport;
const handleUserDelete = async (req, res, db) => {
    // Implementation for account deletion
    sendJSON(res, 200, { ok: true });
};
exports.handleUserDelete = handleUserDelete;
const handleMarkMessagesRead = async (req, res, db) => {
    // Implementation for marking messages as read
    sendJSON(res, 200, { ok: true, updated: [] });
};
exports.handleMarkMessagesRead = handleMarkMessagesRead;
const handleTypingIndicator = async (req, res, db) => {
    // Implementation for typing indicators
    sendJSON(res, 200, { ok: true });
};
exports.handleTypingIndicator = handleTypingIndicator;
const handleModerationReports = async (req, res, db) => {
    // Implementation for moderation reports
    sendJSON(res, 200, { ok: true, reports: [] });
};
exports.handleModerationReports = handleModerationReports;
const handleModerationVerify = async (req, res, db) => {
    // Implementation for user verification
    sendJSON(res, 200, { ok: true });
};
exports.handleModerationVerify = handleModerationVerify;
const handleModerationBlock = async (req, res, db) => {
    // Implementation for moderation blocking
    sendJSON(res, 200, { ok: true });
};
exports.handleModerationBlock = handleModerationBlock;
const handleOrientations = async (req, res, db) => {
    try {
        const orientations = await db.collection('orientations')
            .orderBy('name')
            .get();
        const list = orientations.docs.map(doc => doc.data().name);
        sendJSON(res, 200, { ok: true, orientations: list });
    }
    catch (error) {
        console.error('Orientations error:', error);
        sendJSON(res, 500, { ok: false, error: 'Internal server error' });
    }
};
exports.handleOrientations = handleOrientations;
const handleStats = async (req, res, db) => {
    // Implementation for stats
    sendJSON(res, 200, { ok: true, stats: {} });
};
exports.handleStats = handleStats;
//# sourceMappingURL=api.js.map