const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const MasterUser = require("../models/MasterUser");
const Tenant = require("../models/Tenant");
const { connectTenantDB } = require("../utils/tenantDb");
const UserSchema = require("../models/User");
const RoleSchema = require("../models/Role");
const PermissionSchema = require("../models/Permission");
const { getPlanRules } = require("../utils/planRules");

const JWT_SECRET = process.env.JWT_SECRET || "global_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const roleToRedirectPath = (roleName = "") => {
  const normalized = roleName.toLowerCase();
  if (normalized === "super_admin") return "/super-admin";
  if (normalized === "admin") return "/admin";
  return "/agent";
};

const extractPermissionNames = (user) => user.role?.permissions?.map((permission) => permission.name) || [];

const generateTenantToken = (user, tenant) => {
  const roleName = user.role?.name || "agent";
  const permissions = extractPermissionNames(user);

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: roleName,
      permissions,
      tenantId: tenant._id,
      tenantSubdomain: tenant.subdomain,
      tokenType: "tenant",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const generateMasterToken = (masterUser) =>
  jwt.sign(
    {
      id: masterUser._id,
      email: masterUser.email,
      role: masterUser.role,
      tokenType: "master",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(400).json({ error: "Tenant not resolved" });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);

    const planRules = getPlanRules(tenant.plan);
    const existingUsersCount = await User.countDocuments();
    if (existingUsersCount >= planRules.maxUsers) {
      return res.status(403).json({
        error: `${planRules.name} plan allows up to ${planRules.maxUsers} user${planRules.maxUsers > 1 ? "s" : ""}. Please upgrade your plan to add more users.`,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: roleId || null,
      tenant: tenant._id,
      isActive: true,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const tenant = req.tenant;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!tenant) {
      return res.status(400).json({ error: "Tenant not resolved" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);
    tenantConn.model("Permission", PermissionSchema);
    tenantConn.model("Role", RoleSchema);

    const user = await User.findOne({ email: email.toLowerCase() }).populate({
      path: "role",
      populate: { path: "permissions", select: "name" },
    });

    if (!user || !user.isActive) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (user.passwordSetupRequired) {
      return res.status(403).json({
        error: "Password setup is pending. Please use the setup link sent to your email.",
      });
    }

    const roleName = user.role?.name || "agent";
    const token = generateTenantToken(user, tenant);

    return res.status(200).json({
      message: "Login successful",
      token,
      redirectTo: roleToRedirectPath(roleName),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        role: roleName,
        permissions: extractPermissionNames(user),
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        plan: tenant.plan,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(400).json({ error: "Tenant not resolved" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);

    const user = await User.findById(req.user.id)
      .populate({
        path: "role",
        populate: { path: "permissions", select: "name" },
      })
      .select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      user,
    });
  } catch (err) {
    console.error("❌ Profile fetch error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(400).json({ error: "Tenant not resolved" });
    }

    const { name, avatarUrl } = req.body;
    const trimmedName = String(name || "").trim();
    const trimmedAvatarUrl = String(avatarUrl || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "Name is required" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = trimmedName;
    user.avatarUrl = trimmedAvatarUrl;
    await user.save();

    const refreshed = await User.findById(user._id)
      .populate({
        path: "role",
        populate: { path: "permissions", select: "name" },
      })
      .select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: refreshed,
    });
  } catch (err) {
    console.error("❌ Profile update error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(400).json({ error: "Tenant not resolved" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("❌ Password reset error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.loginMasterUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const masterUser = await MasterUser.findOne({ email: email.toLowerCase() });
    if (!masterUser || !masterUser.isActive) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await masterUser.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateMasterToken(masterUser);

    return res.status(200).json({
      message: "Super admin login successful",
      token,
      redirectTo: "/super-admin",
      user: {
        id: masterUser._id,
        name: masterUser.name,
        email: masterUser.email,
        role: masterUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Super admin login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
};

exports.renderSetupPasswordForm = async (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) {
    return res.status(400).send("<h3>Invalid setup link</h3>");
  }

  const safeToken = escapeHtml(token);

  return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Create Admin Password</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f5f7fb; padding:24px; }
      .card { max-width: 460px; margin: 0 auto; background:#fff; border-radius:10px; padding:24px; box-shadow:0 6px 18px rgba(0,0,0,.06); }
      h2 { margin:0 0 12px; }
      p { color:#475467; }
      label { display:block; margin:12px 0 6px; font-weight:600; }
      input { width:100%; padding:10px; border:1px solid #d0d5dd; border-radius:8px; }
      button { margin-top:14px; width:100%; background:#101828; color:#fff; border:0; padding:12px; border-radius:8px; cursor:pointer; }
      small { color:#667085; display:block; margin-top:10px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Create your admin password</h2>
      <p>Confirm your email and set a new password to activate your admin account.</p>
      <form method="POST" action="/api/auth/setup-password">
        <input type="hidden" name="token" value="${safeToken}" />
        <label for="newPassword">New Password</label>
        <input id="newPassword" name="newPassword" type="password" minlength="8" required />
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" minlength="8" required />
        <button type="submit">Set Password</button>
        <small>Password must be at least 8 characters.</small>
      </form>
    </div>
  </body>
</html>
  `);
};

exports.setupPasswordWithToken = async (req, res) => {
  try {
    const token = String(req.body?.token || req.query?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Password and confirm password do not match" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "Invalid or expired setup token" });
    }

    if (decoded.tokenType !== "tenant_admin_setup" || !decoded.tenantId || !decoded.email) {
      return res.status(400).json({ error: "Invalid setup token payload" });
    }

    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const tenantConn = await connectTenantDB(tenant.databaseName);
    const User = tenantConn.model("User", UserSchema);

    const user = await User.findOne({
      email: String(decoded.email).toLowerCase(),
      tenant: tenant._id,
    });

    if (!user) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    user.password = newPassword;
    user.emailVerified = true;
    user.passwordSetupRequired = false;
    user.passwordSetupAt = new Date();
    user.isActive = true;
    await user.save();

    const acceptHeader = String(req.headers.accept || "").toLowerCase();
    if (acceptHeader.includes("text/html")) {
      return res.status(200).send("<h3>Password created successfully. You can now login.</h3>");
    }

    return res.status(200).json({ message: "Password created successfully. You can now login." });
  } catch (error) {
    console.error("❌ Setup password error:", error.message);
    return res.status(500).json({ error: "Failed to setup password" });
  }
};
