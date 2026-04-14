const mongoose = require("mongoose");

const serviceHistorySchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking", 
    required: true,
    unique: true // 1 booking = 1 service history
  },
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
  serviceIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service" 
  }],
  complaint: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['Dimulai', 'Sedang Dikerjakan', 'Selesai'],
    default: 'Dimulai'
  },
  diagnosis: { 
    type: String 
  },
  workDone: { 
    type: String 
  },
  spareParts: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  servicePrice: { 
    type: Number, 
    default: 0,
    description: "Harga dari service/jasa saja"
  },
  sparepartsPrice: { 
    type: Number, 
    default: 0,
    description: "Total harga spare parts yang digunakan"
  },
  mechanicName: { 
    type: String 
  },
  startDate: { 
    type: Date 
  },
  endDate: { 
    type: Date 
  },
  totalPrice: { 
    type: Number, 
    default: 0,
    description: "Total harga = servicePrice + sparepartsPrice"
  },
  warrantyExpiry: { 
    type: Date 
  },
  notes: { 
    type: String 
  },
  workPhotos: [{
    filename: String,           // Nama file di server
    path: String,              // Path file (local: /uploads/..., cloud: URL)
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String        // Deskripsi foto (opsional)
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("ServiceHistory", serviceHistorySchema);
