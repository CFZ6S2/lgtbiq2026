import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBkLQS6yOarEu2nNsUT0TX0oF_oKfORcVc",
  authDomain: "lgtbiq26.firebaseapp.com",
  projectId: "lgtbiq26",
  storageBucket: "lgtbiq26.firebasestorage.app",
  messagingSenderId: "564400637541",
  appId: "1:564400637541:web:721bb308aac64117a4a88c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Re-export db for easier imports
export { db as database };

// Firebase API helper functions
export const firebaseAPI = {
  // Authentication
  async signInWithTelegram(initData) {
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
      });
      
      const data = await response.json();
      if (response.ok && data.firebaseCustomToken) {
        await signInWithCustomToken(auth, data.firebaseCustomToken);
        return { success: true, jwt: data.token, user: data.user };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // User profile functions
  async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      const privacyDoc = await getDoc(doc(db, 'privacySettings', userId));
      
      return {
        user: userDoc.exists() ? userDoc.data() : null,
        profile: profileDoc.exists() ? profileDoc.data() : null,
        privacy: privacyDoc.exists() ? privacyDoc.data() : null
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  async updateUserProfile(userId, profileData) {
    try {
      await updateDoc(doc(db, 'profiles', userId), profileData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Recommendations
  async getRecommendations(filters = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('https://us-central1-lgtbiq26.cloudfunctions.net/api/recs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: 'demo_init_data', // Replace with actual initData
          ...filters
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return { ok: false, error: error.message };
    }
  },

  // Likes and matches
  async likeUser(targetUserId) {
    try {
      const response = await fetch('https://us-central1-lgtbiq26.cloudfunctions.net/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: 'demo_init_data', // Replace with actual initData
          toUserId: targetUserId
        })
      });

      return await response.json();
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  async getMatches() {
    try {
      const response = await fetch('https://us-central1-lgtbiq26.cloudfunctions.net/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: 'demo_init_data' // Replace with actual initData
        })
      });

      return await response.json();
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  // Chat functions
  async getChatHistory(peerUserId, limit = 50) {
    try {
      const response = await fetch('https://us-central1-lgtbiq26.cloudfunctions.net/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: 'demo_init_data', // Replace with actual initData
          peerUserId,
          limit
        })
      });

      return await response.json();
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  async sendMessage(recipientId, content, messageType = 'TEXT') {
    try {
      const response = await fetch('https://us-central1-lgtbiq26.cloudfunctions.net/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: 'demo_init_data', // Replace with actual initData
          toUserId: recipientId,
          content,
          messageType
        })
      });

      return await response.json();
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  // Map functions
  async getNearbyUsers(lat, lon, radiusKm = 5) {
    try {
      const response = await fetch(`https://us-central1-lgtbiq26.cloudfunctions.net/api/map/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}&initData=demo_init_data`);
      return await response.json();
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  // Orientations
  async getOrientations() {
    try {
      const response = await fetch('https://us-central1-lgtbiq26.cloudfunctions.net/api/orientations');
      return await response.json();
    } catch (error) {
      return { ok: false, error: error.message };
    }
  },

  // Real-time listeners
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Subscribe to messages (using polling for now, can be upgraded to Firestore real-time)
  subscribeToMessages(peerUserId, callback) {
    let interval = setInterval(async () => {
      const result = await this.getChatHistory(peerUserId, 10);
      if (result.ok) {
        callback(result.messages);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }
};

export default firebaseAPI;
