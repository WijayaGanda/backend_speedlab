const mongoose = require("mongoose");

const motorcycleSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  brand: { 
    type: String, 
    required: true 
  },
  model: { 
    type: String, 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  licensePlate: { 
    type: String, 
    required: true,
    unique: true 
  },
  color: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['Menunggu', 'Sedang Dikerjakan', 'Selesai', 'Diambil'],
    default: 'Menunggu'
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

module.exports = mongoose.model("Motorcycle", motorcycleSchema);
