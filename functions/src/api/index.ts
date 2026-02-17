import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleRecommendations, handleDiscoverySettings, handleDiscoveryAction, handleDiscoveryStats } from './recommendations.js';
import { moderationHandlers } from './moderation.js';
import { handleProfileSubmission, handleMatches, handleChatHistory, handleSendMessage } from './legacy.js';

// Initialize Firebase Admin
const db = admin.firestore();

// CORS handler
const corsHandler = (req: functions.Request, res: functions.Response, next: Function): void => {
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
const errorHandler = (error: any, req: functions.Request, res: functions.Response) => {
  console.error('API Error:', error);
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Legacy endpoints (existing functionality)
export const apiLegacyV2 = functions
  .region('us-central1')
  .https
  .onRequest((req, res) => {
    corsHandler(req, res, () => {
      try {
        const path = req.path;
        
        switch (path) {
          case '/api/sendData':
            handleProfileSubmission(req, res, db);
            break;
          case '/api/matches':
            handleMatches(req, res, db);
            break;
          case '/api/chatHistory':
            handleChatHistory(req, res, db);
            break;
          case '/api/sendMessage':
            handleSendMessage(req, res, db);
            break;
          default:
            res.status(404).json({ ok: false, error: 'Endpoint not found' });
        }
      } catch (error) {
        errorHandler(error, req, res);
      }
    });
  });

// Discovery and Recommendations API
export const apiDiscoveryV2 = functions
  .region('us-central1')
  .https
  .onRequest((req, res) => {
    corsHandler(req, res, () => {
      try {
        const path = req.path;
        
        switch (path) {
          case '/api/recommendations':
            handleRecommendations(req, res);
            break;
          case '/api/discovery/settings':
            handleDiscoverySettings(req, res);
            break;
          case '/api/discovery/action':
            handleDiscoveryAction(req, res);
            break;
          case '/api/discovery/stats':
            handleDiscoveryStats(req, res);
            break;
          default:
            res.status(404).json({ ok: false, error: 'Endpoint not found' });
        }
      } catch (error) {
        errorHandler(error, req, res);
      }
    });
  });

// Moderation API
export const apiModerationV2 = functions
  .region('us-central1')
  .https
  .onRequest((req, res) => {
    corsHandler(req, res, () => {
      try {
        const path = req.path;
        
        switch (path) {
          case '/api/moderation/action':
            moderationHandlers.createAction(req, res, () => {});
            break;
          case '/api/moderation/reverse':
            moderationHandlers.reverseAction(req, res, () => {});
            break;
          case '/api/moderation/reports/pending':
            moderationHandlers.getPendingReports(req, res, () => {});
            break;
          case '/api/moderation/reports/resolve':
            moderationHandlers.resolveReport(req, res, () => {});
            break;
          case '/api/moderation/reports/create':
            moderationHandlers.createReport(req, res);
            break;
          case '/api/moderation/stats':
            moderationHandlers.getStats(req, res, () => {});
            break;
          case '/api/moderation/audit/:userId':
            moderationHandlers.getUserAuditLog(req, res, () => {});
            break;
          default:
            res.status(404).json({ ok: false, error: 'Endpoint not found' });
        }
      } catch (error) {
        errorHandler(error, req, res);
      }
    });
  });

// Health check endpoint
export const apiHealthV2 = functions
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
          legacy: true
        }
      });
    });
  });

// Export individual handlers for use in other modules
export {
  handleRecommendations,
  handleDiscoverySettings,
  handleDiscoveryAction,
  handleDiscoveryStats,
  moderationHandlers
};