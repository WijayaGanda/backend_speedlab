const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route dari Flutter untuk minta URL Pembayaran
router.post('/create', paymentController.createPayment);

// Route khusus untuk Midtrans (Webhook)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;