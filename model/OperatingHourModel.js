const mongoose = require('mongoose');

// Skema untuk rentang waktu (contoh: 09:00 - 11:00)
const timeSlotSchema = new mongoose.Schema({
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true }
}, { _id: false });

const operatingHourSchema = new mongoose.Schema({
  dayIndex: { 
    type: Number, 
    required: true, 
    unique: true 
  }, // 0 = Minggu, 1 = Senin, 2 = Selasa, dst.
  dayName: { 
    type: String, 
    required: true 
  },
  isOpen: { 
    type: Boolean, 
    default: true 
  },
  timeSlots: [timeSlotSchema] // Array of time slots
}, { timestamps: true });

module.exports = mongoose.model('OperatingHour', operatingHourSchema);