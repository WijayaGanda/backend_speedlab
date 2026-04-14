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
  upload,
  uploadWorkPhotos
} = require("../controllers/serviceHistoryController");
const { authenticate, authorize } = require("../middleware/auth");

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

// Admin route untuk upload foto service menggunakan route dengan param :id
router.post("/:id/upload-photos", authorize('admin'), upload.array('photos', 10), uploadWorkPhotos);

module.exports = router;
