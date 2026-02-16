const express = require("express");
const router = express.Router();
const tenantResolver = require("../middleware/tenantResolver")
// Controllers
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/auth.controller");

// Middleware
const tenantAuth = require("../middleware/auth");

// Routes
router.post("/register", registerUser);   // Register tenant user
router.post("/login", tenantResolver, loginUser);         // Login tenant user
router.get("/profile", tenantAuth, getUserProfile); // Get logged-in tenant user profile

module.exports = router;
