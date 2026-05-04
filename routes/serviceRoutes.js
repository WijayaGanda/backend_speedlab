const express = require("express");
const router = express.Router();
const { 
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  addVariant,
  updateVariant,
  deleteVariant,
  addAddon,
  updateAddon,
  deleteAddon,
  createServiceWithDetails
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

// ========== CREATE SERVICE WITH VARIANTS & ADDONS IN ONE REQUEST ==========
// POST /api/service/create-full - Buat service sekaligus tambah variants dan addons
router.post("/create-full", createServiceWithDetails);

// ========== VARIANT MANAGEMENT ROUTES ==========
// POST /api/service/:id/variants - Add variant
router.post("/:id/variants", addVariant);
// PUT /api/service/:id/variants/:variantName - Update variant
router.put("/:id/variants/:variantName", updateVariant);
// DELETE /api/service/:id/variants/:variantName - Delete variant
router.delete("/:id/variants/:variantName", deleteVariant);

// ========== ADDON MANAGEMENT ROUTES ==========
// POST /api/service/:id/addons - Add addon
router.post("/:id/addons", addAddon);
// PUT /api/service/:id/addons/:addonId - Update addon
router.put("/:id/addons/:addonId", updateAddon);
// DELETE /api/service/:id/addons/:addonId - Delete addon
router.delete("/:id/addons/:addonId", deleteAddon);

module.exports = router;
