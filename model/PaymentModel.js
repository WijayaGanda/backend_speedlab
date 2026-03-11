const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // 1. Relasi ke model Booking Anda yang sudah ada
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  // 2. Relasi ke User (Opsional tapi sangat disarankan agar mudah get riwayat)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 3. ID Unik khusus untuk Midtrans (Syarat mutlak dari Midtrans)
  orderId: { 
    type: String,
    required: true,
    unique: true
  },
  // 4. Total yang harus dibayar
  grossAmount: {
    type: Number,
    required: true
  },
  // 5. Status dari Midtrans
  transactionStatus: {
    type: String,
    enum: ['pending', 'settlement', 'cancel', 'expire', 'deny', 'refund'],
    default: 'pending' // 'settlement' artinya lunas
  },
  // 6. Tipe pembayaran (Gopay, BCA VA, dll - diisi otomatis oleh Midtrans nanti)
  paymentType: {
    type: String,
    default: null
  },
  // 7. Token dan Link WebView untuk Flutter
  snapToken: {
    type: String,
    required: true
  },
  snapRedirectUrl: {
    type: String,
    required: true
  }
}, { 
  // Otomatis membuat createdAt dan updatedAt
  timestamps: true 
});

module.exports = mongoose.model('Payment', paymentSchema);