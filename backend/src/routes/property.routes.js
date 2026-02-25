const express = require("express");
const tenantResolver = require("../middleware/tenantResolver");
const tenantAuth = require("../middleware/auth");
const requireTenantAdmin = require("../middleware/requireTenantAdmin");
const upload = require("../middleware/upload");

const {
  listProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyCover,
  uploadPropertyGallery,
} = require("../controllers/property.controller");

const router = express.Router();

router.get("/", tenantResolver, tenantAuth, requireTenantAdmin, listProperties);
router.post("/", tenantResolver, tenantAuth, requireTenantAdmin, createProperty);
router.put("/:id", tenantResolver, tenantAuth, requireTenantAdmin, updateProperty);
router.delete("/:id", tenantResolver, tenantAuth, requireTenantAdmin, deleteProperty);
router.post(
  "/:id/cover",
  tenantResolver,
  tenantAuth,
  requireTenantAdmin,
  upload.single("file"),
  uploadPropertyCover
);

router.post(
  "/:id/gallery",
  tenantResolver,
  tenantAuth,
  requireTenantAdmin,
  upload.array("files", 12),
  uploadPropertyGallery
);

module.exports = router;
