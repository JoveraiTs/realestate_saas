const mongoose = require("mongoose");
const { connectTenantDB } = require("../utils/tenantDb");
const propertySchema = require("../models/Property");
const { uploadToMinio, getPublicUrl } = require("../utils/minio");

const getTenantModel = (connection, name, schema) => connection.models[name] || connection.model(name, schema);

const trimString = (value) => String(value || "").trim();

const toSafeInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(parsed, 100000000));
};

const sanitizeDocuments = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const doc = item && typeof item === "object" ? item : {};
      const name = trimString(doc.name);
      const url = trimString(doc.url);
      if (!name || !url) return null;
      return { name, url };
    })
    .filter(Boolean)
    .slice(0, 20);
};

const sanitizePropertyPayload = (payload = {}) => {
  const input = payload && typeof payload === "object" ? payload : {};
  const allowedStatus = ["draft", "published", "archived"];
  const status = trimString(input.status).toLowerCase();
  const allowedListingTypes = ["sale", "rent", "off_plan"];
  const listingType = trimString(input.listingType).toLowerCase();

  return {
    title: trimString(input.title),
    description: trimString(input.description),
    listingType: allowedListingTypes.includes(listingType) ? listingType : undefined,
    price: trimString(input.price),
    location: trimString(input.location),
    city: trimString(input.city),
    category: trimString(input.category),
    coverPhotoUrl: trimString(input.coverPhotoUrl),
    gallery: Array.isArray(input.gallery)
      ? input.gallery.map((item) => trimString(item)).filter(Boolean).slice(0, 30)
      : [],

    propertyId: trimString(input.propertyId),
    bedrooms: toSafeInt(input.bedrooms, 0),
    bathrooms: toSafeInt(input.bathrooms, 0),
    garage: toSafeInt(input.garage, 0),
    area: toSafeInt(input.area, 0),
    areaUnit: trimString(input.areaUnit) || "sqft",

    address: trimString(input.address),
    state: trimString(input.state),
    country: trimString(input.country),
    zip: trimString(input.zip),

    videoUrl: trimString(input.videoUrl),
    features: Array.isArray(input.features)
      ? input.features.map((item) => trimString(item)).filter(Boolean).slice(0, 50)
      : typeof input.features === "string"
        ? String(input.features)
            .split(",")
            .map((item) => trimString(item))
            .filter(Boolean)
            .slice(0, 50)
        : [],
    documents: sanitizeDocuments(input.documents),
    status: allowedStatus.includes(status) ? status : undefined,
  };
};

exports.listProperties = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const status = trimString(req.query.status).toLowerCase();
    const query = {};
    if (["draft", "published", "archived"].includes(status)) {
      query.status = status;
    }

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.status(200).json({ properties });
  } catch (error) {
    console.error("❌ List properties error:", error.message);
    return res.status(500).json({ error: "Failed to fetch properties" });
  }
};

exports.createProperty = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const sanitized = sanitizePropertyPayload(req.body);
    if (!sanitized.title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const doc = {
      title: sanitized.title,
      description: sanitized.description,
      price: sanitized.price,
      location: sanitized.location,
      city: sanitized.city,
      category: sanitized.category,
      coverPhotoUrl: sanitized.coverPhotoUrl,
      gallery: sanitized.gallery,

      listingType: sanitized.listingType || "sale",

      propertyId: sanitized.propertyId,
      bedrooms: sanitized.bedrooms,
      bathrooms: sanitized.bathrooms,
      garage: sanitized.garage,
      area: sanitized.area,
      areaUnit: sanitized.areaUnit,
      address: sanitized.address,
      state: sanitized.state,
      country: sanitized.country,
      zip: sanitized.zip,
      videoUrl: sanitized.videoUrl,
      features: sanitized.features,
      documents: sanitized.documents,
      status: sanitized.status || "published",
      tenant: tenant._id,
    };

    const created = await Property.create(doc);
    return res.status(201).json({ message: "Property created", property: created });
  } catch (error) {
    console.error("❌ Create property error:", error.message);
    return res.status(500).json({ error: "Failed to create property" });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const tenant = req.tenant;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid property id" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const sanitized = sanitizePropertyPayload(req.body);
    const $set = {};

    for (const [key, value] of Object.entries(sanitized)) {
      if (key === "status" && value === undefined) continue;
      if (key === "listingType" && value === undefined) continue;
      if (key === "gallery") {
        if (Array.isArray(req.body?.gallery)) $set.gallery = value;
        continue;
      }

      if (key === "features") {
        if (Array.isArray(req.body?.features) || typeof req.body?.features === "string") {
          $set.features = value;
        }
        continue;
      }

      if (key === "documents") {
        if (Array.isArray(req.body?.documents)) {
          $set.documents = value;
        }
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
        $set[key] = value;
      }
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const updated = await Property.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json({ message: "Property updated", property: updated });
  } catch (error) {
    console.error("❌ Update property error:", error.message);
    return res.status(500).json({ error: "Failed to update property" });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const tenant = req.tenant;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid property id" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const deleted = await Property.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json({ message: "Property deleted" });
  } catch (error) {
    console.error("❌ Delete property error:", error.message);
    return res.status(500).json({ error: "Failed to delete property" });
  }
};

exports.uploadPropertyCover = async (req, res) => {
  try {
    const tenant = req.tenant;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid property id" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const objectKey = await uploadToMinio(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "properties/covers"
    );

    const publicUrl = getPublicUrl(objectKey);
    property.coverPhotoUrl = publicUrl || "";
    await property.save();

    return res.status(200).json({
      message: "Cover photo uploaded",
      coverPhotoUrl: property.coverPhotoUrl,
      property,
    });
  } catch (error) {
    console.error("❌ Upload property cover error:", error.message);
    return res.status(500).json({ error: "Failed to upload cover photo" });
  }
};

exports.uploadPropertyGallery = async (req, res) => {
  try {
    const tenant = req.tenant;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid property id" });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const objectKey = await uploadToMinio(
          file.buffer,
          file.originalname,
          file.mimetype,
          "properties/gallery"
        );
        return getPublicUrl(objectKey);
      })
    );

    const nextGallery = [...(Array.isArray(property.gallery) ? property.gallery : []), ...uploadedUrls]
      .map((item) => trimString(item))
      .filter(Boolean);

    // Deduplicate while keeping order
    const seen = new Set();
    property.gallery = nextGallery.filter((url) => {
      const key = url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);

    // If cover is missing, use first gallery image
    if (!trimString(property.coverPhotoUrl) && property.gallery.length) {
      property.coverPhotoUrl = property.gallery[0];
    }

    await property.save();

    return res.status(200).json({
      message: "Gallery uploaded",
      gallery: property.gallery,
      property,
    });
  } catch (error) {
    console.error("❌ Upload property gallery error:", error.message);
    return res.status(500).json({ error: "Failed to upload gallery" });
  }
};
