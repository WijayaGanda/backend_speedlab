const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'service', 'promo', 'warranty', 'system'],
    default: 'system',
    index: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedModel: {
    type: String,
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
