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
  // Format lama: serviceIds (masih bisa dipakai, akan auto-convert ke bookingDetails)
  serviceIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service",
    default: []
  }],

  // Format baru: bookingDetails (dengan varian & add-ons)
  bookingDetails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "BookingDetail",
    default: []
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
