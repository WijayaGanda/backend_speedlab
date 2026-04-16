const mongoose = require('mongoose');
const Notification = require('../model/NotificationModel');
const NotificationDevice = require('../model/NotificationDeviceModel');
const { sendMulticastNotification } = require('./firebase');

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(value);
};

const saveNotification = async (userId, payload, options = {}) => {
  return Notification.create({
    userId: toObjectId(userId),
    title: payload.title,
    body: payload.body,
    image: payload.image,
    type: options.type || 'system',
    relatedId: options.relatedId,
    relatedModel: options.relatedModel,
    data: options.data,
    sentAt: new Date()
  });
};

const getUserActiveTokens = async (userId) => {
  const devices = await NotificationDevice.find({
    userId: toObjectId(userId),
    isActive: true
  }).select('fcmToken');

  return devices.map((device) => device.fcmToken);
};

const cleanupInvalidTokens = async (tokenResults, tokens) => {
  if (!tokenResults || tokenResults.length === 0) {
    return;
  }

  const invalidTokenCodes = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token'
  ]);

  const invalidTokens = [];
  tokenResults.forEach((result, index) => {
    if (!result.success && result.error && invalidTokenCodes.has(result.error.code)) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length > 0) {
    await NotificationDevice.updateMany(
      { fcmToken: { $in: invalidTokens } },
      { isActive: false, lastUsedAt: new Date() }
    );
  }
};

const sendNotificationToUser = async (userId, payload, options = {}) => {
  const notification = await saveNotification(userId, payload, options);
  const tokens = await getUserActiveTokens(userId);

  if (tokens.length === 0) {
    return {
      notification,
      fcm: { successCount: 0, failureCount: 0, responses: [] }
    };
  }

  const fcmResult = await sendMulticastNotification(tokens, {
    title: payload.title,
    body: payload.body,
    image: payload.image,
    data: {
      type: options.type || 'system',
      notificationId: notification._id.toString(),
      relatedId: options.relatedId ? options.relatedId.toString() : '',
      relatedModel: options.relatedModel || ''
    }
  });

  await cleanupInvalidTokens(fcmResult.responses, tokens);

  return {
    notification,
    fcm: fcmResult
  };
};

const sendNotificationToUserList = async (userIds, payload, options = {}) => {
  const results = [];
  let fcmSuccessCount = 0;
  let fcmFailureCount = 0;
  let totalTokensTargeted = 0;

  for (const userId of userIds) {
    try {
      const result = await sendNotificationToUser(userId, payload, options);
      fcmSuccessCount += result.fcm.successCount || 0;
      fcmFailureCount += result.fcm.failureCount || 0;
      totalTokensTargeted += (result.fcm.successCount || 0) + (result.fcm.failureCount || 0);

      results.push({
        userId,
        success: true,
        notificationId: result.notification._id,
        fcm: {
          successCount: result.fcm.successCount || 0,
          failureCount: result.fcm.failureCount || 0
        }
      });
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }

  return {
    totalRequested: userIds.length,
    successCount: results.filter((item) => item.success).length,
    failureCount: results.filter((item) => !item.success).length,
    totalTokensTargeted,
    fcmSuccessCount,
    fcmFailureCount,
    results
  };
};

module.exports = {
  sendNotificationToUser,
  sendNotificationToUserList
};
