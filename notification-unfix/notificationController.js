const Notification = require("../model/NotificationModel");
const NotificationDevice = require("../model/NotificationDeviceModel");
const User = require("../model/UserModel");
const firebase = require("../lib/firebase");

/**
 * Register FCM token dari device
 */
const registerDevice = async (req, res) => {
  try {
    const { fcmToken, deviceName, deviceId, platform } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required"
      });
    }

    // Cek apakah token sudah terdaftar
    let device = await NotificationDevice.findOne({ fcmToken });

    if (device) {
      // Update existing device
      device.userId = userId;
      device.deviceName = deviceName || device.deviceName;
      device.deviceId = deviceId || device.deviceId;
      device.platform = platform || device.platform;
      device.isActive = true;
      device.lastUsedAt = new Date();
    } else {
      // Create new device
      device = new NotificationDevice({
        userId,
        fcmToken,
        deviceName,
        deviceId,
        platform: platform || 'android'
      });
    }

    await device.save();

    // Subscribe ke topic berdasarkan user
    try {
      await firebase.subscribeToTopic([fcmToken], `user_${userId}`);
    } catch (error) {
      console.warn('Failed to subscribe to topic:', error.message);
    }

    res.status(201).json({
      success: true,
      message: "Device registered successfully",
      data: device
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering device",
      error: error.message
    });
  }
};

/**
 * Unregister/remove FCM token
 */
const unregisterDevice = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required"
      });
    }

    // Unsubscribe dari topic
    try {
      await firebase.unsubscribeFromTopic([fcmToken], `user_${userId}`);
    } catch (error) {
      console.warn('Failed to unsubscribe from topic:', error.message);
    }

    await NotificationDevice.deleteOne({ fcmToken, userId });

    res.status(200).json({
      success: true,
      message: "Device unregistered successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unregistering device",
      error: error.message
    });
  }
};

/**
 * Get all notifications untuk user yang login
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, isRead } = req.query;

    let query = { userId };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message
    });
  }
};

/**
 * Get single notification by ID
 */
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notification",
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read",
      error: error.message
    });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message
    });
  }
};

/**
 * Delete all notifications
 */
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting notifications",
      error: error.message
    });
  }
};

/**
 * Send notification to user (ADMIN ONLY)
 */
const sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, body, image, type, relatedId, relatedModel } = req.body;

    // Validasi input
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "userId, title, and body are required"
      });
    }

    // Cek apakah user ada
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Simpan notification ke database
    const notification = new Notification({
      userId,
      title,
      body,
      image,
      type: type || 'system',
      relatedId,
      relatedModel
    });

    await notification.save();

    // Get user's FCM tokens
    const devices = await NotificationDevice.find({
      userId,
      isActive: true
    });

    // Send via FCM jika ada devices terdaftar
    if (devices.length > 0) {
      const fcmTokens = devices.map(device => device.fcmToken);

      try {
        const data = {
          notificationId: notification._id.toString(),
          type: type || 'system',
          ...(relatedId && { relatedId: relatedId.toString() }),
          ...(relatedModel && { relatedModel: relatedModel })
        };

        await firebase.sendMulticastNotification(
          fcmTokens,
          { title, body, image },
          data
        );
      } catch (fcmError) {
        console.warn('Failed to send FCM notification:', fcmError.message);
        // Continue jika FCM gagal, notification tetap tersimpan di database
      }
    }

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending notification",
      error: error.message
    });
  }
};

/**
 * Send notification to multiple users (ADMIN ONLY)
 */
const sendNotificationToMultipleUsers = async (req, res) => {
  try {
    const { userIds, title, body, image, type } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds array is required and must not be empty"
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "title and body are required"
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      try {
        const notification = new Notification({
          userId,
          title,
          body,
          image,
          type: type || 'system'
        });

        await notification.save();

        // Get user's FCM tokens
        const devices = await NotificationDevice.find({
          userId,
          isActive: true
        });

        if (devices.length > 0) {
          const fcmTokens = devices.map(device => device.fcmToken);

          try {
            const data = {
              notificationId: notification._id.toString(),
              type: type || 'system'
            };

            await firebase.sendMulticastNotification(
              fcmTokens,
              { title, body, image },
              data
            );
          } catch (fcmError) {
            console.warn(`Failed to send FCM for user ${userId}:`, fcmError.message);
          }
        }

        results.push({
          userId,
          success: true,
          notificationId: notification._id
        });
        successCount++;
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: "Notifications sent",
      summary: {
        totalRequested: userIds.length,
        successCount,
        failureCount
      },
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending notifications",
      error: error.message
    });
  }
};

/**
 * Send broadcast notification (ADMIN ONLY)
 */
const sendBroadcastNotification = async (req, res) => {
  try {
    const { title, body, image, type, role } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "title and body are required"
      });
    }

    // Get users by role if specified
    let users;
    if (role) {
      users = await User.find({ role, isActive: true }).select('_id');
    } else {
      users = await User.find({ isActive: true }).select('_id');
    }

    const userIds = users.map(user => user._id);

    if (userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No users found to send notifications to"
      });
    }

    // Get all active devices
    const devices = await NotificationDevice.find({
      isActive: true,
      userId: { $in: userIds }
    });

    if (devices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No registered devices found"
      });
    }

    const fcmTokens = devices.map(device => device.fcmToken);

    // Send via FCM
    let fcmResponse = null;
    try {
      const data = {
        type: type || 'system'
      };

      fcmResponse = await firebase.sendMulticastNotification(
        fcmTokens,
        { title, body, image },
        data
      );
    } catch (fcmError) {
      console.warn('Failed to send broadcast FCM:', fcmError.message);
    }

    // Save notifications untuk semua users
    const notifications = userIds.map(userId => ({
      userId,
      title,
      body,
      image,
      type: type || 'system'
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: "Broadcast notification sent successfully",
      data: {
        totalUsersTargeted: userIds.length,
        totalDevicesTargeted: devices.length,
        fcmResponse: fcmResponse ? {
          successCount: fcmResponse.successCount,
          failureCount: fcmResponse.failureCount
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending broadcast notification",
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
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendBroadcastNotification
};
