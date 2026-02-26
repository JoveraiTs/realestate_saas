const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenant.controller");
const upload = require("../middleware/upload"); // this is the multer instance
const masterAuth = require("../middleware/masterAuth");
const tenantResolver = require("../middleware/tenantResolver");
const { createRateLimiter, registrationHoneypot } = require("../middleware/antiAbuse");

const registrationLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000,
	max: 8,
	keyPrefix: "tenant-register",
	message: "Too many registration attempts. Please try again later.",
});

const precheckLimiter = createRateLimiter({
	windowMs: 10 * 60 * 1000,
	max: 40,
	keyPrefix: "tenant-precheck",
	message: "Too many availability checks. Please try again later.",
});

const websiteLookupLimiter = createRateLimiter({
	windowMs: 10 * 60 * 1000,
	max: 30,
	keyPrefix: "tenant-lookup",
	message: "Too many website lookup attempts. Please try again later.",
});

// Tenant registration
router.post("/register", registrationLimiter, registrationHoneypot, upload.single("logo"), tenantController.registerTenant); // ✅ correct
router.get("/precheck", precheckLimiter, tenantController.precheckRegistration);
router.get("/find-website", websiteLookupLimiter, tenantController.findWebsiteByEmail);
router.get("/top-agencies", tenantController.getTopAgencies);
router.get("/resolve", tenantResolver, tenantController.resolveTenant);

router.get("/pending", masterAuth, tenantController.getPendingTenants);
router.put("/approve/:id", masterAuth, tenantController.approveTenant);
router.post("/resend-onboarding/:id", masterAuth, tenantController.resendAdminOnboarding);
router.put("/reject/:id", masterAuth, tenantController.rejectTenant);
router.put("/custom-domain/:id", masterAuth, tenantController.updateCustomDomain);
router.put("/verify-domain/:id", masterAuth, tenantController.verifyCustomDomain);

router.get("/", masterAuth, tenantController.getAllTenants);
router.get("/:id", masterAuth, tenantController.getTenantById);
router.put("/:id", masterAuth, upload.single("logo"), tenantController.updateTenant);
router.delete("/:id", masterAuth, tenantController.deleteTenant);

module.exports = router;
