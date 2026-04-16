const mongoose = require('mongoose');
const Notification = require('../model/NotificationModel');
const NotificationDevice = require('../model/NotificationDeviceModel');
const User = require('../model/UserModel');
const { sendNotificationToUser, sendNotificationToUserList } = require('../lib/notificationHelper');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const registerDevice = async (req, res) => {
  try {
    const { fcmToken, deviceName, deviceId, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const device = await NotificationDevice.findOneAndUpdate(
      { fcmToken },
      {
        userId: req.user._id,
        fcmToken,
        deviceName,
        deviceId,
        platform: platform || 'android',
        isActive: true,
        lastUsedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering device',
      error: error.message
    });
  }
};

const unregisterDevice = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    await NotificationDevice.findOneAndUpdate(
      { userId: req.user._id, fcmToken },
      { isActive: false, lastUsedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Device unregistered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unregistering device',
      error: error.message
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (typeof req.query.isRead === 'string') {
      query.isRead = req.query.isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification id'
      });
    }

    const notification = await Notification.findOne({ _id: id, userId: req.user._id });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification id'
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification id'
      });
    }

    const deleted = await Notification.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting all notifications',
      error: error.message
    });
  }
};

const sendToUser = async (req, res) => {
  try {
    const { userId, title, body, image, type, relatedId, relatedModel } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and body are required'
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    const targetUser = await User.findById(userId).select('_id');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await sendNotificationToUser(
      userId,
      { title, body, image },
      { type, relatedId, relatedModel }
    );

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: result.notification,
      fcmResponse: {
        successCount: result.fcm.successCount || 0,
        failureCount: result.fcm.failureCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
};

const sendToMultipleUsers = async (req, res) => {
  try {
    const { userIds, title, body, image, type, relatedId, relatedModel } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0 || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'userIds (array), title, and body are required'
      });
    }

    const validUserIds = userIds.filter((id) => isValidObjectId(id));
    if (validUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid userIds provided'
      });
    }

    const summary = await sendNotificationToUserList(
      validUserIds,
      { title, body, image },
      { type, relatedId, relatedModel }
    );

    res.status(201).json({
      success: true,
      message: 'Notifications sent',
      summary: {
        totalRequested: summary.totalRequested,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
        totalTokensTargeted: summary.totalTokensTargeted,
        fcmSuccessCount: summary.fcmSuccessCount,
        fcmFailureCount: summary.fcmFailureCount
      },
      results: summary.results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message
    });
  }
};

const sendBroadcast = async (req, res) => {
  try {
    const { title, body, image, type, relatedId, relatedModel } = req.body;
    const role = req.body.role || req.query.role;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title and body are required'
      });
    }

    const userQuery = { isActive: true };
    if (role) {
      userQuery.role = role;
    }

    const users = await User.find(userQuery).select('_id');
    const userIds = users.map((user) => user._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users targeted for broadcast',
        data: {
          totalUsersTargeted: 0,
          totalDevicesTargeted: 0,
          fcmResponse: {
            successCount: 0,
            failureCount: 0
          }
        }
      });
    }

    const summary = await sendNotificationToUserList(
      userIds,
      { title, body, image },
      { type, relatedId, relatedModel }
    );

    const totalDevicesTargeted = await NotificationDevice.countDocuments({
      userId: { $in: userIds },
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Broadcast notification sent successfully',
      data: {
        totalUsersTargeted: userIds.length,
        totalDevicesTargeted,
        fcmResponse: {
          successCount: summary.fcmSuccessCount,
          failureCount: summary.fcmFailureCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error broadcasting notifications',
      error: error.message
    });
  }
};

module.exports = {
  registerDevice,
  unregisterDevice,
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  sendToUser,
  sendToMultipleUsers,
  sendBroadcast
};
