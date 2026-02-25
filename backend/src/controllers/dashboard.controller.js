const { connectTenantDB } = require("../utils/tenantDb");
const leadSchema = require("../models/Lead");
const propertySchema = require("../models/Property");
const agentSchema = require("../models/Agent");
const roleSchema = require("../models/Role");
const userSchema = require("../models/User");
const { getPlanRules, normalizePlanKey, canUpgradePlan } = require("../utils/planRules");

const getTenantModel = (connection, name, schema) => connection.models[name] || connection.model(name, schema);

const normalizeRole = (roleName = "") => {
  const role = String(roleName).toLowerCase();
  if (role === "admin" || role === "super_admin") return "admin";
  if (role === "staff" || role === "agent") return "agent";
  return "agent";
};

const buildPlanUsage = async ({ tenantConn, tenant }) => {
  const User = getTenantModel(tenantConn, "User", userSchema);
  const Property = getTenantModel(tenantConn, "Property", propertySchema);

  const [usersUsed, listingsUsed] = await Promise.all([
    User.countDocuments(),
    Property.countDocuments(),
  ]);

  const rules = getPlanRules(tenant.plan);
  const customDomainsUsed = Array.isArray(tenant.customDomains) ? tenant.customDomains.length : 0;

  return {
    plan: {
      key: normalizePlanKey(tenant.plan),
      name: rules.name,
      monthlyPriceAed: rules.monthlyPriceAed,
    },
    limits: {
      maxUsers: rules.maxUsers,
      maxListings: rules.listingLimit,
      maxCustomDomains: rules.maxCustomDomains,
    },
    usage: {
      usersUsed,
      listingsUsed,
      customDomainsUsed,
    },
    remaining: {
      users: Math.max(rules.maxUsers - usersUsed, 0),
      listings: Math.max(rules.listingLimit - listingsUsed, 0),
      customDomains: Math.max(rules.maxCustomDomains - customDomainsUsed, 0),
    },
  };
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const Lead = getTenantModel(tenantConn, "Lead", leadSchema);
    const Property = getTenantModel(tenantConn, "Property", propertySchema);
    const Agent = getTenantModel(tenantConn, "Agent", agentSchema);
    const Role = getTenantModel(tenantConn, "Role", roleSchema);

    const roleDoc = user?.role ? await Role.findById(user.role).select("name").lean() : null;
    const roleName = roleDoc?.name || "Agent";
    const normalizedRole = normalizeRole(roleName);

    const baseLeadQuery = normalizedRole === "agent"
      ? { assignedTo: user._id }
      : {};

    const [
      totalProperties,
      allLocations,
      activeLeads,
      activeAgents,
      recentLeads,
      recentProperties,
      myLeadCount,
    ] = await Promise.all([
      Property.countDocuments({ status: "published" }),
      Property.find({ status: "published" }).select("city location").lean(),
      Lead.countDocuments({ status: { $in: ["new", "contacted", "qualified"] } }),
      Agent.countDocuments({ status: "active" }),
      Lead.find(baseLeadQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("name email status createdAt")
        .lean(),
      Property.find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title location price status createdAt")
        .lean(),
      Lead.countDocuments({ assignedTo: user._id }),
    ]);

    const uniqueCities = new Set(
      allLocations
        .map((item) => {
          const explicit = String(item?.city || "").trim();
          if (explicit) return explicit;
          return String(item?.location || "").split(",")[0].trim();
        })
        .filter(Boolean)
    );

    const stats = normalizedRole === "admin"
      ? {
          totalProperties,
          citiesCovered: uniqueCities.size,
          activeLeads,
          activeAgents,
        }
      : {
          assignedLeads: myLeadCount,
          visitsToday: 0,
          followUps: activeLeads,
          listings: totalProperties,
        };

    return res.status(200).json({
      role: normalizedRole,
      roleName,
      stats,
      leads: recentLeads.map((lead) => ({
        id: String(lead._id),
        name: lead.name || "Unknown",
        email: lead.email || "-",
        status: lead.status || "new",
        createdAt: lead.createdAt,
      })),
      properties: recentProperties.map((property) => ({
        id: String(property._id),
        name: property.title || "Untitled Property",
        type: property.status || "published",
        location: property.location || "-",
        price: property.price || "-",
        createdAt: property.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ Dashboard summary error:", error.message);
    return res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
};

exports.getPlanUsage = async (req, res) => {
  try {
    const tenant = req.tenant;
    const normalizedRole = normalizeRole(req.auth?.role || req.user?.role?.name || "agent");

    if (normalizedRole !== "admin") {
      return res.status(403).json({ error: "Only admin users can view plan usage" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const planUsage = await buildPlanUsage({ tenantConn, tenant });

    return res.status(200).json(planUsage);
  } catch (error) {
    console.error("❌ Plan usage error:", error.message);
    return res.status(500).json({ error: "Failed to fetch plan usage" });
  }
};

exports.upgradePlan = async (req, res) => {
  try {
    const tenant = req.tenant;
    const normalizedRole = normalizeRole(req.auth?.role || req.user?.role?.name || "agent");

    if (normalizedRole !== "admin") {
      return res.status(403).json({ error: "Only admin users can upgrade plans" });
    }

    const targetPlan = normalizePlanKey(req.body?.plan || "");
    const currentPlan = normalizePlanKey(tenant.plan);

    if (!targetPlan) {
      return res.status(400).json({ error: "Target plan is required" });
    }

    if (targetPlan === currentPlan) {
      return res.status(400).json({ error: "You are already on this plan" });
    }

    if (!canUpgradePlan(currentPlan, targetPlan)) {
      return res.status(400).json({
        error: "Only upgrades are allowed from this endpoint. Please contact support for downgrades.",
      });
    }

    const billingCycle = String(req.body?.billingCycle || "monthly").trim().toLowerCase();
    if (!["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({ error: "billingCycle must be monthly or yearly" });
    }

    tenant.plan = targetPlan;
    tenant.billingCycle = billingCycle;
    tenant.trialActive = false;
    tenant.planStartDate = new Date();

    const planDurationDays = billingCycle === "yearly" ? 365 : 30;
    tenant.planEndDate = new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000);

    await tenant.save();

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const planUsage = await buildPlanUsage({ tenantConn, tenant });

    return res.status(200).json({
      message: `Plan upgraded to ${planUsage.plan.name}`,
      planUsage,
      billingCycle: tenant.billingCycle,
      planStartDate: tenant.planStartDate,
      planEndDate: tenant.planEndDate,
    });
  } catch (error) {
    console.error("❌ Upgrade plan error:", error.message);
    return res.status(500).json({ error: "Failed to upgrade plan" });
  }
};
