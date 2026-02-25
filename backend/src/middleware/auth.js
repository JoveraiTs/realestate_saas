const jwt = require("jsonwebtoken");
const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const UserSchema = require("../models/User");
const RoleSchema = require("../models/Role");
const PermissionSchema = require("../models/Permission");
const JWT_SECRET = process.env.JWT_SECRET || "global_secret_key";

/**
 * Tenant JWT auth middleware
 */
const tenantAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ error: "Unauthorized: No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.tokenType !== "tenant") {
      return res.status(403).json({ error: "Forbidden: Invalid token type" });
    }

    req.auth = decoded;

    const tenant = req.tenant
      ? await Tenant.findById(req.tenant._id)
      : await Tenant.findById(decoded.tenantId);

    if (!tenant || !tenant.dbCreated)
      return res.status(404).json({ error: "Tenant not found or not approved" });

    if (String(decoded.tenantId || "") !== String(tenant._id)) {
      return res.status(403).json({ error: "Forbidden: Invalid tenant" });
    }

    // Connect to tenant DB and fetch user
    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);
    tenantConn.model("Permission", PermissionSchema);
    tenantConn.model("Role", RoleSchema);

    const user = await User.findById(decoded.id).populate({
      path: "role",
      populate: { path: "permissions", select: "name" },
    });
    if (!user || !user.isActive) return res.status(401).json({ error: "User not found" });

    const roleName = String(user.role?.name || "agent").toLowerCase();
    const permissions = Array.isArray(user.role?.permissions)
      ? user.role.permissions.map((permission) => permission.name).filter(Boolean)
      : [];

    // Attach tenant and user to request
    req.tenant = tenant;
    req.user = user;
    req.auth = {
      ...decoded,
      role: roleName,
      permissions,
    };

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = tenantAuth;
