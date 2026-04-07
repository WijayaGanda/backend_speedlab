const mongoose = require("mongoose");

const notificationDeviceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fcmToken: { 
    type: String, 
    required: true,
    unique: true
  },
  deviceName: { 
    type: String 
  },
  deviceId: { 
    type: String 
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    default: 'android'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastUsedAt: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index untuk query yang lebih cepat
notificationDeviceSchema.index({ userId: 1 });
notificationDeviceSchema.index({ fcmToken: 1 });

module.exports = mongoose.model("NotificationDevice", notificationDeviceSchema);
