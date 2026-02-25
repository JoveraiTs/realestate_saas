const { connectTenantDB } = require("../utils/tenantDb");
const leadSchema = require("../models/Lead");
const propertySchema = require("../models/Property");
const agentSchema = require("../models/Agent");

const getTenantModel = (connection, name, schema) => connection.models[name] || connection.model(name, schema);

exports.getPublicWebsiteData = async (req, res) => {
  try {
    const tenant = req.tenant;

    return res.status(200).json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        theme: tenant.websiteTheme,
        plan: tenant.plan,
        seo: tenant.seo,
        website: tenant.website,
      },
      pages: ["home", "properties", "agents", "about", "contact"],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.captureLead = async (req, res) => {
  try {
    const tenant = req.tenant;
    const { name, email, phone, message, sourcePage } = req.body;

    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: "Name and either email or phone are required" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Lead = tenantConn.model("Lead", leadSchema);

    const lead = await Lead.create({
      name,
      email,
      phone,
      message,
      sourcePage: sourcePage || "contact",
      tenant: tenant._id,
      status: "new",
    });

    return res.status(201).json({
      message: "Lead submitted successfully",
      leadId: lead._id,
    });
  } catch (error) {
    console.error("❌ Lead capture error:", error.message);
    return res.status(500).json({ error: "Failed to submit lead" });
  }
};

exports.getPublicProperties = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const properties = await Property.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("title coverPhotoUrl gallery category city location price listingType bedrooms bathrooms area areaUnit createdAt");

    return res.status(200).json({ properties });
  } catch (error) {
    console.error("❌ Public properties error:", error.message);
    return res.status(500).json({ error: "Failed to fetch properties" });
  }
};

exports.getPublicPropertyById = async (req, res) => {
  try {
    const tenant = req.tenant;
    const { id } = req.params;

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);

    const property = await Property.findOne({ _id: id, status: "published" })
      .select("title coverPhotoUrl gallery category city location price description listingType propertyId bedrooms bathrooms garage area areaUnit address state country zip videoUrl features documents status createdAt")
      .lean();

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json({ property });
  } catch (error) {
    console.error("❌ Public property by id error:", error.message);
    return res.status(500).json({ error: "Failed to fetch property" });
  }
};

exports.getPublicAgents = async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Agent = getTenantModel(tenantConn, "Agent", agentSchema);

    const agents = await Agent.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("name photoUrl whatsappBusinessNumber specialization experience bio status createdAt");

    return res.status(200).json({ agents });
  } catch (error) {
    console.error("❌ Public agents error:", error.message);
    return res.status(500).json({ error: "Failed to fetch agents" });
  }
};
