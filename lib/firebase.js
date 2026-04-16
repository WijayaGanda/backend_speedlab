const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let initialized = false;

const initializeWithServiceAccount = (serviceAccount) => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  initialized = true;
  return true;
};

const initializeFirebase = () => {
  if (initialized) {
    return true;
  }

  try {
    if (admin.apps.length > 0) {
      initialized = true;
      return true;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
        const serviceAccount = JSON.parse(raw);
        return initializeWithServiceAccount(serviceAccount);
      } catch (error) {
        console.warn('Firebase env JSON invalid, trying file fallback:', error.message);
      }
    }

    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      return initializeWithServiceAccount(serviceAccount);
    }

    console.warn('Firebase initialization warning: credentials not found, push notifications disabled.');
    return false;
  } catch (error) {
    console.warn('Firebase initialization warning:', error.message);
    return false;
  }
};

const sendMulticastNotification = async (tokens, payload) => {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  const isReady = initializeFirebase();
  if (!isReady) {
    return {
      successCount: 0,
      failureCount: tokens.length,
      responses: tokens.map(() => ({ success: false, error: { message: 'Firebase not configured' } }))
    };
  }

  try {
    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image
      },
      data: payload.data || {}
    });

    return result;
  } catch (error) {
    console.error('Error sending FCM multicast:', error.message);
    return {
      successCount: 0,
      failureCount: tokens.length,
      responses: tokens.map(() => ({ success: false, error: { message: error.message } }))
    };
  }
};

module.exports = {
  initializeFirebase,
  sendMulticastNotification
};
