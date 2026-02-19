const express = require("express");
const router = express.Router();
const { 
  createMotorcycle,
  getAllMotorcycles,
  getUserMotorcycles,
  getMotorcycleById,
  updateMotorcycle,
  updateMotorcycleStatus,
  deleteMotorcycle,
  getMotorcycleStats
} = require("../controllers/motorcycleController");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Statistics (untuk admin/pemilik - untuk grafik)
router.get("/stats/summary", authorize('admin', 'pemilik'), getMotorcycleStats);

// Customer routes
router.post("/", authorize('pelanggan'), createMotorcycle);
router.get("/my-motorcycles", authorize('pelanggan'), getUserMotorcycles);

// Admin routes
router.get("/", authorize('admin', 'pemilik'), getAllMotorcycles);
router.get("/:id", getMotorcycleById);
router.put("/:id", updateMotorcycle);
router.patch("/:id/status", authorize('admin'), updateMotorcycleStatus);
router.delete("/:id", authorize('admin'), deleteMotorcycle);

module.exports = router;
