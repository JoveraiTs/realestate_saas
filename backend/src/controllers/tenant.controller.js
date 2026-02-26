const multer = require("multer");
const dns = require("node:dns").promises;
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const { uploadToMinio, getPublicUrl } = require("../utils/minio");
const emailQueue = require("../queues/email.queue");
const { getPlanRules, normalizePlanKey } = require("../utils/planRules");

const userSchema = require("../models/User");
const permissionSchema = require("../models/Permission");
const roleSchema = require("../models/Role");

const BASE_DOMAIN = (process.env.BASE_DOMAIN || "luxury-uaeproperty.com").toLowerCase();
const TRIAL_DAYS = Number(process.env.DEFAULT_TRIAL_DAYS || 14);
const SERVER_IP = (process.env.SERVER_IP || "").trim();
const JWT_SECRET = process.env.JWT_SECRET || "global_secret_key";
const ADMIN_SETUP_TOKEN_EXPIRES_IN = process.env.ADMIN_SETUP_TOKEN_EXPIRES_IN || "24h";
const AUTO_APPROVE_PLANS = new Set(["free", "trial"]);
const ALLOWED_PRODUCT_TYPES = new Set(["realestate", "ecommerce", "tourism"]);
const AUTO_APPROVE_FREE_PLAN_ENABLED = !["false", "0", "no", "off"].includes(
  String(process.env.AUTO_APPROVE_FREE_PLAN || "true").trim().toLowerCase()
);

const generateTempPassword = () => `Tmp@${crypto.randomBytes(8).toString("hex")}`;

const isAutoApprovePlan = (plan = "") =>
  AUTO_APPROVE_FREE_PLAN_ENABLED && AUTO_APPROVE_PLANS.has(String(plan).trim().toLowerCase());

const planLimitError = (message) => {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
};

const emailDeliveryError = (message) => {
  const error = new Error(message);
  error.statusCode = 503;
  return error;
};

const enqueueEmailOrThrow = async (jobName, payload) => {
  const result = await emailQueue.add(jobName, payload);
  if (result && result.skipped) {
    throw emailDeliveryError(`Email delivery is not configured: ${result.reason || "no working transport"}`);
  }
  return result;
};

const buildAdminSetupLink = ({ tenantId, adminEmail }) => {
  const setupToken = jwt.sign(
    {
      tokenType: "tenant_admin_setup",
      tenantId,
      email: adminEmail,
    },
    JWT_SECRET,
    { expiresIn: ADMIN_SETUP_TOKEN_EXPIRES_IN }
  );

  const configured = String(process.env.ADMIN_PASSWORD_SETUP_URL || "").trim().replace(/\/$/, "");
  const fallback = `https://${process.env.API_DOMAIN || `api.${BASE_DOMAIN}`}/api/auth/setup-password-form`;
  const setupBase = configured || fallback;
  const separator = setupBase.includes("?") ? "&" : "?";

  return `${setupBase}${separator}token=${encodeURIComponent(setupToken)}`;
};

const storage = multer.memoryStorage();
exports.upload = multer({ storage });

const normalizeDomain = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

const normalizePlatformDomain = (value = "") =>
  normalizeDomain(value).replace(/\.joveraits\.ae$/i, ".luxury-uaeproperty.com");

const normalizeSubdomain = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const normalizeProductType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return ALLOWED_PRODUCT_TYPES.has(normalized) ? normalized : "realestate";
};

const buildUniqueSubdomain = async (base) => {
  const cleanBase = normalizeSubdomain(base) || "tenant";
  let candidate = cleanBase;
  let suffix = 1;

  while (await Tenant.findOne({ subdomain: candidate })) {
    candidate = `${cleanBase}${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const generateDefaultPermissions = () => {
  const modules = [
    { submodule: "Users", actions: ["Access", "Create", "View", "Edit", "Delete"] },
    { submodule: "Properties", actions: ["Access", "Create", "View", "Edit", "Delete"] },
    { submodule: "Leads", actions: ["Access", "Create", "View", "Edit", "Delete"] },
    { submodule: "Agents", actions: ["Access", "Create", "View", "Edit", "Delete"] },
    { submodule: "Deals", actions: ["Access", "Create", "View", "Edit", "Delete"] },
    { submodule: "Website", actions: ["Access", "Edit", "Publish"] },
    { submodule: "SEO", actions: ["Access", "Edit"] },
  ];

  return modules.flatMap(({ submodule, actions }) => {
    const slug = submodule.toLowerCase();
    return actions.map((action) => ({
      module: "Management",
      submodule,
      action,
      name: `management.${slug}.${action.toLowerCase()}`,
      description: `${action} ${submodule}`,
    }));
  });
};

const upsertPermissions = async (Permission) => {
  const permissions = generateDefaultPermissions();

  for (const permission of permissions) {
    await Permission.updateOne(
      { name: permission.name },
      { $set: permission },
      { upsert: true }
    );
  }

  return Permission.find({ name: { $in: permissions.map((permission) => permission.name) } });
};

const provisionApprovedTenant = async ({
  tenant,
  plan,
  trialDays,
  adminName,
  adminEmail,
  adminPassword,
  customDomain,
  websiteTheme,
  seo,
  approvedBy,
}) => {
  const normalizedPlan = normalizePlanKey(plan || tenant.plan);
  const planRules = getPlanRules(normalizedPlan);

  const tenantConn = await connectTenantDB(tenant.databaseName);
  const User = tenantConn.model("User", userSchema);
  const Permission = tenantConn.model("Permission", permissionSchema);
  const Role = tenantConn.model("Role", roleSchema);

  const permissions = await upsertPermissions(Permission);

  let adminRole = await Role.findOne({ name: "Admin" });
  if (!adminRole) {
    adminRole = await Role.create({
      name: "Admin",
      description: "Tenant owner role",
      permissions: permissions.map((permission) => permission._id),
    });
  } else {
    adminRole.permissions = permissions.map((permission) => permission._id);
    await adminRole.save();
  }

  const resolvedAdminEmail = (adminEmail || tenant.email).toLowerCase();
  const resolvedAdminName = adminName || `${tenant.name} Admin`;
  const resolvedAdminPassword = String(adminPassword || "").trim() || generateTempPassword();
  const adminSetupLink = buildAdminSetupLink({
    tenantId: tenant._id,
    adminEmail: resolvedAdminEmail,
  });

  let adminUser = await User.findOne({ email: resolvedAdminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      name: resolvedAdminName,
      email: resolvedAdminEmail,
      password: resolvedAdminPassword,
      role: adminRole._id,
      tenant: tenant._id,
      emailVerified: false,
      passwordSetupRequired: true,
    });
  } else {
    adminUser.name = resolvedAdminName;
    adminUser.password = resolvedAdminPassword;
    adminUser.role = adminRole._id;
    adminUser.tenant = tenant._id;
    adminUser.isActive = true;
    adminUser.emailVerified = false;
    adminUser.passwordSetupRequired = true;
    await adminUser.save();
  }

  tenant.status = "approved";
  tenant.dbCreated = true;
  tenant.approvedAt = new Date();
  tenant.rejectedAt = undefined;
  tenant.reviewNote = "";
  tenant.approvedBy = approvedBy || undefined;

  tenant.plan = normalizedPlan;

  if (websiteTheme && ["black", "gold"].includes(String(websiteTheme).toLowerCase())) {
    tenant.websiteTheme = String(websiteTheme).toLowerCase();
  }

  if (seo && typeof seo === "object") {
    tenant.seo = {
      title: seo.title || tenant.seo?.title || "",
      description: seo.description || tenant.seo?.description || "",
      keywords: Array.isArray(seo.keywords)
        ? seo.keywords.map((item) => String(item).trim()).filter(Boolean)
        : tenant.seo?.keywords || [],
    };
  }

  const effectiveTrialDays = Number(trialDays || TRIAL_DAYS);
  tenant.trialActive = effectiveTrialDays > 0;
  tenant.planStartDate = new Date();
  tenant.planEndDate = new Date(Date.now() + effectiveTrialDays * 24 * 60 * 60 * 1000);

  if (customDomain) {
    if (planRules.maxCustomDomains < 1) {
      throw planLimitError(`${planRules.name} plan does not include custom domains. Please upgrade to Pro or Enterprise.`);
    }

    if (planRules.maxCustomDomains > 0 && tenant.customDomains.length >= planRules.maxCustomDomains) {
      throw planLimitError(`${planRules.name} plan allows up to ${planRules.maxCustomDomains} custom domain${planRules.maxCustomDomains > 1 ? "s" : ""}.`);
    }

    const normalized = normalizeDomain(customDomain);
    tenant.domain = normalized;
    if (!tenant.customDomains.includes(normalized)) {
      tenant.customDomains.push(normalized);
    }
    tenant.domainVerified = false;
  }

  await tenant.save();

  await enqueueEmailOrThrow("sendVisitorEmail", {
    to: tenant.email,
    subject: "Tenant approved - website is live",
    html: `
      <p>Hi ${tenant.name},</p>
      <p>Your tenant has been approved.</p>
      <p>Default URL: <a href="https://${tenant.subdomain}.${BASE_DOMAIN}">https://${tenant.subdomain}.${BASE_DOMAIN}</a></p>
      <p>Admin Email: ${resolvedAdminEmail}</p>
    `,
  });

  await enqueueEmailOrThrow("sendAdminOnboardingEmail", {
    to: resolvedAdminEmail,
    subject: "Confirm your admin email and create your password",
    html: `
      <p>Hi ${resolvedAdminName},</p>
      <p>Your admin account has been created for <strong>${tenant.name}</strong>.</p>
      <p>Please confirm your email and create your password using the link below:</p>
      <p><a href="${adminSetupLink}">${adminSetupLink}</a></p>
      <p><strong>Username:</strong> ${resolvedAdminEmail}</p>
      <p>This link expires in ${ADMIN_SETUP_TOKEN_EXPIRES_IN}.</p>
    `,
  });

  return {
    tenant,
    adminUser,
    onboarding: {
      adminUsername: resolvedAdminEmail,
      createPasswordLink: adminSetupLink,
    },
  };
};

const queuePendingEmails = async ({ name, email, phone, subdomain, plan, requestedDomain, productType }) => {
  await enqueueEmailOrThrow("sendVisitorEmail", {
    to: email,
    subject: "Registration received - pending approval",
    html: `
      <p>Hi ${name},</p>
      <p>Your agency signup was received and is currently pending super-admin review.</p>
      <p>We will notify you once your tenant is approved and live.</p>
    `,
  });

  if (process.env.ALERT_EMAIL) {
    await enqueueEmailOrThrow("sendAdminEmail", {
      to: process.env.ALERT_EMAIL,
      subject: `New tenant registration - ${name}`,
      html: `
        <p>A new tenant has registered and is pending approval:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone || "N/A"}</li>
          <li><strong>Requested domain:</strong> ${requestedDomain || "Not provided"}</li>
          <li><strong>Proposed subdomain:</strong> ${subdomain}.${BASE_DOMAIN}</li>
          <li><strong>Product:</strong> ${productType || "realestate"}</li>
          <li><strong>Plan:</strong> ${plan}</li>
        </ul>
      `,
    });
  }
};

const sendAdminOnboardingEmail = async ({ tenant, adminEmail, adminName }) => {
  const resolvedAdminEmail = String(adminEmail || tenant.email || "").trim().toLowerCase();
  const resolvedAdminName = String(adminName || `${tenant.name} Admin`).trim();
  const adminSetupLink = buildAdminSetupLink({
    tenantId: tenant._id,
    adminEmail: resolvedAdminEmail,
  });

  await enqueueEmailOrThrow("sendAdminOnboardingEmail", {
    to: resolvedAdminEmail,
    subject: "Confirm your admin email and create your password",
    html: `
      <p>Hi ${resolvedAdminName},</p>
      <p>Your admin account is ready for <strong>${tenant.name}</strong>.</p>
      <p>Please confirm your email and create your password using the link below:</p>
      <p><a href="${adminSetupLink}">${adminSetupLink}</a></p>
      <p><strong>Username:</strong> ${resolvedAdminEmail}</p>
      <p>This link expires in ${ADMIN_SETUP_TOKEN_EXPIRES_IN}.</p>
    `,
  });

  return {
    adminUsername: resolvedAdminEmail,
    createPasswordLink: adminSetupLink,
  };
};

exports.registerTenant = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      plan,
      productType,
      desiredDomain,
      websiteTheme,
      seoTitle,
      seoDescription,
      seoKeywords,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Agency name, email and phone are required" });
    }

    const cleanName = String(name).trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanPhone = String(phone || "").trim();

    if (cleanName.length < 2 || cleanName.length > 120) {
      return res.status(400).json({ error: "Agency name must be between 2 and 120 characters" });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      return res.status(400).json({ error: "Please provide a valid phone number" });
    }

    const subdomain = await buildUniqueSubdomain(name);

    const existingByEmail = await Tenant.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      const existingDomain =
        (Array.isArray(existingByEmail.customDomains) && existingByEmail.customDomains[0])
        || existingByEmail.domain
        || `${existingByEmail.subdomain}.${BASE_DOMAIN}`;
      return res.status(409).json({
        error: "This email is already registered",
        tenant: {
          id: existingByEmail._id,
          name: existingByEmail.name,
          email: existingByEmail.email,
          status: existingByEmail.status,
          subdomain: existingByEmail.subdomain,
          domain: existingDomain,
          websiteUrl: existingDomain ? `https://${existingDomain}` : null,
        },
      });
    }

    const requestedDomain = desiredDomain ? normalizePlatformDomain(desiredDomain) : "";
    const databaseName = `tenant_${subdomain}`;

    let logoPath = null;
    if (req.file) {
      logoPath = await uploadToMinio(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "tenants/logos"
      );
    }

    const selectedPlan = normalizePlanKey(plan || "trial");
    const selectedProductType = normalizeProductType(productType);

    const tenant = await Tenant.create({
      name,
      email: normalizedEmail,
      phone: cleanPhone,
      address,
      logo: logoPath,
      subdomain,
      domain: `${subdomain}.${BASE_DOMAIN}`,
      requestedDomain,
      databaseName,
      productType: selectedProductType,
      plan: selectedPlan,
      websiteTheme: ["black", "gold"].includes(String(websiteTheme || "").toLowerCase())
        ? String(websiteTheme).toLowerCase()
        : "black",
      seo: {
        title: seoTitle || "",
        description: seoDescription || "",
        keywords: seoKeywords
          ? String(seoKeywords)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      },
      status: "pending",
      trialActive: true,
    });

    if (isAutoApprovePlan(selectedPlan)) {
      const { adminUser, onboarding } = await provisionApprovedTenant({
        tenant,
        plan: selectedPlan,
        trialDays: TRIAL_DAYS,
        adminName: `${cleanName} Admin`,
        adminEmail: normalizedEmail,
        websiteTheme,
        seo: {
          title: seoTitle || "",
          description: seoDescription || "",
          keywords: seoKeywords
            ? String(seoKeywords)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
        },
      });

      return res.status(201).json({
        message: "Tenant registered and auto-approved for free plan",
        tenant: {
          id: tenant._id,
          name: tenant.name,
          email: tenant.email,
          status: tenant.status,
          productType: tenant.productType,
          plan: tenant.plan,
          subdomain: tenant.subdomain,
          defaultWebsite: `https://${tenant.subdomain}.${BASE_DOMAIN}`,
        },
        adminUser: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        onboarding,
      });
    }

    await queuePendingEmails({
      name,
      email,
      phone,
      subdomain,
      plan: tenant.plan,
      requestedDomain,
      productType: tenant.productType,
    });

    return res.status(201).json({
      message: "Tenant registration submitted and pending approval",
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        status: tenant.status,
        productType: tenant.productType,
        plan: tenant.plan,
        subdomain: tenant.subdomain,
        defaultWebsite: `https://${tenant.subdomain}.${BASE_DOMAIN}`,
      },
    });
  } catch (err) {
    console.error("❌ Tenant registration error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.precheckRegistration = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const subdomain = normalizeSubdomain(req.query.subdomain || "");

    if (!email && !subdomain) {
      return res.status(400).json({ error: "Email or subdomain is required" });
    }

    let emailTenant = null;
    let subdomainTenant = null;

    if (email) {
      emailTenant = await Tenant.findOne({ email }).select("name email status subdomain domain customDomains");
    }

    if (subdomain) {
      subdomainTenant = await Tenant.findOne({ subdomain }).select("name email status subdomain domain customDomains");
    }

    return res.status(200).json({
      email: {
        value: email,
        available: !emailTenant,
        tenant: emailTenant,
      },
      subdomain: {
        value: subdomain,
        available: !subdomainTenant,
        fqdn: subdomain ? `${subdomain}.${BASE_DOMAIN}` : "",
        tenant: subdomainTenant,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.findWebsiteByEmail = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required" });

    const tenant = await Tenant.findOne({ email }).select(
      "name email status subdomain domain customDomains domainVerified plan productType"
    );

    if (!tenant) {
      return res.status(404).json({ error: "No website found for this email" });
    }

    const domain =
      (Array.isArray(tenant.customDomains) && tenant.customDomains[0])
      || tenant.domain
      || `${tenant.subdomain}.${BASE_DOMAIN}`;

    return res.status(200).json({
      message: "Website found",
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        status: tenant.status,
        productType: tenant.productType,
        plan: tenant.plan,
        subdomain: tenant.subdomain,
        domain,
        domainVerified: tenant.domainVerified,
        websiteUrl: domain ? `https://${domain}` : null,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getPendingTenants = async (_req, res) => {
  try {
    const tenants = await Tenant.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.status(200).json(tenants);
  } catch (error) {
    console.error("❌ Get pending tenants error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getTopAgencies = async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit || 6);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 6;

    const tenants = await Tenant.find({ status: "approved" })
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(limit);

    const agencies = tenants.map((tenant) => {
      const customDomain = Array.isArray(tenant.customDomains) && tenant.customDomains.length > 0
        ? tenant.customDomains[0]
        : "";
      const preferredDomain = customDomain || tenant.domain || "";

      return {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        domain: preferredDomain,
        customDomain,
        requestedDomain: tenant.requestedDomain,
        plan: tenant.plan,
        logoUrl: tenant.logo ? getPublicUrl(tenant.logo) : null,
        websiteUrl: preferredDomain ? `https://${preferredDomain}` : null,
        description: `${tenant.name} is a top-performing ${String(tenant.plan || "")
          .replace(/^[a-z]/, (match) => match.toUpperCase())} agency on Luxury UAE Property SaaS.`,
      };
    });

    return res.status(200).json({ agencies });
  } catch (err) {
    console.error("❌ Get top agencies error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.resolveTenant = async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    return res.status(200).json({
      id: tenant._id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      logo: tenant.logo ? getPublicUrl(tenant.logo) : null,
      subdomain: tenant.subdomain,
      domain: tenant.domain,
      status: tenant.status,
      plan: tenant.plan,
      productType: tenant.productType,
      trialActive: tenant.trialActive,
      trialEndsAt: tenant.trialEndsAt,
    });
  } catch (err) {
    console.error("❌ Resolve tenant error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.approveTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    if (tenant.status === "approved") return res.status(400).json({ error: "Tenant already approved" });

    const {
      plan,
      trialDays,
      adminName,
      adminEmail,
      adminPassword,
      customDomain,
      websiteTheme,
      seo,
    } = req.body;

    const { adminUser, onboarding } = await provisionApprovedTenant({
      tenant,
      plan,
      trialDays,
      adminName,
      adminEmail,
      adminPassword,
      customDomain,
      websiteTheme,
      seo,
      approvedBy: req.masterUser?._id,
    });

    return res.status(200).json({
      message: "Tenant approved and provisioned successfully",
      tenant,
      adminUser: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
      },
      onboarding,
    });
  } catch (err) {
    console.error("❌ Tenant approval error:", err);
    const statusCode = Number(err.statusCode) || 500;
    return res.status(statusCode).json({ error: err.message });
  }
};

exports.rejectTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const { note } = req.body;

    tenant.status = "rejected";
    tenant.rejectedAt = new Date();
    tenant.reviewNote = note || "Rejected by super admin";
    tenant.approvedBy = req.masterUser?._id;
    await tenant.save();

    await emailQueue.add("sendVisitorEmail", {
      to: tenant.email,
      subject: "Tenant application update",
      html: `<p>Hi ${tenant.name}, your application needs updates before approval.</p><p>${tenant.reviewNote}</p>`,
    });

    return res.status(200).json({ message: "Tenant rejected", tenant });
  } catch (error) {
    console.error("❌ Reject tenant error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.resendAdminOnboarding = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.status !== "approved") {
      return res.status(400).json({ error: "Tenant is not approved yet" });
    }

    const requestedAdminEmail = String(req.body?.adminEmail || "").trim().toLowerCase();
    const adminEmail = requestedAdminEmail || String(tenant.email || "").trim().toLowerCase();
    if (!adminEmail) {
      return res.status(400).json({ error: "Admin email is required" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", userSchema);
    const adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      return res.status(404).json({
        error: "Admin user not found in tenant database. Provide the correct adminEmail.",
      });
    }

    adminUser.emailVerified = false;
    adminUser.passwordSetupRequired = true;
    await adminUser.save();

    const onboarding = await sendAdminOnboardingEmail({
      tenant,
      adminEmail: adminUser.email,
      adminName: adminUser.name,
    });

    return res.status(200).json({
      message: "Admin onboarding email has been re-sent",
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
      },
      onboarding,
    });
  } catch (error) {
    console.error("❌ Resend onboarding error:", error);
    const statusCode = Number(error.statusCode) || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

exports.getAllTenants = async (_req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    return res.status(200).json(
      tenants.map((tenant) => ({
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        requestedDomain: tenant.requestedDomain,
        customDomains: tenant.customDomains,
        databaseName: tenant.databaseName,
        status: tenant.status,
        reviewNote: tenant.reviewNote,
        plan: tenant.plan,
        requestedPlan: tenant.requestedPlan || tenant.plan,
        planStartDate: tenant.planStartDate,
        planEndDate: tenant.planEndDate,
        websiteTheme: tenant.websiteTheme,
        seo: tenant.seo || { title: "", description: "", keywords: [] },
        logoUrl: tenant.logo ? getPublicUrl(tenant.logo) : null,
        trialActive: tenant.trialActive,
        trialEndsAt: tenant.trialEndsAt,
        dbCreated: tenant.dbCreated,
        createdAt: tenant.createdAt,
      }))
    );
  } catch (err) {
    console.error("❌ Get tenants error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    return res.status(200).json({
      id: tenant._id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      subdomain: tenant.subdomain,
      domain: tenant.domain,
      requestedDomain: tenant.requestedDomain,
      customDomains: tenant.customDomains,
      databaseName: tenant.databaseName,
      status: tenant.status,
      reviewNote: tenant.reviewNote,
      plan: tenant.plan,
      requestedPlan: tenant.requestedPlan || tenant.plan,
      planStartDate: tenant.planStartDate,
      planEndDate: tenant.planEndDate,
      websiteTheme: tenant.websiteTheme,
      seo: tenant.seo || { title: "", description: "", keywords: [] },
      logoUrl: tenant.logo ? getPublicUrl(tenant.logo) : null,
      trialActive: tenant.trialActive,
      trialEndsAt: tenant.trialEndsAt,
      dbCreated: tenant.dbCreated,
      createdAt: tenant.createdAt,
    });
  } catch (err) {
    console.error("❌ Get tenant error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTenant = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (typeof updates.domain === "string" && updates.domain.trim()) {
      updates.domain = normalizePlatformDomain(updates.domain);
    }

    if (typeof updates.requestedDomain === "string" && updates.requestedDomain.trim()) {
      updates.requestedDomain = normalizePlatformDomain(updates.requestedDomain);
    }

    if (Array.isArray(updates.customDomains)) {
      updates.customDomains = updates.customDomains
        .map((domain) => normalizePlatformDomain(domain))
        .filter(Boolean);
    }

    if (req.file) {
      updates.logo = await uploadToMinio(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "tenants/logos"
      );
    }

    const tenant = await Tenant.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    return res.status(200).json({ message: "Tenant updated successfully", tenant });
  } catch (err) {
    console.error("❌ Update tenant error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    if (tenant.dbCreated) {
      try {
        const tenantConn = await connectTenantDB(tenant.databaseName);
        await tenantConn.dropDatabase();
      } catch (dbError) {
        console.error(`❌ Error dropping tenant database (${tenant.databaseName}):`, dbError.message);
      }
    }

    await tenant.deleteOne();
    return res.status(200).json({ message: "Tenant deleted successfully" });
  } catch (err) {
    console.error("❌ Delete tenant error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.updateCustomDomain = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const planRules = getPlanRules(tenant.plan);
    if (planRules.maxCustomDomains < 1) {
      return res.status(403).json({
        error: `${planRules.name} plan does not include custom domains. Please upgrade to Pro or Enterprise.`,
      });
    }

    const domain = normalizePlatformDomain(req.body.domain || "");
    if (!domain) return res.status(400).json({ error: "Domain is required" });

    if (!tenant.customDomains.includes(domain) && tenant.customDomains.length >= planRules.maxCustomDomains) {
      return res.status(403).json({
        error: `${planRules.name} plan allows up to ${planRules.maxCustomDomains} custom domain${planRules.maxCustomDomains > 1 ? "s" : ""}.`,
      });
    }

    tenant.domain = domain;
    tenant.domainVerified = false;
    if (!tenant.customDomains.includes(domain)) {
      tenant.customDomains.push(domain);
    }

    await tenant.save();

    return res.status(200).json({
      message: "Custom domain saved. Update DNS and verify.",
      dnsInstructions: {
        cname: `${tenant.subdomain}.${BASE_DOMAIN}`,
        aRecord: process.env.SERVER_IP || "<your-server-ip>",
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.verifyCustomDomain = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const domain = normalizePlatformDomain(req.body?.domain || tenant.domain || "");
    if (!domain) return res.status(400).json({ error: "Domain is required for verification" });

    const tenantTarget = `${tenant.subdomain}.${BASE_DOMAIN}`;

    let cnameMatches = false;
    let aMatchesServerIp = false;
    let cnameRecords = [];
    let aRecords = [];

    try {
      cnameRecords = await dns.resolveCname(domain);
      cnameMatches = cnameRecords.some((record) => normalizeDomain(record) === tenantTarget);
    } catch {
      cnameRecords = [];
    }

    try {
      aRecords = await dns.resolve4(domain);
      if (SERVER_IP) {
        aMatchesServerIp = aRecords.includes(SERVER_IP);
      }
    } catch {
      aRecords = [];
    }

    if (!cnameMatches && !(SERVER_IP && aMatchesServerIp)) {
      return res.status(400).json({
        error: "Domain DNS is not pointing to this server yet",
        dnsInstructions: {
          domain,
          required: {
            cname: tenantTarget,
            aRecord: SERVER_IP || "<set SERVER_IP in backend .env>",
          },
          detected: {
            cnameRecords,
            aRecords,
          },
        },
      });
    }

    tenant.domainVerified = true;
    tenant.domain = domain;
    if (!tenant.customDomains.includes(domain)) {
      tenant.customDomains.push(domain);
    }
    await tenant.save();

    return res.status(200).json({
      message: "Custom domain verified successfully",
      verification: {
        domain,
        cnameMatches,
        aMatchesServerIp,
      },
      tenant,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
