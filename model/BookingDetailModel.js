const mongoose = require("mongoose");

const bookingDetailSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking",
    required: true 
  },
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Service",
    required: true 
  },
  serviceName: {
    type: String
  },
  
  // Harga Breakdown
  basePrice: {
    type: Number,
    required: true
  },
  selectedVariant: {
    name: String,
    priceModifier: Number
  },
  
  // Add-ons yang dipilih
  selectedAddons: [{
    addonId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: {
      type: Number,
      default: 1
    }
  }],

  // Breakdown Harga Final
  subtotal: {
    type: Number,
    required: true
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

module.exports = mongoose.model("BookingDetail", bookingDetailSchema);
