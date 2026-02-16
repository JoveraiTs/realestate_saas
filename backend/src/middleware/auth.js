const jwt = require("jsonwebtoken");
const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const UserSchema = require("../models/User");

/**
 * Tenant JWT auth middleware
 */
const tenantAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ error: "Unauthorized: No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate tenant domain matches
    const domain = req.hostname;
    if (decoded.tenantDomain !== domain)
      return res.status(403).json({ error: "Forbidden: Invalid tenant" });

    // Fetch tenant
    const tenant = await Tenant.findOne({ domain });
    if (!tenant || !tenant.dbCreated)
      return res.status(404).json({ error: "Tenant not found or not approved" });

    // Connect to tenant DB and fetch user
    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    // Attach tenant and user to request
    req.tenant = tenant;
    req.user = user;

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = tenantAuth;
