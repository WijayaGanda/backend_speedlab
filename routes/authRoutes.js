const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  googleLogin,
  getProfile, 
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyOtp
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOtp);
// Protected routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

module.exports = router;
