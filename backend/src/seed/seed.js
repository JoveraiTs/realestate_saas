require("dotenv").config();
const mongoose = require("mongoose");
const MasterUser = require("../models/MasterUser");
const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const UserSchema = require("../models/User");
const RoleSchema = require("../models/Role");
const PermissionSchema = require("../models/Permission");
const PropertySchema = require("../models/Property");
const AgentSchema = require("../models/Agent");

const PERMISSIONS = [
  { module: "Management", submodule: "Users", action: "Access", name: "management.users.access", description: "Access Users" },
  { module: "Management", submodule: "Users", action: "Create", name: "management.users.create", description: "Create Users" },
  { module: "Management", submodule: "Users", action: "View", name: "management.users.view", description: "View Users" },
  { module: "Management", submodule: "Users", action: "Edit", name: "management.users.edit", description: "Edit Users" },
  { module: "Management", submodule: "Users", action: "Delete", name: "management.users.delete", description: "Delete Users" },
  { module: "Management", submodule: "Bookings", action: "Access", name: "management.bookings.access", description: "Access Bookings" },
  { module: "Management", submodule: "Bookings", action: "View", name: "management.bookings.view", description: "View Bookings" },
  { module: "Management", submodule: "Bookings", action: "Edit", name: "management.bookings.edit", description: "Edit Bookings" },
];

const STAFF_PERMISSION_NAMES = [
  "management.users.access",
  "management.users.view",
  "management.bookings.access",
  "management.bookings.view",
];

const defaults = {
  mongoUri:
    process.env.MONGO_MAIN_URI ||
    "mongodb://127.0.0.1:27017/master_realestate_saas",
  master: {
    name: process.env.MASTER_ADMIN_NAME || "Super Admin",
    email: process.env.MASTER_ADMIN_EMAIL || "admin@testrealestate.com",
    password: process.env.MASTER_ADMIN_PASSWORD || "Admin@123",
  },
  tenant: {
    name: process.env.TEST_TENANT_NAME || "Test Realty",
    email: process.env.TEST_TENANT_EMAIL || "owner@testrealty.com",
    phone: process.env.TEST_TENANT_PHONE || "+971501234567",
    subdomain: process.env.TEST_TENANT_SUBDOMAIN || "testrealty",
    domain: process.env.TEST_TENANT_DOMAIN || "testrealty.localhost",
    databaseName: process.env.TEST_TENANT_DB || "tenant_testrealty",
    plan: process.env.TEST_TENANT_PLAN || "basic",
  },
  tenantAdmin: {
    name: process.env.TEST_TENANT_ADMIN_NAME || "Test Tenant Admin",
    email: process.env.TEST_TENANT_ADMIN_EMAIL || "admin@testrealty.com",
    password: process.env.TEST_TENANT_ADMIN_PASSWORD || "Admin@123",
  },
  tenantStaff: {
    name: process.env.TEST_TENANT_STAFF_NAME || "Test Staff User",
    email: process.env.TEST_TENANT_STAFF_EMAIL || "staff@testrealty.com",
    password: process.env.TEST_TENANT_STAFF_PASSWORD || "Staff@123",
  },
};

const upsertTenantUser = async ({ User, roleId, tenantId, userDefaults }) => {
  const { name, email, password } = userDefaults;
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      password,
      role: roleId,
      tenant: tenantId,
      isActive: true,
    });
    return user;
  }

  user.name = name;
  user.password = password;
  user.role = roleId;
  user.tenant = tenantId;
  user.isActive = true;
  await user.save();
  return user;
};

const upsertMasterAdmin = async () => {
  const { name, email, password } = defaults.master;
  const existing = await MasterUser.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.role = "super_admin";
    existing.isActive = true;
    existing.password = password;
    await existing.save();
    return existing;
  }

  return MasterUser.create({
    name,
    email,
    password,
    role: "super_admin",
    isActive: true,
  });
};

const upsertTenant = async () => {
  const data = defaults.tenant;
  let tenant = await Tenant.findOne({ subdomain: data.subdomain });

  if (!tenant) {
    tenant = await Tenant.create({
      ...data,
      status: "approved",
      dbCreated: true,
      trialActive: false,
      planStartDate: new Date(),
      planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return tenant;
  }

  tenant.name = data.name;
  tenant.email = data.email;
  tenant.phone = data.phone;
  tenant.domain = data.domain;
  tenant.databaseName = data.databaseName;
  tenant.plan = data.plan;
  tenant.status = "approved";
  tenant.dbCreated = true;
  tenant.trialActive = false;
  await tenant.save();
  return tenant;
};

const upsertPermissions = async (Permission) => {
  for (const permission of PERMISSIONS) {
    await Permission.updateOne(
      { name: permission.name },
      { $set: permission },
      { upsert: true }
    );
  }
  return Permission.find({ name: { $in: PERMISSIONS.map((p) => p.name) } });
};

const seedPublicWebsiteData = async ({ Property, Agent, tenantId, tenantName }) => {
  const existingProperties = await Property.countDocuments();
  if (existingProperties === 0) {
    await Property.insertMany([
      {
        title: "Marina View Apartment",
        location: "Dubai Marina",
        price: "AED 2,350,000",
        description: `${tenantName} listed premium 2BR apartment with marina views.`,
        status: "published",
        tenant: tenantId,
      },
      {
        title: "Palm Signature Villa",
        location: "Palm Jumeirah",
        price: "AED 11,800,000",
        description: `${tenantName} showcased luxury villa with private beach access.`,
        status: "published",
        tenant: tenantId,
      },
    ]);
  }

  const existingAgents = await Agent.countDocuments();
  if (existingAgents === 0) {
    await Agent.insertMany([
      {
        name: "Senior Property Advisor",
        specialization: "Luxury Residential",
        experience: "8+ years",
        bio: `${tenantName} advisor for premium apartments and penthouses.`,
        status: "active",
        tenant: tenantId,
      },
      {
        name: "Investment Consultant",
        specialization: "ROI & Portfolio",
        experience: "6+ years",
        bio: `Supports ${tenantName} clients with high-yield investment decisions.`,
        status: "active",
        tenant: tenantId,
      },
    ]);
  }
};

const seedTenantSide = async (tenant) => {
  const tenantConn = await connectTenantDB(tenant.databaseName);

  const User = tenantConn.model("User", UserSchema);
  const Role = tenantConn.model("Role", RoleSchema);
  const Permission = tenantConn.model("Permission", PermissionSchema);
  const Property = tenantConn.model("Property", PropertySchema);
  const Agent = tenantConn.model("Agent", AgentSchema);

  const permissions = await upsertPermissions(Permission);

  let adminRole = await Role.findOne({ name: "Admin" });
  if (!adminRole) {
    adminRole = await Role.create({
      name: "Admin",
      description: "Default admin role for test tenant",
      permissions: permissions.map((p) => p._id),
    });
  } else {
    adminRole.permissions = permissions.map((p) => p._id);
    await adminRole.save();
  }

  const staffPermissionIds = permissions
    .filter((p) => STAFF_PERMISSION_NAMES.includes(p.name))
    .map((p) => p._id);

  let staffRole = await Role.findOne({ name: "Staff" });
  if (!staffRole) {
    staffRole = await Role.create({
      name: "Staff",
      description: "Limited role for test staff users",
      permissions: staffPermissionIds,
    });
  } else {
    staffRole.permissions = staffPermissionIds;
    await staffRole.save();
  }

  const adminUser = await upsertTenantUser({
    User,
    roleId: adminRole._id,
    tenantId: tenant._id,
    userDefaults: defaults.tenantAdmin,
  });

  const staffUser = await upsertTenantUser({
    User,
    roleId: staffRole._id,
    tenantId: tenant._id,
    userDefaults: defaults.tenantStaff,
  });

  await seedPublicWebsiteData({
    Property,
    Agent,
    tenantId: tenant._id,
    tenantName: tenant.name,
  });

  return { tenantConn, adminRole, staffRole, adminUser, staffUser };
};

const seed = async () => {
  let tenantConn;
  try {
    await mongoose.connect(defaults.mongoUri);
    console.log("✅ Connected to Master DB");

    const masterAdmin = await upsertMasterAdmin();
    const tenant = await upsertTenant();
    const tenantSeed = await seedTenantSide(tenant);
    tenantConn = tenantSeed.tenantConn;

    console.log("\n✅ Seeding completed\n");
    console.log("Master Admin:");
    console.log(`  Email: ${masterAdmin.email}`);
    console.log(`  Password: ${defaults.master.password}`);
    console.log("\nTest Tenant:");
    console.log(`  Name: ${tenant.name}`);
    console.log(`  Domain: ${tenant.domain}`);
    console.log(`  Subdomain: ${tenant.subdomain}`);
    console.log(`  DB: ${tenant.databaseName}`);
    console.log("\nTenant Admin:");
    console.log(`  Email: ${tenantSeed.adminUser.email}`);
    console.log(`  Password: ${defaults.tenantAdmin.password}`);
    console.log("\nTenant Staff:");
    console.log(`  Email: ${tenantSeed.staffUser.email}`);
    console.log(`  Password: ${defaults.tenantStaff.password}`);
    console.log("  Role: Staff (limited permissions)");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (tenantConn) {
      await tenantConn.close().catch(() => {});
    }
    await mongoose.disconnect().catch(() => {});
  }
};

seed();
