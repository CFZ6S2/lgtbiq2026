#!/usr/bin/env node

/**
 * Firebase Setup Script for LGBTIQ+ Social Platform
 * 
 * This script helps set up the Firebase project with the necessary collections,
 * documents, and initial data.
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Check if service account key is provided
const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
  console.error('Usage: node setup-firebase.js <path-to-service-account-key.json>');
  console.error('\nTo get your service account key:');
  console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.error('2. Click "Generate new private key"');
  console.error('3. Save the JSON file and provide its path as argument');
  process.exit(1);
}

try {
  // Initialize Firebase Admin
  const serviceAccount = require(serviceAccountPath);
  initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = getFirestore();

  async function setupFirebase() {
    console.log('🚀 Setting up Firebase for LGBTIQ+ Social Platform...\n');

    // 1. Create orientations collection
    console.log('📋 Creating orientations collection...');
    const orientations = [
      'Lesbiana', 'Gay', 'Bisexual', 'Transgénero', 'Queer', 
      'Intersexual', 'Asexual', 'Pansexual', 'Fluido', 'No binario',
      'Demisexual', 'Aromántico', 'Poliamoroso', 'Monógamo', 'Abierto'
    ];

    const orientationBatch = db.batch();
    orientations.forEach(name => {
      const ref = db.collection('orientations').doc();
      orientationBatch.set(ref, { name });
    });
    await orientationBatch.commit();
    console.log(`✅ Created ${orientations.length} orientations`);

    // 2. Create stats collection with initial document
    console.log('\n📊 Creating stats collection...');
    const today = new Date().toISOString().split('T')[0];
    await db.collection('stats').doc(today).set({
      day: new Date(today),
      likes: 0,
      matches: 0,
      messages: 0
    });
    console.log('✅ Created initial stats document');

    // 3. Create default admin user (if needed)
    console.log('\n👑 Creating default admin user...');
    const adminUser = {
      telegramId: 'admin_123456',
      username: 'admin',
      displayName: 'Administrador',
      email: 'admin@example.com',
      emailVerified: true,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const adminRef = db.collection('users').doc('admin_123456');
    await adminRef.set(adminUser);

    // Create admin profile
    await db.collection('profiles').doc('admin_123456').set({
      userId: 'admin_123456',
      displayName: 'Administrador',
      pronouns: 'El/Él',
      gender: 'Hombre',
      intentsFriends: true,
      intentsRomance: false,
      intentsPoly: false,
      transInclusive: true,
      city: 'Madrid',
      verified: true
    });

    // Create admin privacy settings
    await db.collection('privacySettings').doc('admin_123456').set({
      userId: 'admin_123456',
      incognito: false,
      hideDistance: false,
      profileVisible: true,
      mapConsent: true
    });

    console.log('✅ Created admin user');

    // 4. Create sample users (optional, for testing)
    if (process.argv.includes('--with-samples')) {
      console.log('\n👥 Creating sample users...');
      
      const sampleUsers = [
        {
          telegramId: 'sample_1',
          username: 'alex_sample',
          displayName: 'Alex',
          email: 'alex@example.com',
          emailVerified: true
        },
        {
          telegramId: 'sample_2',
          username: 'sam_sample',
          displayName: 'Sam',
          email: 'sam@example.com',
          emailVerified: true
        }
      ];

      for (const user of sampleUsers) {
        const userRef = db.collection('users').doc(user.telegramId);
        await userRef.set({
          ...user,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create profile
        await db.collection('profiles').doc(user.telegramId).set({
          userId: user.telegramId,
          displayName: user.displayName,
          pronouns: 'El/Él',
          gender: 'Hombre',
          intentsFriends: true,
          intentsRomance: true,
          intentsPoly: false,
          transInclusive: true,
          city: 'Barcelona',
          latitude: 41.3851,
          longitude: 2.1734,
          geoHash: 'sp3e3y',
          locationUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create privacy settings
        await db.collection('privacySettings').doc(user.telegramId).set({
          userId: user.telegramId,
          incognito: false,
          hideDistance: false,
          profileVisible: true,
          mapConsent: true
        });
      }
      console.log('✅ Created sample users');
    }

    console.log('\n🎉 Firebase setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy Firebase Functions: firebase deploy --only functions');
    console.log('2. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('3. Deploy Storage rules: firebase deploy --only storage');
    console.log('4. Deploy hosting: firebase deploy --only hosting');
    console.log('5. Update frontend/src/firebase.js with your Firebase config');
    
    if (!process.argv.includes('--with-samples')) {
      console.log('\n💡 To create sample users, run: node setup-firebase.js <key> --with-samples');
    }

  } catch (error) {
    console.error('❌ Error setting up Firebase:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run setup
setupFirebase();