const IORedis = require("ioredis");

const connection = new IORedis({
  host: process.env.REDIS_HOST || "redis", // docker-compose service name
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // required for BullMQ
});

connection.on("connect", () => console.log("✅ Redis connected"));
connection.on("error", (err) => console.error("❌ Redis error:", err));

module.exports = connection;
