const Tenant = require("../models/Tenant");

module.exports = async (req, res, next) => {
  try {
    let origin = req.headers.origin || "";
    let frontendDomain = "";
    let subdomain = "";

    // 1️⃣ Try to parse Origin header (e.g. http://zjconsultancies.local:3000)
    if (origin) {
      try {
        const url = new URL(origin);
        frontendDomain = url.hostname; // e.g. "zjconsultancies.local"
        subdomain = frontendDomain.split(".")[0]; // e.g. "zjconsultancies"
      } catch (e) {
        console.warn("⚠️ Invalid Origin header:", origin);
      }
    }

    // 2️⃣ If Origin not provided, fallback to Host header
    if (!frontendDomain) {
      const host = req.headers.host?.split(":")[0];
      frontendDomain = host || "";
      subdomain = frontendDomain.split(".")[0];
    }

    console.log("🌍 Tenant lookup — Domain:", frontendDomain, "| Subdomain:", subdomain);

    // 3️⃣ Try finding tenant by domain first
    let tenant = await Tenant.findOne({
      domain: frontendDomain,
      status: "approved"
    });

    // 4️⃣ Fallback: find by subdomain
    if (!tenant && subdomain) {
      tenant = await Tenant.findOne({
        subdomain,
        status: "approved"
      });
    }

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found for this domain" });
    }

    // 5️⃣ Attach tenant to request
    req.tenant = tenant;
    next();

  } catch (err) {
    console.error("❌ Tenant Resolver Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
