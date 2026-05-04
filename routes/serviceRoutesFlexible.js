const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const serviceControllerFlexible = require("../controllers/serviceControllerFlexible");
const auth = require("../middleware/auth");

// ============================================
// OLD ENDPOINTS (untuk backward compatibility)
// ============================================

// Get all services (legacy)
router.get("/", serviceController.getAllServices);

// Get service by ID (legacy)
router.get("/:id", serviceController.getServiceById);

// Create service (legacy)
router.post("/", auth, serviceController.createService);

// Update service (legacy)
router.put("/:id", auth, serviceController.updateService);

// Delete service (legacy)
router.delete("/:id", auth, serviceController.deleteService);

// ============================================
// NEW ENDPOINTS (Flexible Service System)
// ============================================

/**
 * CREATE SERVICE dengan Kategori, Varian, dan Add-ons
 * POST /api/service/flexible/create
 * 
 * Body:
 * {
 *   "name": "Remap ECU Honda CBR",
 *   "description": "...",
 *   "category": "REMAP",
 *   "basePrice": 1650000,
 *   "variants": [
 *     { "name": "CBR Non-SP", "priceModifier": 0, "description": "" },
 *     { "name": "CBR SP", "priceModifier": 550000, "description": "" }
 *   ],
 *   "availableAddons": [
 *     {
 *       "name": "Dyno",
 *       "price": 250000,
 *       "type": "OPTIONAL",
 *       "description": "Include dyno hingga selesai"
 *     }
 *   ],
 *   "estimatedDuration": 120,
 *   "isWaitable": true
 * }
 */
router.post("/flexible/create", auth, serviceControllerFlexible.createServiceWithVariants);

/**
 * GET ALL SERVICES dengan Varian & Add-ons
 * GET /api/service/flexible/list/all
 * Query: ?isActive=true&category=REMAP
 */
router.get("/flexible/list/all", serviceControllerFlexible.getAllServicesWithDetails);

/**
 * GET SERVICE BY ID (detail lengkap)
 * GET /api/service/flexible/:id
 */
router.get("/flexible/:id", serviceControllerFlexible.getServiceById);

/**
 * UPDATE SERVICE (termasuk varian & add-ons)
 * PUT /api/service/flexible/:id
 */
router.put("/flexible/:id", auth, serviceControllerFlexible.updateService);

/**
 * DELETE SERVICE
 * DELETE /api/service/flexible/:id
 */
router.delete("/flexible/:id", auth, serviceControllerFlexible.deleteService);

// ==========================================
// VARIANT MANAGEMENT
// ==========================================

/**
 * ADD VARIANT ke Service
 * POST /api/service/flexible/:id/variant
 * 
 * Body:
 * {
 *   "name": "CBR SP",
 *   "priceModifier": 550000,
 *   "description": "Variant untuk CBR SP"
 * }
 */
router.post("/flexible/:id/variant", auth, serviceControllerFlexible.addVariantToService);

/**
 * UPDATE VARIANT di Service
 * PUT /api/service/flexible/:serviceId/variant/:variantName
 * 
 * Body:
 * {
 *   "newName": "CBR SP Updated",
 *   "priceModifier": 600000,
 *   "description": "Updated description"
 * }
 */
router.put("/flexible/:serviceId/variant/:variantName", auth, serviceControllerFlexible.updateVariantInService);

/**
 * DELETE VARIANT dari Service
 * DELETE /api/service/flexible/:serviceId/variant/:variantName
 */
router.delete("/flexible/:serviceId/variant/:variantName", auth, serviceControllerFlexible.deleteVariantFromService);

// ==========================================
// ADD-ON MANAGEMENT
// ==========================================

/**
 * ADD ADD-ON ke Service
 * POST /api/service/flexible/:id/addon
 * 
 * Body:
 * {
 *   "name": "Dyno",
 *   "price": 250000,
 *   "type": "OPTIONAL",
 *   "description": "Include dyno hingga selesai",
 *   "maxQuantity": 1
 * }
 */
router.post("/flexible/:id/addon", auth, serviceControllerFlexible.addAddonToService);

/**
 * UPDATE ADD-ON di Service
 * PUT /api/service/flexible/:serviceId/addon/:addonId
 * 
 * Body:
 * {
 *   "name": "Dyno Updated",
 *   "price": 300000,
 *   "type": "OPTIONAL",
 *   "description": "Updated description",
 *   "maxQuantity": 2
 * }
 */
router.put("/flexible/:serviceId/addon/:addonId", auth, serviceControllerFlexible.updateAddonInService);

/**
 * DELETE ADD-ON dari Service
 * DELETE /api/service/flexible/:serviceId/addon/:addonId
 */
router.delete("/flexible/:serviceId/addon/:addonId", auth, serviceControllerFlexible.deleteAddonFromService);

module.exports = router;
