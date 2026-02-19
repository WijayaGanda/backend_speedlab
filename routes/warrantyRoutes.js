const express = require("express");
const router = express.Router();
const { 
  createWarrantyClaim,
  getAllWarrantyClaims,
  getUserWarrantyClaims,
  getWarrantyClaimById,
  verifyWarrantyClaim,
  deleteWarrantyClaim
} = require("../controllers/warrantyController");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post("/", authorize('pelanggan'), createWarrantyClaim);
router.get("/my-claims", authorize('pelanggan'), getUserWarrantyClaims);

// Admin routes
router.get("/", authorize('admin', 'pemilik'), getAllWarrantyClaims);
router.get("/:id", getWarrantyClaimById);
router.patch("/:id/verify", authorize('admin'), verifyWarrantyClaim);
router.delete("/:id", authorize('admin'), deleteWarrantyClaim);

module.exports = router;
