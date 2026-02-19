const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // untuk login manual (bukan google)
  phone: { type: String },
  address: { type: String },
  avatar: { type: String },
  role: {
    type: String,
    enum: ['pelanggan', 'admin', 'pemilik'],
    default: 'pelanggan'
  },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
