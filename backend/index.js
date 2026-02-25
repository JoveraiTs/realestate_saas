require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Tenant = require("./src/models/Tenant");
const tenantRoutes = require("./src/routes/tenant.routes");
const authRoutes = require("./src/routes/auth.routes");
const publicRoutes = require("./src/routes/public.routes");
const saasRoutes = require("./src/routes/saas.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const websiteRoutes = require("./src/routes/website.routes");
const propertyRoutes = require("./src/routes/property.routes");
const tenantResolver = require("./src/middleware/tenantResolver");
const masterAuth = require("./src/middleware/masterAuth");
const app = express();
const mongoUri = process.env.MONGO_MAIN_URI || "mongodb://127.0.0.1:27017/master_realestate_saas";
const BASE_DOMAIN = (process.env.BASE_DOMAIN || "").toLowerCase().trim();
const API_DOMAIN = (process.env.API_DOMAIN || "").toLowerCase().trim();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = (url.hostname || "").toLowerCase();

    if (BASE_DOMAIN && (hostname === BASE_DOMAIN || hostname.endsWith(`.${BASE_DOMAIN}`))) {
      return true;
    }

    if (API_DOMAIN && hostname === API_DOMAIN) {
      return true;
    }
  } catch {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);
      const host = (url.hostname || "").toLowerCase();
      return host === "localhost" || host === "127.0.0.1";
    } catch {
      return false;
    }
  }

  return false;
};

app.set("trust proxy", true);

if (process.env.NODE_ENV === "production") {
  const requiredEnv = ["JWT_SECRET", "MONGO_MAIN_URI", "BASE_DOMAIN", "API_DOMAIN"];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variable(s): ${missing.join(", ")}`);
    process.exit(1);
  }
}

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Dynamic, safe CORS ---
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));

// --- Connect to MongoDB ---
mongoose.connect(mongoUri)
  .then(() => console.log("✅ Connected to Master DB"))
  .catch(err => console.error("❌ Central DB connection error:", err.message));

// --- API routes ---
app.use("/api/tenants", tenantRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/saas", saasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/website", websiteRoutes);
app.use("/api/properties", propertyRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    service: "realestate_saas_api",
    status: "ok",
    message: "API is running",
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/healthz/config", masterAuth, (req, res) => {
  const requiredVars = ["JWT_SECRET", "MONGO_MAIN_URI", "BASE_DOMAIN", "API_DOMAIN"];
  const env = requiredVars.reduce((acc, key) => {
    acc[key] = Boolean(process.env[key]);
    return acc;
  }, {});

  const allPresent = requiredVars.every((key) => env[key]);

  res.status(200).json({
    status: allPresent ? "ok" : "warning",
    mode: process.env.NODE_ENV || "development",
    required: env,
  });
});

// --- Tenant lookup route ---
app.get("/api/tenant-details", tenantResolver, async (req, res) => {
  try {
    const tenant = req.tenant;

    // Build logo URL
    const MINIO_PUBLIC_URL = (process.env.MINIO_PUBLIC_URL || "").replace(/\/$/, "");
    const logoUrl = tenant.logo
      ? (MINIO_PUBLIC_URL ? `${MINIO_PUBLIC_URL}/${tenant.logo}` : tenant.logo)
      : null;

    res.json({
      name: tenant.name,
      email: tenant.email,
      subdomain: tenant.subdomain,
      status: tenant.status,
      plan: tenant.plan,
      logo: logoUrl,
      planStartDate: tenant.planStartDate,
      planEndDate: tenant.planEndDate,
      trialActive: tenant.trialActive,
      trialEndsAt: tenant.trialEndsAt,
      dbCreated: tenant.dbCreated,
    });
  } catch (err) {
    console.error("❌ Get tenant error:", err);
    res.status(500).json({ error: err.message });
  }
});




// // --- Serve React frontend in production ---
// if (process.env.NODE_ENV === 'production') {
//   const frontendPath = path.resolve(__dirname, '../frontend/build');
//   app.use(express.static(frontendPath));

//   // Catch-all for SPA routes
//   app.use((req, res) => {
//     res.sendFile(path.join(frontendPath, 'index.html'));
//   });
// }

// --- Start server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
