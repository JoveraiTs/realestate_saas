const express = require("express");
const masterAuth = require("../middleware/masterAuth");
const {
  getPublicSaasConfig,
  getAdminSaasConfig,
  updateAdminSaasConfig,
} = require("../controllers/saas.controller");

const router = express.Router();

router.get("/public", getPublicSaasConfig);
router.get("/admin", masterAuth, getAdminSaasConfig);
router.put("/admin", masterAuth, updateAdminSaasConfig);

module.exports = router;
