const express = require("express");
const tenantResolver = require("../middleware/tenantResolver");
const {
	getPublicWebsiteData,
	captureLead,
	getPublicProperties,
	getPublicPropertyById,
	getPublicAgents,
} = require("../controllers/public.controller");

const router = express.Router();

router.get("/website", tenantResolver, getPublicWebsiteData);
router.get("/properties", tenantResolver, getPublicProperties);
router.get("/properties/:id", tenantResolver, getPublicPropertyById);
router.get("/agents", tenantResolver, getPublicAgents);
router.post("/leads", tenantResolver, captureLead);

module.exports = router;
