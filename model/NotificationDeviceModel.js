const mongoose = require('mongoose');

const notificationDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fcmToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceName: {
    type: String,
    trim: true
  },
  deviceId: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web'],
    default: 'android'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

notificationDeviceSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('NotificationDevice', notificationDeviceSchema);
