const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

// Create a connection specifically for BullMQ
const connection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // This is required for BullMQ
  retryStrategy: (times) => {
    if (times > 10) {
      console.error("❌ Redis unavailable after 10 retries. Stopping reconnect attempts.");
      return null;
    }
    console.log(`🔁 Redis reconnect attempt #${times}`);
    return Math.min(times * 500, 5000);
  },
});

connection.on("connect", () => console.log("✅ Redis connected"));
connection.on("error", (err) => console.error("❌ Redis error:", err.message));

module.exports = connection;