require("dotenv").config();
const { Worker, Queue } = require("bullmq");
const redis = require("../config/redis");
const { transporter, getDefaultFrom } = require("../config/mailer");

const failedQueue = new Queue("email-dlq", {
  connection: redis,

});

new Worker(
  "email-queue",
  async job => {
    const { to, from, subject, html } = job.data;

    await transporter.sendMail({
      from: from || getDefaultFrom(),
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}`);
  },
  {
    connection: redis,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
).on("failed", async (job, err) => {
  await failedQueue.add("failed-email", {
    jobId: job.id,
    error: err.message,
    data: job.data,
  });
});
