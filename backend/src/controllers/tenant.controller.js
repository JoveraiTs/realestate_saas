// src/controllers/tenant.controller.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const { uploadToMinio, getPublicUrl } = require("../utils/minio");
const emailQueue = require("../queues/email.queue");

// Import schemas only (not the models)
const userSchema = require("../models/User");       // This imports just the schema
const permissionSchema = require("../models/Permission"); // This imports just the schema
const roleSchema = require("../models/Role");       // This imports just the schema

// ===== Multer memory storage setup =====
const storage = multer.memoryStorage();
exports.upload = multer({ storage });

// ===================== REGISTER TENANT =====================
exports.registerTenant = async (req, res) => {
  try {
    const { name, email, phone, address, plan } = req.body;

    // Generate subdomain
    const subdomain = name.toLowerCase().replace(/\s+/g, "").replace(/[^\w\-]/g, "");

    // Generate DB name
    const databaseName = `${subdomain}`;

    // Upload logo if exists
    // let logoUrl = null;
    // if (req.file) {
    //   logoUrl = await uploadToMinio(
    //     req.file.buffer,
    //     req.file.originalname,
    //     req.file.mimetype,
    //     "tenants/logos"
    //   );
    // }

    // Create tenant in main DB
    const tenant = await Tenant.create({
      name,
      email,
      phone,
      address,
      // logo: logoUrl,
      subdomain,
      databaseName,
      plan: plan || "basic",
      status: "pending",
    });

 
    // ---------------------------
    // Queue Email Jobs
    // ---------------------------

    // Visitor Email
    await emailQueue.add('sendVisitorEmail', {
      to: email,
      subject: `Welcome to Our SaaS,!`,
      html: `
       <P>Hi ${name},</P>
       <P>Thank you for registering your tenant. Your registration is currently pending approval. We will notify you once your tenant is approved and ready to use.</P>
       <P>Best regards,<br/>The SaaS Team</P>
      `
    });

    // Admin Email
    await emailQueue.add('sendAdminEmail', {
      to: process.env.ALERT_EMAIL,
      subject: `New Tenant Registration - ${name}`,
      html: `
        <P>A new tenant has registered and is pending approval:</P> 
        <UL>
          <LI><strong>Name:</strong> ${name}</LI>
          <LI><strong>Email:</strong> ${email}</LI>
          <LI><strong>Phone:</strong> ${phone}</LI>
          <LI><strong>Subdomain:</strong> ${subdomain}</LI>
          <LI><strong>Plan:</strong> ${plan || "basic"}</LI>
        </UL>
        <P>Please review and approve the tenant in the admin dashboard.</P>
      `
    });

    // ---------------------------
    // Respond to client
    // ---------------------------

    res.status(201).json({
      message: "Tenant registration pending approval",
      tenant,
    });
  } catch (err) {
    console.error("❌ Tenant registration error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===================== APPROVE TENANT =====================
exports.approveTenant = async (req, res) => {
  try {
    const tenantId = req.params.id;

    // 1️⃣ Fetch tenant from main DB
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    if (tenant.status === "approved")
      return res.status(400).json({ error: "Tenant already approved" });

    // 2️⃣ Connect to tenant DB
    const tenantConn = await connectTenantDB(tenant.databaseName);

    // 3️⃣ Create models on tenant DB from schemas
    const User = tenantConn.model("User", userSchema);
    const Permission = tenantConn.model("Permission", permissionSchema);
    const Role = tenantConn.model("Role", roleSchema);

    // 4️⃣ Default permissions
    const submodules = ["Hotels", "Rooms", "Bookings", "Users"];
    const allPermissions = [];

    submodules.forEach((submodule) => {
      const slug = submodule.toLowerCase();
      ["Access", "Create", "View", "Edit", "Delete"].forEach((action) => {
        allPermissions.push({
          module: "Management",
          submodule,
          action,
          name: `management.${slug}.${action.toLowerCase()}`,
          description: `${action} ${submodule}`,
        });
      });
    });

    // Extra Users permissions
    allPermissions.push(
      {
        module: "Management",
        submodule: "Users",
        action: "create-hotel-owner",
        name: "management.users.create-hotel-owner",
        description: "Create hotel owner",
      },
      {
        module: "Management",
        submodule: "Users",
        action: "reset-password",
        name: "management.users.reset-password",
        description: "Reset password",
      }
    );

    const createdPermissions = await Permission.insertMany(allPermissions);

    // 5️⃣ Create Admin role
    const adminRole = await Role.create({
      name: "Admin",
      permissions: createdPermissions.map((p) => p._id),
    });

    // 6️⃣ Create Admin user
    // const hashedPassword = await bcrypt.hash("Admin@123", 10);
    const adminUser = await User.create({
      name: `${tenant.name} Admin`,
      email: tenant.email,
      password: "Admin@123", // let the pre('save') hook hash this
      role: adminRole._id,
      tenant: tenant._id,
    });

    // 7️⃣ Mark tenant as approved in main DB
    tenant.status = "approved";
    tenant.dbCreated = true;
    await tenant.save();

       // Visitor Email
    await emailQueue.add('sendVisitorEmail', {
      to: tenant.email,
      subject: `Your Application is Approved!`,
      html: `
        <P>Hi ${tenant.name},</P> 
        <P>Great news! Your tenant application has been approved. You can now log in and start using the platform.</P>
         <p> Access your dashboard: <a href="http://${tenant.subdomain}.${process.env.BASE_DOMAIN}">http://${tenant.subdomain}.${process.env.BASE_DOMAIN}</a></p>
        `
    });
    res.status(200).json({
      message: "Tenant approved, DB initialized, default permissions & admin created",
      tenant,
      adminRole,
      adminUser: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (err) {
    console.error("❌ Tenant approval error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===================== GET ALL TENANTS =====================
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.json(
      tenants.map((t) => ({
        id: t._id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        subdomain: t.subdomain,
        databaseName: t.databaseName,
        status: t.status,
        plan: t.plan,
        planStartDate: t.planStartDate,
        planEndDate: t.planEndDate,
        logoUrl: t.logo ? getPublicUrl(t.logo) : null,
        trialActive: t.trialActive,
        trialEndsAt: t.trialEndsAt,
        dbCreated: t.dbCreated,
        createdAt: t.createdAt
      }))
    );
  } catch (err) {
    console.error("❌ Get tenants error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===================== GET SINGLE TENANT =====================
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json({
      id: tenant._id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      subdomain: tenant.subdomain,
      databaseName: tenant.databaseName,
      status: tenant.status,
      plan: tenant.plan,
      planStartDate: tenant.planStartDate,
      planEndDate: tenant.planEndDate,
      logoUrl: tenant.logo ? getPublicUrl(tenant.logo) : null,
      trialActive: tenant.trialActive,
      trialEndsAt: tenant.trialEndsAt,
      dbCreated: tenant.dbCreated,
      createdAt: tenant.createdAt
    });
  } catch (err) {
    console.error("❌ Get tenant error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===================== UPDATE TENANT =====================
exports.updateTenant = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Handle logo upload if exists
    if (req.file) {
      updates.logo = await uploadToMinio(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "tenants/logos"
      );
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    res.json({
      message: "Tenant updated successfully",
      tenant
    });
  } catch (err) {
    console.error("❌ Update tenant error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===================== DELETE TENANT =====================
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Optionally: Drop the tenant's database
    if (tenant.dbCreated) {
      try {
        const tenantConn = await connectTenantDB(tenant.databaseName);
        await tenantConn.dropDatabase();
        console.log(`✅ Dropped tenant database: ${tenant.databaseName}`);
      } catch (dbError) {
        console.error(`❌ Error dropping tenant database: ${dbError.message}`);
        // Continue with tenant deletion even if DB drop fails
      }
    }

    await tenant.deleteOne();

    res.json({
      message: "Tenant deleted successfully"
    });
  } catch (err) {
    console.error("❌ Delete tenant error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.updateCustomDomain = async (req, res) => {
  try {
    const { domain } = req.body;

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    tenant.domain = domain.toLowerCase();
    tenant.domainVerified = false;

    await tenant.save();

    res.json({
      message: "Custom domain saved. Please update DNS A record.",
      dnsTarget: process.env.SERVER_IP
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};