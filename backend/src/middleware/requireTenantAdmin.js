const normalize = (value = "") => String(value).trim().toLowerCase();

module.exports = (req, res, next) => {
  const roleName = normalize(req.user?.role?.name || req.auth?.role || "");
  if (roleName === "admin" || roleName === "super_admin") {
    return next();
  }

  return res.status(403).json({ error: "Forbidden: Admin access required" });
};
