const mongoose = require("mongoose");

const serviceHistorySchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking", 
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
  serviceIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service" 
  }],
  complaint: { 
    type: String 
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
    required: true 
  },
  warrantyExpiry: { 
    type: Date 
  },
  notes: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("ServiceHistory", serviceHistorySchema);
