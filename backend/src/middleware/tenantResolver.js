const Tenant = require("../models/Tenant");

const BASE_DOMAIN = (process.env.BASE_DOMAIN || "luxury-uaeproperty.com").toLowerCase();
const API_DOMAIN = (process.env.API_DOMAIN || `api.${BASE_DOMAIN}`).toLowerCase();

const stripPort = (value = "") => value.split(":")[0].trim().toLowerCase();

const parseHostFromUrl = (rawUrl = "") => {
  if (!rawUrl) return "";
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const normalizeSubdomain = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const resolveCandidateHosts = (req) => {
  const originHost = parseHostFromUrl(req.headers.origin || "");
  const refererHost = parseHostFromUrl(req.headers.referer || "");
  const forwardedHost = stripPort(req.headers["x-forwarded-host"] || "");
  const tenantHeaderHost = stripPort(req.headers["x-tenant-host"] || req.headers["x-tenant-domain"] || "");
  const hostHeader = stripPort(req.headers.host || "");

  const hosts = [
    tenantHeaderHost,
    originHost,
    refererHost,
    forwardedHost,
    hostHeader,
  ].filter(Boolean);

  return Array.from(new Set(hosts));
};

const extractSubdomain = (host) => {
  if (!host || host === "localhost" || host === "127.0.0.1") return "";
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    return host.slice(0, host.length - (`.${BASE_DOMAIN}`).length);
  }
  if (host.endsWith(".localhost")) {
    return host.replace(".localhost", "");
  }
  const parts = host.split(".");
  return parts.length > 2 ? parts[0] : "";
};

module.exports = async (req, res, next) => {
  try {
    const candidateHosts = resolveCandidateHosts(req);
    const explicitSubdomain = normalizeSubdomain(
      req.headers["x-tenant-subdomain"] || req.query.subdomain || req.query.tenant || ""
    );
    const filteredHosts = candidateHosts.filter(
      (host) => host && host !== API_DOMAIN && host !== `www.${BASE_DOMAIN}`
    );

    let tenant = null;
    let resolvedHost = "";

    if (explicitSubdomain) {
      tenant = await Tenant.findOne({ status: "approved", subdomain: explicitSubdomain });
      if (tenant) {
        req.tenant = tenant;
        req.tenantHost = `${explicitSubdomain}.${BASE_DOMAIN}`;
        return next();
      }
    }

    for (const host of filteredHosts) {
      tenant = await Tenant.findOne({
        status: "approved",
        $or: [{ domain: host }, { subdomain: extractSubdomain(host) }],
      });

      if (tenant) {
        resolvedHost = host;
        break;
      }
    }

    if (!tenant) {
      const redirectTo = `https://www.${BASE_DOMAIN}`;
      return res.status(404).json({
        message: "Tenant not found for this domain",
        hint: "Provide approved tenant host, or pass ?subdomain=<tenant-subdomain> for local/proxy testing",
        redirectTo,
      });
    }

    req.tenant = tenant;
    req.tenantHost = resolvedHost;
    return next();
  } catch (err) {
    console.error("❌ Tenant Resolver Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
