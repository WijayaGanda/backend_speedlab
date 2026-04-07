const Notification = require("../model/NotificationModel");
const NotificationDevice = require("../model/NotificationDeviceModel");
const firebase = require("../lib/firebase");

/**
 * Helper function untuk mengirim notifikasi ke user
 * Digunakan di berbagai controller (payment, booking, dll)
 */
const sendNotificationToUser = async (userId, notification, options = {}) => {
  try {
    const {
      type = 'system',
      relatedId = null,
      relatedModel = null,
      skipDatabase = false
    } = options;

    // Simpan ke database jika tidak diskip
    if (!skipDatabase) {
      const notificationDoc = new Notification({
        userId,
        title: notification.title,
        body: notification.body,
        image: notification.image,
        type,
        relatedId,
        relatedModel
      });

      await notificationDoc.save();
    }

    // Get user's active FCM tokens
    const devices = await NotificationDevice.find({
      userId,
      isActive: true
    });

    if (devices.length === 0) {
      console.log(`No active devices found for user ${userId}`);
      return {
        success: true,
        message: "Notification saved but no devices to send to"
      };
    }

    const fcmTokens = devices.map(device => device.fcmToken);

    // Send via FCM
    const data = {
      type,
      ...(relatedId && { relatedId: relatedId.toString() }),
      ...(relatedModel && { relatedModel: relatedModel })
    };

    const response = await firebase.sendMulticastNotification(
      fcmTokens,
      notification,
      data
    );

    // Log failed tokens untuk cleanup
    if (response.failureCount > 0) {
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.warn(`Failed to send to token ${fcmTokens[index]}`);
          // Optional: Mark device as inactive
          // await NotificationDevice.updateOne(
          //   { fcmToken: fcmTokens[index] },
          //   { isActive: false }
          // );
        }
      });
    }

    return {
      success: true,
      message: "Notification sent successfully",
      fcmResponse: {
        successCount: response.successCount,
        failureCount: response.failureCount
      }
    };
  } catch (error) {
    console.error('Error in sendNotificationToUser:', error);
    return {
      success: false,
      message: "Failed to send notification",
      error: error.message
    };
  }
};

/**
 * Send notification to multiple users
 */
const sendNotificationToUserList = async (userIds, notification, options = {}) => {
  try {
    const results = [];

    for (const userId of userIds) {
      const result = await sendNotificationToUser(userId, notification, options);
      results.push({ userId, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      summary: {
        totalRequested: userIds.length,
        successCount,
        failureCount
      },
      results
    };
  } catch (error) {
    console.error('Error in sendNotificationToUserList:', error);
    throw error;
  }
};

/**
 * Send broadcast notification
 */
const sendBroadcastNotification = async (notification, options = {}) => {
  try {
    const { type = 'system' } = options;

    // Get all active devices
    const devices = await NotificationDevice.find({ isActive: true });

    if (devices.length === 0) {
      return {
        success: false,
        message: "No devices found"
      };
    }

    // Get unique user IDs
    const userIds = [...new Set(devices.map(d => d.userId))];

    // Save notification for all users
    const notificationDocs = userIds.map(userId => ({
      userId,
      title: notification.title,
      body: notification.body,
      image: notification.image,
      type
    }));

    await Notification.insertMany(notificationDocs);

    // Send via FCM
    const fcmTokens = devices.map(device => device.fcmToken);

    const response = await firebase.sendMulticastNotification(
      fcmTokens,
      notification,
      { type }
    );

    return {
      success: true,
      message: "Broadcast sent successfully",
      stats: {
        usersTargeted: userIds.length,
        devicesTargeted: fcmTokens.length,
        fcmSuccess: response.successCount,
        fcmFailure: response.failureCount
      }
    };
  } catch (error) {
    console.error('Error in sendBroadcastNotification:', error);
    throw error;
  }
};

/**
 * Notify user about booking confirmation
 */
const notifyBookingConfirmation = async (userId, bookingData) => {
  return sendNotificationToUser(userId, {
    title: 'Booking Confirmed',
    body: `Your booking has been confirmed. Booking ID: ${bookingData.bookingId || ''}`
  }, {
    type: 'booking',
    relatedId: bookingData.bookingId,
    relatedModel: 'Booking'
  });
};

/**
 * Notify user about payment status
 */
const notifyPaymentStatus = async (userId, paymentData, status) => {
  const messages = {
    success: {
      title: 'Payment Successful',
      body: `Your payment of Rp ${paymentData.amount} has been processed successfully`
    },
    pending: {
      title: 'Payment Pending',
      body: `Your payment request is being processed. Please wait for confirmation.`
    },
    failed: {
      title: 'Payment Failed',
      body: `Your payment failed. Please try again or contact support.`
    }
  };

  return sendNotificationToUser(userId, messages[status] || messages.pending, {
    type: 'payment',
    relatedId: paymentData.paymentId,
    relatedModel: 'Payment'
  });
};

/**
 * Notify user about service completion
 */
const notifyServiceCompleted = async (userId, serviceData) => {
  return sendNotificationToUser(userId, {
    title: 'Service Completed',
    body: `Your service has been completed. Service ID: ${serviceData.serviceId || ''}`
  }, {
    type: 'service',
    relatedId: serviceData.serviceId,
    relatedModel: 'Service'
  });
};

/**
 * Notify user about warranty claim
 */
const notifyWarrantyClaim = async (userId, warrantyData) => {
  return sendNotificationToUser(userId, {
    title: 'Warranty Claim Processed',
    body: `Your warranty claim has been processed. Claim ID: ${warrantyData.claimId || ''}`
  }, {
    type: 'warranty',
    relatedId: warrantyData.warrantyId,
    relatedModel: 'Warranty'
  });
};

module.exports = {
  sendNotificationToUser,
  sendNotificationToUserList,
  sendBroadcastNotification,
  notifyBookingConfirmation,
  notifyPaymentStatus,
  notifyServiceCompleted,
  notifyWarrantyClaim
};
