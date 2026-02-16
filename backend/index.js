require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Tenant = require("./src/models/Tenant");
const tenantRoutes = require("./src/routes/tenant.routes");
const authRoutes = require("./src/routes/auth.routes");
const tenantResolver = require("./src/middleware/tenantResolver")
const app = express();

// --- Middleware ---
app.use(express.json());

// --- Dynamic, safe CORS ---
app.use(cors());

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_MAIN_URI)
  .then(() => console.log("✅ Connected to Master DB"))
  .catch(err => console.error("❌ Central DB connection error:", err));

// --- API routes ---
app.use("/api/tenants", tenantRoutes);
app.use("/api/auth", authRoutes);

// --- Tenant lookup route ---
app.get("/api/tenant-details", tenantResolver, async (req, res) => {
  try {
    const tenant = req.tenant;

    // Build logo URL
    const MINIO_PUBLIC_URL = "https://producers-praise-buzz-chan.trycloudflare.com";
    const logoUrl = tenant.logo ? `${MINIO_PUBLIC_URL}/${tenant.logo}` : null;

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
