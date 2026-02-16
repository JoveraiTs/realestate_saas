const { Worker } = require("bullmq");
const nodemailer = require("nodemailer");
const connection = require("../config/redis");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,       // Gmail address
    pass: process.env.GMAIL_PASSWORD,   // App password
  },
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("Processing email job:", job.data);

    const { to, subject, html } = job.data;

    await transporter.sendMail({
      from: `"RealEstate SaaS" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent to:", to);
  },
  { connection }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.log(`Job ${job.id} failed`, err));
