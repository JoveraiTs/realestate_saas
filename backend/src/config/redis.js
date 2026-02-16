const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

// Create a connection specifically for BullMQ
const connection = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // This is required for BullMQ
  retryStrategy: (times) => {
    console.log(`🔁 Redis reconnect attempt #${times}`);
    return Math.min(times * 500, 5000);
  },
});

connection.on("connect", () => console.log("✅ Redis connected"));
connection.on("error", (err) => console.error("❌ Redis error:", err.message));

module.exports = connection;