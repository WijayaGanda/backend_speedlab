const express = require('express');
const router = express.Router();
const {
  registerDevice,
  unregisterDevice,
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  sendToUser,
  sendToMultipleUsers,
  sendBroadcast
} = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/register-device', registerDevice);
router.post('/unregister-device', unregisterDevice);
router.get('/', getNotifications);
router.patch('/read/all', markAllAsRead);
router.delete('/delete/all', deleteAllNotifications);
router.patch('/:id/read', markAsRead);
router.get('/:id', getNotificationById);
router.delete('/:id', deleteNotification);

router.post('/send/user', authorize('admin', 'pemilik'), sendToUser);
router.post('/send/multiple', authorize('admin', 'pemilik'), sendToMultipleUsers);
router.post('/send/broadcast', authorize('admin', 'pemilik'), sendBroadcast);

module.exports = router;
