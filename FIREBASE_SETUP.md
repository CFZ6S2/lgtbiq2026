# Firebase Migration Guide for LGBTIQ+ Social Platform

This guide will help you migrate from PostgreSQL/Prisma to Firebase and deploy the platform.

## 🚀 Quick Start

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project"
3. Name it (e.g., "prisma-lgbtq-social")
4. Enable Google Analytics (optional)
5. Wait for project creation

### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 3. Login to Firebase

```bash
firebase login
```

### 4. Initialize Firebase in Project

```bash
firebase init
```

Select these options:
- ✅ Functions
- ✅ Firestore
- ✅ Hosting
- ✅ Storage

### 5. Configure Firebase

#### Update Frontend Configuration

Edit `frontend/src/firebase.js` and replace with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

Get these values from:
1. Firebase Console → Project Settings → General → Your apps
2. Create a new Web app if you haven't already

#### Set Environment Variables

Create `.env` file in project root:

```env
BOT_TOKEN=your_telegram_bot_token
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_FUNCTIONS_REGION=us-central1
```

### 6. Deploy Everything

```bash
# Deploy all services
firebase deploy

# Or deploy individual services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only hosting
```

### 7. Setup Initial Data

1. Get your service account key:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

2. Run setup script:
```bash
node setup-firebase.js path/to/service-account-key.json --with-samples
```

## 📋 Firebase Services Overview

### Firestore Collections

- **users** - User accounts and basic info
- **profiles** - User profiles and preferences
- **privacySettings** - Privacy and visibility settings
- **likes** - User likes (unidirectional)
- **matches** - Mutual matches
- **messages** - Chat messages
- **blocks** - Blocked users
- **reports** - User reports
- **verification** - Profile verification status
- **stats** - Daily statistics
- **orientations** - Sexual orientations list

### Cloud Functions

- **api** - Main API endpoint (handles all requests)
- **createMatch** - Creates matches when reciprocal likes occur
- **updateStats** - Updates daily statistics
- **updateMessageStats** - Updates message statistics

### Security Rules

- **Firestore Rules** - Data access control and validation
- **Storage Rules** - File upload permissions and limits

## 🔧 Development

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start

# Frontend development
cd frontend
npm run dev

# Functions development
cd functions
npm run serve
```

### Testing

```bash
# Test functions locally
cd functions
npm test

# Test API endpoints
curl http://localhost:5001/your-project-id/us-central1/api/api/orientations
```

## 🔄 Migration from PostgreSQL

### Data Migration Script

If you have existing PostgreSQL data, you can migrate it:

```bash
# Export PostgreSQL data
npm run db:export

# Import to Firestore (custom script needed)
node migrate-postgres-to-firebase.js
```

### Schema Changes

Key differences from PostgreSQL:
- **No JOINs** - Use subcollections or denormalized data
- **No transactions** across collections - Use batched writes
- **Realtime updates** - Use Firestore listeners
- **Geolocation** - Use geohashing for nearby queries

## 📱 Frontend Updates

### New Firebase Integration

The frontend now uses Firebase SDK:

```javascript
import firebaseAPI from './firebase';

// Get recommendations
const recommendations = await firebaseAPI.getRecommendations();

// Like a user
const result = await firebaseAPI.likeUser(userId);

// Send message
await firebaseAPI.sendMessage(recipientId, message);
```

### Real-time Features

Add real-time listeners:

```javascript
// Listen for new messages
const unsubscribe = firebaseAPI.subscribeToMessages(peerUserId, (messages) => {
  // Update UI with new messages
});

// Listen for auth changes
firebaseAPI.onAuthStateChange((user) => {
  // Handle auth state changes
});
```

## 🌐 Deployment

### Production Deployment

```bash
# Deploy to production
firebase deploy --project production

# Deploy with specific message
firebase deploy --message "Added new features"

# Deploy only functions (faster)
firebase deploy --only functions
```

### Environment Configuration

Set up different environments:

```bash
# Create environments
firebase use production
firebase use staging
firebase use development

# Deploy to specific environment
firebase deploy --project staging
```

## 🔒 Security

### Authentication

- Telegram WebApp validation
- Firebase Custom Authentication tokens
- Email/password authentication (future)

### Data Protection

- Firestore security rules enforce access control
- Input validation with Zod schemas
- Rate limiting on API endpoints
- File upload restrictions

### Privacy

- Incognito mode support
- Location privacy controls
- Profile visibility settings
- Block and report functionality

## 🚀 Performance Optimization

### Firestore Indexes

The project includes optimized indexes for:
- Fast user discovery queries
- Efficient chat history retrieval
- Location-based searches
- Block list management

### Caching

- Browser caching for static assets
- CDN through Firebase Hosting
- Function result caching (where applicable)

### Monitoring

- Firebase Performance Monitoring
- Cloud Logging for functions
- Error tracking and alerts

## 🐛 Troubleshooting

### Common Issues

1. **Functions deployment fails**
   ```bash
   # Check logs
   firebase functions:log
   
   # Test locally
   firebase emulators:start --only functions
   ```

2. **Firestore permission errors**
   - Check security rules in `firestore.rules`
   - Verify user authentication status
   - Review Firestore indexes

3. **Frontend can't connect to Firebase**
   - Verify Firebase config in `firebase.js`
   - Check network connectivity
   - Review browser console for errors

### Getting Help

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Community: https://firebase.community/
- GitHub Issues: Report issues on project repository

## 📊 Monitoring

After deployment, monitor your app:

1. **Firebase Console** - Usage analytics
2. **Cloud Logging** - Function logs
3. **Performance Monitoring** - App performance
4. **Crashlytics** - Error reporting (if enabled)

---

**¡Listo!** Tu plataforma LGBTIQ+ ahora está en Firebase con escalabilidad, seguridad y todas las ventajas de la infraestructura de Google. 🏳️‍🌈