const requestBuckets = new Map();

const now = () => Date.now();

const getClientIp = (req) => {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (forwarded.length > 0) return forwarded[0];
  return req.ip || req.connection?.remoteAddress || "unknown";
};

const createRateLimiter = ({ windowMs, max, keyPrefix, message }) => (req, res, next) => {
  const timestamp = now();
  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  const entries = requestBuckets.get(key) || [];

  const validEntries = entries.filter((entry) => timestamp - entry < windowMs);
  if (validEntries.length >= max) {
    const retryAfterMs = windowMs - (timestamp - validEntries[0]);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return res.status(429).json({
      error: message || "Too many requests. Please try again later.",
      retryAfterSeconds,
    });
  }

  validEntries.push(timestamp);
  requestBuckets.set(key, validEntries);
  return next();
};

const registrationHoneypot = (req, res, next) => {
  const honeypotValue = String(
    req.body?.website || req.body?.companyWebsite || req.body?.faxNumber || ""
  ).trim();

  if (honeypotValue) {
    return res.status(400).json({ error: "Invalid registration request" });
  }

  return next();
};

module.exports = {
  createRateLimiter,
  registrationHoneypot,
};
