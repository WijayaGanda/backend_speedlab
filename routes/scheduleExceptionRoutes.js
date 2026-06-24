const express = require('express');
const router = express.Router();
const scheduleExceptionController = require('../controllers/scheduleExceptionController');

router.get('/', scheduleExceptionController.getExceptionByDate);
router.post('/save', scheduleExceptionController.saveExceptionDate);

module.exports = router;