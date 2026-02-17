import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import * as geofire from 'geofire-common';

// const db = admin.firestore();

// Validation schemas
const ZSendDataBody = z.object({
  initData: z.string().optional(),
  profile: z.object({
    username: z.string().optional(),
    displayName: z.string(),
    pronouns: z.string().optional(),
    gender: z.string().optional(),
    genderCustom: z.string().optional(),
    orientations: z.array(z.string()).optional(),
    intents: z.object({
      lookingFriends: z.boolean().optional(),
      lookingRomance: z.boolean().optional(),
      lookingPoly: z.boolean().optional(),
      transInclusive: z.boolean().optional()
    }).optional(),
    location: z.object({
      city: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional()
    }).optional(),
    privacy: z.object({
      incognito: z.boolean().optional(),
      hideDistance: z.boolean().optional(),
      profileVisible: z.boolean().optional()
    }).optional(),
    meta: z.object({
      language: z.string().optional()
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
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const sendJSON = (res: functions.Response, status: number, data: any) => {
  res.status(status).json(data);
};

// API Handlers
export const handleProfileSubmission = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  try {
    const body = ZSendDataBody.parse(req.body);
    const { initData, profile } = body;
    
    // Validate initData if provided
    let telegramId: string | null = null;
    if (initData) {
      // Validate Telegram initData (implementation needed)
      telegramId = 'validated_telegram_id'; // Placeholder
    }
    
    // Create or update user
    const userRef = db.collection('users').doc();
    const userData = {
      telegramId,
      username: profile.username || null,
      email: null, // Will be added when email auth is implemented
      emailVerified: false,
      displayName: profile.displayName,
      language: profile.meta?.language || 'es',
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
      intentsFriends: profile.intents?.lookingFriends || false,
      intentsRomance: profile.intents?.lookingRomance || false,
      intentsPoly: profile.intents?.lookingPoly || false,
      transInclusive: profile.intents?.transInclusive !== false,
      city: profile.location?.city || null,
      latitude: profile.location?.latitude || null,
      longitude: profile.location?.longitude || null,
      geoHash: profile.location?.latitude && profile.location?.longitude ? 
        geofire.geohashForLocation([profile.location.latitude, profile.location.longitude]) : null,
      locationUpdatedAt: profile.location?.latitude && profile.location?.longitude ? 
        admin.firestore.FieldValue.serverTimestamp() : null
    };
    
    await profileRef.set(profileData);
    
    // Create privacy settings
    const privacyRef = db.collection('privacySettings').doc(userId);
    const privacyData = {
      userId,
      incognito: profile.privacy?.incognito || false,
      hideDistance: profile.privacy?.hideDistance || false,
      profileVisible: profile.privacy?.profileVisible !== false,
      mapConsent: false,
      mapConsentAt: null
    };
    
    await privacyRef.set(privacyData);
    
    // Handle orientations
    if (profile.orientations && profile.orientations.length > 0) {
      const orientationDocs = await Promise.all(
        profile.orientations.map(name => 
          db.collection('orientations').where('name', '==', name).limit(1).get()
        )
      );
      
      const orientationIds = orientationDocs.map(doc => 
        doc.empty ? null : doc.docs[0].id
      ).filter(Boolean);
      
      // Add orientations to profile subcollection
      const batch = db.batch();
      orientationIds.forEach(orientationId => {
        const ref = profileRef.collection('orientations').doc(orientationId!);
        batch.set(ref, { orientationId: orientationId!, addedAt: admin.firestore.FieldValue.serverTimestamp() });
      });
      await batch.commit();
    }
    
    sendJSON(res, 200, { ok: true, userId });
  } catch (error) {
    console.error('Profile submission error:', error);
    sendJSON(res, 500, { ok: false, error: 'Internal server error' });
  }
};

export const handleRecommendations = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
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
      
      if (privacy?.incognito || !privacy?.profileVisible) continue;
      
      // Calculate distance if location available
      let distanceKm = null;
      if (userData?.latitude && userData?.longitude && data.latitude && data.longitude) {
        distanceKm = Math.round(haversineKm(
          userData.latitude, userData.longitude,
          data.latitude, data.longitude
        ));
      }
      
      recs.push({
        id: data.userId,
        displayName: userData?.displayName || 'Usuario',
        username: userData?.username,
        pronouns: data.pronouns,
        gender: data.gender,
        orientations: [], // Will be populated from subcollection
        telegramId: userData?.telegramId,
        city: data.city,
        distanceKm: privacy?.hideDistance ? null : distanceKm
      });
    }
    
    sendJSON(res, 200, { ok: true, recs: recs.slice(0, 20) });
  } catch (error) {
    console.error('Recommendations error:', error);
    sendJSON(res, 500, { ok: false, error: 'Internal server error' });
  }
};

export const handleMatches = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for matches endpoint
  sendJSON(res, 200, { ok: true, matches: [] });
};

export const handleChatHistory = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for chat history
  sendJSON(res, 200, { ok: true, messages: [] });
};

export const handleSendMessage = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for sending messages
  sendJSON(res, 200, { ok: true, id: 'message_id' });
};

export const handleLikeUser = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for liking users
  sendJSON(res, 200, { ok: true, matched: false });
};

export const handleBlockUser = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for blocking users
  sendJSON(res, 200, { ok: true });
};

export const handleReportUser = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for reporting users
  sendJSON(res, 200, { ok: true });
};

export const handleMapNearby = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for nearby users map
  sendJSON(res, 200, { ok: true, locations: [] });
};

export const handleMapConsent = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for map consent
  sendJSON(res, 200, { ok: true });
};

export const handleMapLocation = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for updating location
  sendJSON(res, 200, { ok: true });
};

export const handlePrivacySettings = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for privacy settings
  sendJSON(res, 200, { ok: true });
};

export const handleUserExport = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for data export
  sendJSON(res, 200, { ok: true, format: 'json', data: {} });
};

export const handleUserDelete = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for account deletion
  sendJSON(res, 200, { ok: true });
};

export const handleMarkMessagesRead = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for marking messages as read
  sendJSON(res, 200, { ok: true, updated: [] });
};

export const handleTypingIndicator = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for typing indicators
  sendJSON(res, 200, { ok: true });
};

export const handleModerationReports = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for moderation reports
  sendJSON(res, 200, { ok: true, reports: [] });
};

export const handleModerationVerify = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for user verification
  sendJSON(res, 200, { ok: true });
};

export const handleModerationBlock = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for moderation blocking
  sendJSON(res, 200, { ok: true });
};

export const handleOrientations = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  try {
    const orientations = await db.collection('orientations')
      .orderBy('name')
      .get();
    
    const list = orientations.docs.map(doc => doc.data().name);
    sendJSON(res, 200, { ok: true, orientations: list });
  } catch (error) {
    console.error('Orientations error:', error);
    sendJSON(res, 500, { ok: false, error: 'Internal server error' });
  }
};

export const handleStats = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
  // Implementation for stats
  sendJSON(res, 200, { ok: true, stats: {} });
};