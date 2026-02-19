const express = require("express");
const router = express.Router();
const { 
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} = require("../controllers/employeeController");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require authentication and pemilik role
router.use(authenticate);
router.use(authorize('pemilik'));

// CRUD operations
router.post("/", createEmployee);
router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
