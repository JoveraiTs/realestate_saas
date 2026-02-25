const { Queue } = require("bullmq");
const { sendMailSafe, getDefaultFrom } = require("../config/mailer");
const isEmailQueueEnabled = process.env.ENABLE_EMAIL_QUEUE === "true";

let emailQueue;

if (isEmailQueueEnabled) {
  const redis = require("../config/redis");
  const queue = new Queue("email-queue", {
    connection: redis,
  });

  emailQueue = {
    add: async (name, payload = {}) => {
      const safePayload = {
        ...payload,
        from: payload.from || getDefaultFrom(),
      };
      return queue.add(name, safePayload);
    },
  };
} else {
  emailQueue = {
    add: async (_name, payload = {}) => {
      console.warn("⚠️ Email queue disabled. Sending email immediately.");
      try {
        return await sendMailSafe({
          ...payload,
          from: payload.from || getDefaultFrom(),
        });
      } catch (error) {
        console.error("❌ Immediate email send failed:", error.message);
        return {
          skipped: true,
          reason: error.message,
        };
      }
    },
  };
}

module.exports = emailQueue;
