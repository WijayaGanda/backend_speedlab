const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const bookingControllerFlexible = require("../controllers/bookingControllerFlexible");
const auth = require("../middleware/auth");

// ============================================
// OLD ENDPOINTS (untuk backward compatibility)
// ============================================

// Get all bookings
router.get("/", auth, bookingController.getAllBookings);

// Get single booking
router.get("/:id", auth, bookingController.getBookingById);

// Update booking status
router.put("/:id/status", auth, bookingController.updateBookingStatus);

// ============================================
// NEW ENDPOINTS (Flexible Service System)
// ============================================

/**
 * CREATE BOOKING dengan Layanan Fleksibel
 * POST /api/booking/flexible/create
 * 
 * Body:
 * {
 *   "userId": "...",
 *   "motorcycleId": "...",
 *   "bookingDate": "2026-05-15",
 *   "bookingTime": "09:00",
 *   "complaint": "...",
 *   "bookingServices": [
 *     {
 *       "serviceId": "...",
 *       "selectedVariant": { "name": "...", "priceModifier": ... },
 *       "selectedAddons": [
 *         { "addonId": "...", "quantity": 1 }
 *       ]
 *     }
 *   ],
 *   "sparepartsPrice": 0
 * }
 */
router.post("/flexible/create", auth, bookingControllerFlexible.createBookingWithFlexibleService);

/**
 * GET BOOKING dengan Detail Breakdown
 * GET /api/booking/flexible/:id
 */
router.get("/flexible/:id", auth, bookingControllerFlexible.getBookingWithDetails);

/**
 * UPDATE BOOKING Services (ubah layanan/varian/addon)
 * PUT /api/booking/flexible/:bookingId/services
 * 
 * Body:
 * {
 *   "bookingServices": [...],
 *   "sparepartsPrice": 0
 * }
 */
router.put("/flexible/:bookingId/services", auth, bookingControllerFlexible.updateBookingServices);

/**
 * GET ALL BOOKINGS dengan Detail Summary
 * GET /api/booking/flexible/list/all
 * Query: ?status=...&userId=...&sortBy=...
 */
router.get("/flexible/list/all", auth, bookingControllerFlexible.getAllBookings);

/**
 * GET BOOKING DETAILS - Breakdown harga per item
 * GET /api/booking/flexible/:bookingId/breakdown
 */
router.get("/flexible/:bookingId/breakdown", auth, bookingControllerFlexible.getBookingDetailBreakdown);

module.exports = router;
