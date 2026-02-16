const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenant.controller");
const upload = require("../middleware/upload"); // this is the multer instance

// Tenant registration
router.post("/register", upload.single("logo"), tenantController.registerTenant); // ✅ correct

// Admin approves tenant
router.put("/approve/:id", tenantController.approveTenant);

router.put("/custom-domain/:id", tenantController.updateCustomDomain);

// Get all tenants
router.get("/", tenantController.getAllTenants);

module.exports = router;
