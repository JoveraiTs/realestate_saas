const jwt = require("jsonwebtoken");
const MasterUser = require("../models/MasterUser");
const JWT_SECRET = process.env.JWT_SECRET || "global_secret_key";

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.tokenType !== "master") {
      return res.status(403).json({ error: "Forbidden: Invalid token type" });
    }

    const masterUser = await MasterUser.findById(decoded.id);
    if (!masterUser || !masterUser.isActive) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    req.masterUser = masterUser;
    next();
  } catch (error) {
    console.error("❌ Master auth error:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
