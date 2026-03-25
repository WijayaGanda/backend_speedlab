const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// Route khusus untuk Midtrans (Webhook) - HARUS DI ATAS authenticate karena dipanggil oleh Midtrans
router.post('/webhook', paymentController.handleWebhook);

// Semua route payment di bawah ini memerlukan authentication
router.use(authenticate);

// Route dari Flutter untuk minta URL Pembayaran (Customer & Admin)
router.post('/create', paymentController.createPayment);

// Route untuk cek status payment (Customer & Admin)
router.get('/status/:bookingId', paymentController.checkPaymentStatus);

// Route untuk melihat riwayat payment (Customer: miliknya saja, Admin: semua)
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;