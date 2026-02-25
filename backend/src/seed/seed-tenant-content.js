require("dotenv").config();

const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const PropertySchema = require("../models/Property");
const AgentSchema = require("../models/Agent");

const mongoUri = process.env.MONGO_MAIN_URI || "mongodb://127.0.0.1:27017/master_realestate_saas";

const args = process.argv.slice(2);
const getArg = (name) => {
  const raw = args.find((item) => item.startsWith(`--${name}=`));
  if (!raw) return "";
  return raw.split("=").slice(1).join("=");
};

const subdomain = getArg("subdomain");
const domain = getArg("domain");

const pickTenant = async () => {
  if (subdomain) {
    return Tenant.findOne({ subdomain: String(subdomain).trim().toLowerCase() });
  }
  if (domain) {
    return Tenant.findOne({ domain: String(domain).trim().toLowerCase() });
  }
  return null;
};

const seed = async () => {
  if (!subdomain && !domain) {
    console.error("❌ Missing required argument: --subdomain=... or --domain=...");
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(mongoUri);

  const tenant = await pickTenant();
  if (!tenant) {
    console.error("❌ Tenant not found");
    process.exitCode = 1;
    return;
  }

  const tenantConn = await connectTenantDB(tenant.databaseName);
  const Property = tenantConn.models.Property || tenantConn.model("Property", PropertySchema);
  const Agent = tenantConn.models.Agent || tenantConn.model("Agent", AgentSchema);

  const [propertyCount, agentCount] = await Promise.all([
    Property.countDocuments(),
    Agent.countDocuments(),
  ]);

  const demoPropertyCovers = [
    "https://www.figma.com/api/mcp/asset/fc8026a7-0b7d-4f33-b4d6-5286925f5666",
    "https://www.figma.com/api/mcp/asset/f4bb4880-3ce5-47b6-bf3c-77b3cff3c4a4",
    "https://www.figma.com/api/mcp/asset/2d55dcbb-909c-40ca-9e77-655e403dd9cb",
  ];

  const demoAgentPhotos = [
    "https://www.figma.com/api/mcp/asset/b4e4d41b-c862-4fea-8286-c70a816d379d",
    "https://www.figma.com/api/mcp/asset/dee5112d-95d1-4375-a2ff-888188c5b873",
    "https://www.figma.com/api/mcp/asset/c609f747-0cdd-4771-9c98-988b00c23f8b",
    "https://www.figma.com/api/mcp/asset/74b2d466-26da-4f2d-9d2f-10f526acfd28",
  ];

  if (propertyCount === 0) {
    await Property.insertMany(
      [
        {
          title: "Marina View Apartment",
          category: "Apartment",
          city: "Dubai",
          location: "Dubai Marina",
          price: "AED 2,350,000",
          propertyId: "PR-1001",
          bedrooms: 2,
          bathrooms: 2,
          garage: 1,
          area: 1250,
          areaUnit: "sqft",
          address: "Dubai Marina",
          state: "Dubai",
          country: "UAE",
          zip: "00000",
          videoUrl: "",
          listingType: "rent",
          features: ["Wifi", "Smoke alarm", "Fire Extinguisher"],
          documents: [],
          description: `${tenant.name} listed a premium 2BR apartment with marina views.`,
          coverPhotoUrl: demoPropertyCovers[0],
          gallery: [demoPropertyCovers[0]],
          status: "published",
          tenant: tenant._id,
        },
        {
          title: "Palm Signature Villa",
          category: "Villa",
          city: "Dubai",
          location: "Palm Jumeirah",
          price: "AED 11,800,000",
          propertyId: "PR-1002",
          bedrooms: 4,
          bathrooms: 3,
          garage: 2,
          area: 5200,
          areaUnit: "sqft",
          address: "Palm Jumeirah",
          state: "Dubai",
          country: "UAE",
          zip: "00000",
          videoUrl: "",
          listingType: "sale",
          features: ["CCTV", "Fire alarm", "Security camera", "Smoke alarm"],
          documents: [],
          description: `${tenant.name} showcased a luxury villa with private beach access.`,
          coverPhotoUrl: demoPropertyCovers[1],
          gallery: [demoPropertyCovers[1]],
          status: "published",
          tenant: tenant._id,
        },
        {
          title: "Al Hamra Townhouse",
          category: "Town House",
          city: "Ras Al Khaimah",
          location: "Al Hamra",
          price: "AED 1,450,000",
          propertyId: "PR-1003",
          bedrooms: 3,
          bathrooms: 2,
          garage: 1,
          area: 2100,
          areaUnit: "sqft",
          address: "Al Hamra",
          state: "Ras Al Khaimah",
          country: "UAE",
          zip: "00000",
          videoUrl: "",
          listingType: "off_plan",
          features: ["Notifications", "Daily Cleaning", "Wifi"],
          documents: [],
          description: `Modern townhouse in Al Hamra community.`,
          coverPhotoUrl: demoPropertyCovers[2],
          gallery: [demoPropertyCovers[2]],
          status: "published",
          tenant: tenant._id,
        },
      ],
      { ordered: false }
    );
    console.log("✅ Seeded demo properties");
  } else {
    console.log(`ℹ️ Properties already exist (${propertyCount}), skipping`);
  }

  if (agentCount === 0) {
    const normalizeWhatsApp = (value) => {
      const digits = String(value || "").replace(/[^0-9]/g, "");
      if (!digits) return "971542230777";
      if (digits.startsWith("971") && digits.length >= 11) return digits;
      if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) return `971${digits.slice(1)}`;
      if (digits.length === 9 && digits.startsWith("5")) return `971${digits}`;
      return digits;
    };

    const defaultWhatsApp = normalizeWhatsApp(tenant.phone || "+971 54 223 0777");
    await Agent.insertMany(
      [
        {
          name: "Senior Property Advisor",
          photoUrl: demoAgentPhotos[0],
          whatsappBusinessNumber: defaultWhatsApp,
          specialization: "Luxury Residential",
          experience: "8+ years",
          bio: `${tenant.name} advisor for premium apartments and penthouses.`,
          status: "active",
          tenant: tenant._id,
        },
        {
          name: "Investment Consultant",
          photoUrl: demoAgentPhotos[1],
          whatsappBusinessNumber: defaultWhatsApp,
          specialization: "ROI & Portfolio",
          experience: "6+ years",
          bio: `Supports ${tenant.name} clients with high-yield investment decisions.`,
          status: "active",
          tenant: tenant._id,
        },
        {
          name: "Leasing Specialist",
          photoUrl: demoAgentPhotos[2],
          whatsappBusinessNumber: defaultWhatsApp,
          specialization: "Short-term & long-term leases",
          experience: "5+ years",
          bio: `Helps tenants secure the best rental terms quickly.`,
          status: "active",
          tenant: tenant._id,
        },
        {
          name: "Off-plan Advisor",
          photoUrl: demoAgentPhotos[3],
          whatsappBusinessNumber: defaultWhatsApp,
          specialization: "Off-plan projects",
          experience: "4+ years",
          bio: `Guides buyers through launches and payment plans.`,
          status: "active",
          tenant: tenant._id,
        },
      ],
      { ordered: false }
    );
    console.log("✅ Seeded demo agents");
  } else {
    const normalizeWhatsApp = (value) => {
      const digits = String(value || "").replace(/[^0-9]/g, "");
      if (!digits) return "971542230777";
      if (digits.startsWith("971") && digits.length >= 11) return digits;
      if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) return `971${digits.slice(1)}`;
      if (digits.length === 9 && digits.startsWith("5")) return `971${digits}`;
      return digits;
    };

    const defaultWhatsApp = normalizeWhatsApp(tenant.phone || "+971 54 223 0777");
    const result = await Agent.updateMany(
      { status: "active", $or: [{ whatsappBusinessNumber: { $exists: false } }, { whatsappBusinessNumber: "" }] },
      { $set: { whatsappBusinessNumber: defaultWhatsApp } }
    );
    if (result?.modifiedCount) {
      console.log(`✅ Backfilled WhatsApp numbers for ${result.modifiedCount} agent(s)`);
    }
    console.log(`ℹ️ Agents already exist (${agentCount}), skipping`);
  }

  await mongoose.disconnect();
  console.log("✅ Done");
};

seed().catch((error) => {
  console.error("❌ Seed failed:", error.message);
  process.exitCode = 1;
});
