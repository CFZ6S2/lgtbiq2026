import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Legacy validation schemas
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

// Helper functions
const sendJSON = (res: functions.Response, status: number, data: any) => {
  res.status(status).json(data);
};

// Legacy API Handlers
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
      intentsFriends: profile.intents?.lookingFriends || false,
      intentsRomance: profile.intents?.lookingRomance || false,
      intentsPoly: profile.intents?.lookingPoly || false,
      transInclusive: profile.intents?.transInclusive !== false,
      city: profile.location?.city || null,
      latitude: profile.location?.latitude || null,
      longitude: profile.location?.longitude || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
      mapConsentAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        batch.set(ref, { 
          orientationId: orientationId!, 
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
    
  } catch (error) {
    console.error('Profile submission error:', error);
    sendJSON(res, 500, { ok: false, error: 'Internal server error' });
  }
};

export const handleMatches = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
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
  } catch (error) {
    console.error('Matches error:', error);
    sendJSON(res, 500, { ok: false, error: 'Internal server error' });
  }
};

export const handleChatHistory = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
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
  } catch (error) {
    console.error('Chat history error:', error);
    sendJSON(res, 500, { ok: false, error: 'Internal server error' });
  }
};

export const handleSendMessage = async (req: functions.Request, res: functions.Response, db: admin.firestore.Firestore) => {
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
    
  } catch (error) {
    console.error('Send message error:', error);
    sendJSON(res, 500, { ok: false, error: 'Internal server error' });
  }
};