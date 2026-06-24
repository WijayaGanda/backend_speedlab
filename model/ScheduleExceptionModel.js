const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  openTime: { type: String, required: true },
  closeTime: { type: String, required: true }
}, { _id: false });

const scheduleExceptionSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true, 
    unique: true // Format wajib: "YYYY-MM-DD"
  },
  note: { 
    type: String, 
    default: "" // Contoh: "Libur Nasional", "Tutup Setengah Hari"
  },
  isOpen: { 
    type: Boolean, 
    default: false 
  },
  timeSlots: [timeSlotSchema]
}, { timestamps: true });

module.exports = mongoose.model('ScheduleException', scheduleExceptionSchema);