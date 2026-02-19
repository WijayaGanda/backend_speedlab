const express = require("express");
const router = express.Router();
const { 
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
} = require("../controllers/serviceController");
const { authenticate, authorize } = require("../middleware/auth");

// Public route - untuk pelanggan melihat menu layanan
router.get("/", getAllServices);
router.get("/:id", getServiceById);

// Admin routes - require authentication
router.use(authenticate);
router.use(authorize('admin', 'pemilik'));

router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

module.exports = router;
