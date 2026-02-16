const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const UserSchema = require("../models/User"); // Schema only
const RoleSchema = require("../models/Role"); // Schema only if needed
const PermissionSchema = require("../models/Permission"); // ✅ import Permission schema

const JWT_SECRET = process.env.JWT_SECRET || "global_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// 🔹 Helper: generate JWT
const generateToken = (user, tenantDomain) => {
  // Extract permissions names (or IDs) from populated role
  const permissions = user.role?.permissions?.map(p => p.name) || [];

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role?.name || "User",
      permissions,
      tenantDomain,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// 🔹 Helper: resolve tenant and tenant DB connection
const getTenantConnection = async (req) => {
  try {
    // 1️⃣ Extract Origin header
    const originHeader = req.headers.origin;
    if (!originHeader) {
      throw new Error("Missing Origin header in request");
    }

    // 2️⃣ Parse Origin → extract hostname safely
    let frontendDomain;
    try {
      frontendDomain = new URL(originHeader).hostname; // e.g., "zj.localhost" or "tenant.example.com"
    } catch (err) {
      throw new Error("Invalid Origin header format");
    }

    console.log("🌍 Frontend domain resolved from Origin:", frontendDomain);

    // 3️⃣ Extract subdomain (first part before '.')
    const subdomain = frontendDomain.split(".")[0];
    if (!subdomain || subdomain === "localhost") {
      throw new Error("Invalid or missing tenant subdomain");
    }

    // 4️⃣ Find tenant by subdomain
    const tenant = await Tenant.findOne({ subdomain });
    if (!tenant) {
      throw new Error(`Tenant not found for subdomain: ${subdomain}`);
    }
    if (!tenant.dbCreated || tenant.status !== "approved") {
      throw new Error(`Tenant ${tenant.name} is not approved or DB not initialized`);
    }

    // 5️⃣ Connect to tenant database
    const tenantConn = await connectTenantDB(tenant.databaseName);

    // 6️⃣ Initialize tenant-specific models
    const User = tenantConn.model("User", UserSchema);
    const Role = tenantConn.model("Role", RoleSchema);

    console.log(`✅ Tenant connection established for: ${tenant.name} (${tenant.databaseName})`);

    return { tenant, tenantConn, User, Role };
  } catch (err) {
    console.error("❌ Tenant DB connection error:", err.message);
    throw err;
  }
};

/**
 * 🔹 Register New User (Tenant-Specific)
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;

    const { tenant, User } = await getTenantConnection(req);

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: roleId || null,
    });

    const token = generateToken(user, tenant.domain);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      tenant: tenant.domain,
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🔹 User Login (Tenant-Specific)
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 2️⃣ Tenant from middleware
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(400).json({ error: "Tenant not resolved" });
    }

    // 3️⃣ Connect to tenant DB
    const tenantConn = await connectTenantDB(tenant.databaseName);

    // 4️⃣ Register User and Role models (if not already registered)
    const User = tenantConn.model("User", UserSchema);
    const Role = tenantConn.model("Role", RoleSchema);
    const Permission = tenantConn.model("Permission", PermissionSchema);
    // 5️⃣ Find user and populate role → permissions
    const user = await User.findOne({ email }).populate({
      path: "role",
      populate: { path: "permissions", select: "name" }, // get permissions names
    });

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // 6️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // 7️⃣ Generate JWT including permissions
    const token = generateToken(user, tenant.subdomain);

    // 8️⃣ Respond
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || "User",
        permissions: user.role?.permissions?.map(p => p.name) || [],
      },
      tenant: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
      },
    });

    console.log(`✅ ${user.email} logged in under tenant: ${tenant.subdomain}`);
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

/**
 * 🔹 Get Authenticated User Profile (Tenant-Specific)
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { tenant, User } = await getTenantConnection(req);

    const user = await User.findById(req.user.id)
      .populate("role")
      .select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ tenant: tenant.domain, user });
  } catch (err) {
    console.error("❌ Profile fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
