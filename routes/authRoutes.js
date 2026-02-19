const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  googleLogin,
  getProfile, 
  updateProfile,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

module.exports = router;
