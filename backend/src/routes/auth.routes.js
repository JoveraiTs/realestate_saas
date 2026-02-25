const express = require("express");
const router = express.Router();
const tenantResolver = require("../middleware/tenantResolver");
const requireTenantAdmin = require("../middleware/requireTenantAdmin");
const { createRateLimiter } = require("../middleware/antiAbuse");
// Controllers
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  resetUserPassword,
  loginMasterUser,
  renderSetupPasswordForm,
  setupPasswordWithToken,
} = require("../controllers/auth.controller");

// Middleware
const tenantAuth = require("../middleware/auth");

const tenantLoginLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 25,
  keyPrefix: "tenant-login",
  message: "Too many login attempts. Please try again later.",
});

const masterLoginLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyPrefix: "master-login",
  message: "Too many super admin login attempts. Please try again later.",
});

// Routes
router.post("/master/login", masterLoginLimiter, loginMasterUser);
router.get("/setup-password-form", renderSetupPasswordForm);
router.post("/setup-password", setupPasswordWithToken);
router.post("/register", tenantResolver, tenantAuth, requireTenantAdmin, registerUser);
router.post("/login", tenantLoginLimiter, tenantResolver, loginUser);
router.get("/profile", tenantResolver, tenantAuth, getUserProfile);
router.put("/profile", tenantResolver, tenantAuth, updateUserProfile);
router.put("/reset-password", tenantResolver, tenantAuth, resetUserPassword);

module.exports = router;
