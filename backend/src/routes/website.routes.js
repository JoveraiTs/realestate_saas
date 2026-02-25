const express = require("express");
const router = express.Router();

const tenantResolver = require("../middleware/tenantResolver");
const tenantAuth = require("../middleware/auth");
const requireTenantAdmin = require("../middleware/requireTenantAdmin");

const {
  getWebsiteSettings,
  updateWebsiteSettings,
} = require("../controllers/website.controller");

router.get("/settings", tenantResolver, tenantAuth, getWebsiteSettings);
router.put("/settings", tenantResolver, tenantAuth, requireTenantAdmin, updateWebsiteSettings);

module.exports = router;
