const { Queue } = require("bullmq");
const redis = require("../config/redis");

const emailQueue = new Queue("email-queue", {
  connection: redis,
});

module.exports = emailQueue;
