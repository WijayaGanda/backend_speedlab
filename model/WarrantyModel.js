const mongoose = require("mongoose");

const warrantySchema = new mongoose.Schema({
  serviceHistoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ServiceHistory", 
    required: true 
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
  claimDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  complaint: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['Menunggu Verifikasi', 'Diterima', 'Ditolak'],
    default: 'Menunggu Verifikasi'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  notes: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Warranty", warrantySchema);
