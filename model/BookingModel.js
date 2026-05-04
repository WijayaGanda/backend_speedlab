const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  motorcycleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Motorcycle", 
    required: true 
  },

  // Support BOTH format lama dan baru
  // Format lama: serviceIds (masih bisa dipakai, backward compatibility)
  serviceIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service"
  }],

  // Format baru: bookingDetails (embedded objects dengan varian & add-ons breakdown)
  bookingDetails: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    },
    serviceName: {
      type: String,
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    },
    selectedVariant: {
      type: String,
      default: null
    },
    selectedAddons: [{
      id: {
        type: mongoose.Schema.Types.ObjectId
      },
      name: String,
      price: Number,
      quantity: Number,
      subtotal: Number,
      _id: false
    }],
    addonsTotal: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true
    },
    _id: false
  }],
  
  bookingDate: { 
    type: Date, 
    required: true 
  },
  bookingTime: { 
    type: String, 
    required: true 
  },
  complaint: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['Menunggu Verifikasi', 'Terverifikasi', 'Sedang Dikerjakan', 'Selesai', 'Dibatalkan', 'Diambil'],
    default: 'Menunggu Verifikasi'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  verifiedAt: {
    type: Date
  },
  servicePrice: { 
    type: Number, 
    default: 0,
    description: "Total harga dari service + varian + add-ons"
  },
  sparepartsPrice: { 
    type: Number, 
    default: 0,
    description: "Harga dari spare parts yang digunakan"
  },
  totalPrice: { 
    type: Number, 
    default: 0,
    description: "Total harga = servicePrice + sparepartsPrice"
  },
  notes: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index untuk sorting FIFO
bookingSchema.index({ createdAt: 1 });
bookingSchema.index({ bookingDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
