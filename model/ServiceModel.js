const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  // Informasi Dasar
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  category: {
    type: String,
    enum: ['REMAP', 'SERVICE', 'RENTAL_DYNO', 'TUNING'],
    default: 'SERVICE'
  },

  // Harga - Support BOTH format lama dan baru
  basePrice: { 
    type: Number,
    required: true 
  },
  price: {
    type: Number,
    // Virtual field - akan auto-sync dengan basePrice untuk backward compatibility
    get() {
      return this.basePrice;
    },
    set(value) {
      this.basePrice = value;
    }
  },

  // Varian Layanan (BARU: untuk harga berbeda berdasarkan kondisi)
  variants: [{
    name: {
      type: String,
      required: true
    },
    priceModifier: {
      type: Number,
      default: 0
    },
    description: String
  }],

  // Add-ons (BARU: layanan tambahan yang bisa dipilih)
  availableAddons: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['OPTIONAL', 'REQUIRED'],
      default: 'OPTIONAL'
    },
    description: String,
    maxQuantity: {
      type: Number,
      default: 1
    }
  }],

  estimatedDuration: { 
    type: Number,
    default: 60 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isWaitable: { 
    type: Boolean, 
    default: true 
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

module.exports = mongoose.model("Service", serviceSchema);
