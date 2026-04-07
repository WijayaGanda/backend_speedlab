const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  body: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String 
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'service', 'promo', 'system', 'warranty'],
    default: 'system'
  },
  relatedId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  relatedModel: {
    type: String,
    enum: ['Booking', 'Payment', 'Service', 'Warranty', null],
    default: null
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  },
  sentAt: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index untuk query yang lebih cepat
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
