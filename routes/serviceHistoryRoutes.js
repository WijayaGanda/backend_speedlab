const express = require("express");
const router = express.Router();
const { 
  createServiceHistory,
  getAllServiceHistories,
  getUserServiceHistories,
  getMotorcycleServiceHistories,
  getServiceHistoryById,
  getServiceHistoryByBookingId,
  updateServiceHistory,
  deleteServiceHistory,
  uploadWorkPhotos,
  deleteWorkPhoto,
  updatePhotoDescription
} = require("../controllers/serviceHistoryController");
const { authenticate, authorize } = require("../middleware/auth");
const { uploadServiceHistory } = require("../middleware/uploadMiddleware");

// All routes require authentication
router.use(authenticate);

// Customer routes
router.get("/my-history", authorize('pelanggan'), getUserServiceHistories);
router.get("/motorcycle/:motorcycleId", getMotorcycleServiceHistories);
router.get("/booking/:bookingId", getServiceHistoryByBookingId);

// Admin routes
router.get("/", authorize('admin', 'pemilik'), getAllServiceHistories);
router.get("/:id", getServiceHistoryById);
router.post("/", authorize('admin'), createServiceHistory);
router.put("/:id", authorize('admin'), updateServiceHistory);
router.delete("/:id", authorize('admin'), deleteServiceHistory);

// Photo upload routes (Admin only)
router.post("/:serviceHistoryId/upload-photos", authorize('admin'), uploadServiceHistory.array('photos', 10), uploadWorkPhotos);
router.delete("/:serviceHistoryId/photos/:photoIndex", authorize('admin'), deleteWorkPhoto);
router.put("/:serviceHistoryId/photos/:photoIndex/description", authorize('admin'), updatePhotoDescription);

module.exports = router;
