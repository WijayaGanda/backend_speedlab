const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let serviceAccount;

try {
  // Load service account dari environment variable atau file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // Fallback ke file JSON (untuk development)
    serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.warn('Firebase initialization warning:', error.message);
  console.warn('Firebase Cloud Messaging will not be available. Make sure to provide Firebase credentials.');
}

const messaging = admin.messaging();

/**
 * Send notification using Firebase Cloud Messaging
 * @param {string} fcmToken - FCM token dari device
 * @param {object} notification - { title, body, image? }
 * @param {object} data - Custom data untuk aplikasi
 * @returns {Promise<string>} - Message ID
 */
const sendNotification = async (fcmToken, notification, data = {}) => {
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.image && { imageUrl: notification.image })
      },
      webpush: {
        headers: {
          'TTL': '86400'
        },
        ...(notification.image && {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.image
          }
        })
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            sound: 'default',
            badge: 1
          }
        }
      },
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          ...(notification.image && { image: notification.image })
        }
      },
      data: data,
      token: fcmToken
    };

    const response = await messaging.send(message);
    console.log('Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send multicast notification (ke banyak device)
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {object} notification - { title, body, image? }
 * @param {object} data - Custom data untuk aplikasi
 * @returns {Promise<object>} - Response dengan success dan failure count
 */
const sendMulticastNotification = async (fcmTokens, notification, data = {}) => {
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.image && { imageUrl: notification.image })
      },
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          ...(notification.image && { image: notification.image })
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            sound: 'default'
          }
        }
      },
      data: data,
      tokens: fcmTokens
    };

    const response = await messaging.sendMulticast(message);
    console.log('Multicast notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });
    
    return response;
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    throw error;
  }
};

/**
 * Send topic notification
 * @param {string} topic - Firebase topic
 * @param {object} notification - { title, body, image? }
 * @param {object} data - Custom data
 */
const sendTopicNotification = async (topic, notification, data = {}) => {
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.image && { imageUrl: notification.image })
      },
      android: {
        priority: 'high'
      },
      data: data,
      topic: topic
    };

    const response = await messaging.send(message);
    return response;
  } catch (error) {
    console.error('Error sending topic notification:', error);
    throw error;
  }
};

/**
 * Subscribe device ke topic
 */
const subscribeToTopic = async (fcmTokens, topic) => {
  try {
    const response = await messaging.subscribeToTopic(fcmTokens, topic);
    return response;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
};

/**
 * Unsubscribe device dari topic
 */
const unsubscribeFromTopic = async (fcmTokens, topic) => {
  try {
    const response = await messaging.unsubscribeFromTopic(fcmTokens, topic);
    return response;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw error;
  }
};

module.exports = {
  messaging,
  sendNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic
};
