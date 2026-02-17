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
exports.handleSendMessage = exports.handleChatHistory = exports.handleMatches = exports.handleProfileSubmission = void 0;
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
// Legacy validation schemas
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
// Helper functions
const sendJSON = (res, status, data) => {
    res.status(status).json(data);
};
// Legacy API Handlers
const handleProfileSubmission = async (req, res, db) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
            role: 'USER',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await profileRef.set(profileData);
        // Create privacy settings
        const privacyRef = db.collection('privacySettings').doc(userId);
        const privacyData = {
            userId,
            incognito: ((_j = profile.privacy) === null || _j === void 0 ? void 0 : _j.incognito) || false,
            hideDistance: ((_k = profile.privacy) === null || _k === void 0 ? void 0 : _k.hideDistance) || false,
            profileVisible: ((_l = profile.privacy) === null || _l === void 0 ? void 0 : _l.profileVisible) !== false,
            mapConsent: false,
            mapConsentAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
                batch.set(ref, {
                    orientationId: orientationId,
                    addedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }
        // Create discovery settings with defaults
        const discoveryRef = db.collection('discoverySettings').doc(userId);
        const discoveryData = {
            userId,
            minAge: 18,
            maxAge: 99,
            maxDistance: 50,
            interestedInGender: [],
            interestedInRoles: [],
            lookingForFriends: true,
            lookingForRomance: true,
            lookingForPoly: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await discoveryRef.set(discoveryData);
        sendJSON(res, 200, {
            ok: true,
            userId,
            message: 'Profile created successfully'
        });
    }
    catch (error) {
        console.error('Profile submission error:', error);
        sendJSON(res, 500, { ok: false, error: 'Internal server error' });
    }
};
exports.handleProfileSubmission = handleProfileSubmission;
const handleMatches = async (req, res, db) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return sendJSON(res, 400, { ok: false, error: 'User ID required' });
        }
        // Get user's matches
        const matchesSnapshot = await db.collection('matches')
            .where('status', '==', 'ACTIVE')
            .get();
        const matches = [];
        for (const doc of matchesSnapshot.docs) {
            const data = doc.data();
            const matchUserId = data.aId === userId ? data.bId : data.aId;
            if (data.aId === userId || data.bId === userId) {
                const userDoc = await db.collection('users').doc(matchUserId).get();
                const userData = userDoc.data();
                if (userData) {
                    matches.push({
                        id: matchUserId,
                        displayName: userData.displayName,
                        username: userData.username,
                        createdAt: data.createdAt
                    });
                }
            }
        }
        sendJSON(res, 200, { ok: true, matches });
    }
    catch (error) {
        console.error('Matches error:', error);
        sendJSON(res, 500, { ok: false, error: 'Internal server error' });
    }
};
exports.handleMatches = handleMatches;
const handleChatHistory = async (req, res, db) => {
    try {
        const { userId, peerUserId } = req.body;
        if (!userId || !peerUserId) {
            return sendJSON(res, 400, { ok: false, error: 'User ID and peer user ID required' });
        }
        // Get chat history between two users
        const messagesSnapshot = await db.collection('messages')
            .where('senderId', 'in', [userId, peerUserId])
            .where('recipientId', 'in', [userId, peerUserId])
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                senderId: data.senderId,
                recipientId: data.recipientId,
                content: data.content,
                read: data.read,
                createdAt: data.createdAt
            };
        });
        sendJSON(res, 200, { ok: true, messages });
    }
    catch (error) {
        console.error('Chat history error:', error);
        sendJSON(res, 500, { ok: false, error: 'Internal server error' });
    }
};
exports.handleChatHistory = handleChatHistory;
const handleSendMessage = async (req, res, db) => {
    try {
        const { userId, toUserId, content } = req.body;
        if (!userId || !toUserId || !content) {
            return sendJSON(res, 400, { ok: false, error: 'User ID, recipient ID, and content required' });
        }
        if (content.length > 1000) {
            return sendJSON(res, 400, { ok: false, error: 'Message too long' });
        }
        // Check if users have an active match
        const matchSnapshot = await db.collection('matches')
            .where('status', '==', 'ACTIVE')
            .get();
        let hasMatch = false;
        for (const doc of matchSnapshot.docs) {
            const data = doc.data();
            if ((data.aId === userId && data.bId === toUserId) ||
                (data.aId === toUserId && data.bId === userId)) {
                hasMatch = true;
                break;
            }
        }
        if (!hasMatch) {
            return sendJSON(res, 403, { ok: false, error: 'No active match with this user' });
        }
        // Create message
        const messageRef = db.collection('messages').doc();
        const messageData = {
            senderId: userId,
            recipientId: toUserId,
            content: content.trim(),
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await messageRef.set(messageData);
        sendJSON(res, 200, {
            ok: true,
            messageId: messageRef.id,
            message: 'Message sent successfully'
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        sendJSON(res, 500, { ok: false, error: 'Internal server error' });
    }
};
exports.handleSendMessage = handleSendMessage;
//# sourceMappingURL=legacy.js.map