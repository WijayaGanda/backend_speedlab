const express = require("express");
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
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendBroadcastNotification
} = require("../controllers/notificationController");
const { authenticate, authorize } = require("../middleware/auth");

// Public routes (no authentication)
router.post("/register-device", authenticate, registerDevice);
router.post("/unregister-device", authenticate, unregisterDevice);

// User routes (authenticated)
router.get("/", authenticate, getNotifications);
router.get("/:id", authenticate, getNotificationById);
router.patch("/:id/read", authenticate, markAsRead);
router.patch("/read/all", authenticate, markAllAsRead);
router.delete("/:id", authenticate, deleteNotification);
router.delete("/delete/all", authenticate, deleteAllNotifications);

// Admin routes (authenticated + admin/pemilik only)
router.post("/send/user", authenticate, authorize('admin', 'pemilik'), sendNotificationToUser);
router.post("/send/multiple", authenticate, authorize('admin', 'pemilik'), sendNotificationToMultipleUsers);
router.post("/send/broadcast", authenticate, authorize('admin', 'pemilik'), sendBroadcastNotification);

module.exports = router;
