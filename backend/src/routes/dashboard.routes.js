const express = require("express");
const router = express.Router();
const tenantResolver = require("../middleware/tenantResolver");
const tenantAuth = require("../middleware/auth");
const requireTenantAdmin = require("../middleware/requireTenantAdmin");
const { getDashboardSummary, getPlanUsage, upgradePlan } = require("../controllers/dashboard.controller");

router.get("/summary", tenantResolver, tenantAuth, getDashboardSummary);
router.get("/plan-usage", tenantResolver, tenantAuth, getPlanUsage);
router.post("/upgrade-plan", tenantResolver, tenantAuth, requireTenantAdmin, upgradePlan);

module.exports = router;
