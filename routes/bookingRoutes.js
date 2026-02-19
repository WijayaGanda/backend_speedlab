const express = require("express");
const router = express.Router();
const { 
  createBooking,
  getAllBookings,
  getUserBookings,
  getBookingById,
  verifyBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getBookingStats
} = require("../controllers/bookingController");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Statistics (untuk admin/pemilik - untuk grafik)
router.get("/stats/summary", authorize('admin', 'pemilik'), getBookingStats);

// Customer routes
router.post("/", authorize('pelanggan'), createBooking);
router.get("/my-bookings", authorize('pelanggan'), getUserBookings);

// Admin routes
router.get("/", authorize('admin', 'pemilik'), getAllBookings);
router.get("/:id", getBookingById);
router.patch("/:id/verify", authorize('admin'), verifyBooking);
router.patch("/:id/status", authorize('admin'), updateBookingStatus);
router.put("/:id", authorize('admin'), updateBooking);
router.delete("/:id", authorize('admin'), deleteBooking);

module.exports = router;
