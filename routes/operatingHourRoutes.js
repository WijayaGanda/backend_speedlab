const express = require('express');
const router = express.Router();
const operatingHourController = require('../controllers/operatingHourController');

// GET /api/operating-hours - Mengambil semua jadwal (Bisa diakses aplikasi pelanggan & admin)
router.get('/', operatingHourController.getOperatingHours);

// PUT /api/operating-hours/:id - Mengubah jadwal hari tertentu (Khusus admin)
// Perhatikan tambahan /:id di bawah ini
router.put('/:id', operatingHourController.updateOperatingHour);

module.exports = router;