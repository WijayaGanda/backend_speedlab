const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const connectDB = require("../lib/mongodb");

// require('../passport');

// Import routes
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const motorcycleRoutes = require("../routes/motorcycleRoutes");
const serviceRoutes = require("../routes/serviceRoutes");
const bookingRoutes = require("../routes/bookingRoutes");
const serviceHistoryRoutes = require("../routes/serviceHistoryRoutes");
const warrantyRoutes = require("../routes/warrantyRoutes");
const employeeRoutes = require("../routes/employeeRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Koneksi MongoDB
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// SESSION
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/motorcycles", motorcycleRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/service-histories", serviceHistoryRoutes);
app.use("/api/warranties", warrantyRoutes);
app.use("/api/employees", employeeRoutes);

// GOOGLE LOGIN (keep existing for backward compatibility)
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    console.log("=== USER ===");
    console.log(req.user);
    res.send("Login Google Berhasil! User: " + req.user.name);
  }
);

// GET USER
app.get("/me", (req, res) => {
  res.send(req.user);
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "SpeedLab Workshop API", 
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      motorcycles: "/api/motorcycles",
      services: "/api/services",
      bookings: "/api/bookings",
      serviceHistories: "/api/service-histories",
      warranties: "/api/warranties",
      employees: "/api/employees"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: "Something went wrong!", 
    error: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Endpoint not found" 
  });
});

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT}...`);
// });

module.exports = app;
