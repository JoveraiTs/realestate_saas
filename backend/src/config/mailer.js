const nodemailer = require("nodemailer");

const smtpHost = String(process.env.SMTP_HOST || "").trim();
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = String(process.env.SMTP_SECURE || (smtpPort === 465 ? "true" : "false")).toLowerCase() === "true";
const smtpUser = String(process.env.SMTP_USER || "").trim();
const smtpPass = String(process.env.SMTP_PASS || "").trim();
const defaultFrom = String(process.env.SMTP_FROM_EMAIL || smtpUser || "no-reply@localhost").trim();
const deliveryMode = String(process.env.EMAIL_DELIVERY_MODE || "auto").trim().toLowerCase();

const httpEndpoint = String(process.env.EMAIL_HTTP_ENDPOINT || "").trim();
const httpAuthToken = String(process.env.EMAIL_HTTP_AUTH_TOKEN || "").trim();
const httpAuthHeader = String(process.env.EMAIL_HTTP_AUTH_HEADER || "Authorization").trim();
const httpTimeoutMs = Number(process.env.EMAIL_HTTP_TIMEOUT_MS || 10000);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpUser && smtpPass
    ? {
      user: smtpUser,
      pass: smtpPass,
    }
    : undefined,
});

const canSendEmail = () => Boolean(smtpHost && smtpPort && smtpUser && smtpPass);

const canSendHttpEmail = () => Boolean(httpEndpoint);

const getDefaultFrom = () => defaultFrom;

const sendMailViaHttpApi = async (message = {}) => {
  if (!canSendHttpEmail()) {
    throw new Error("HTTP email fallback is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(httpTimeoutMs) ? httpTimeoutMs : 10000);

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (httpAuthToken) {
      headers[httpAuthHeader] =
        httpAuthHeader.toLowerCase() === "authorization"
          ? `Bearer ${httpAuthToken}`
          : httpAuthToken;
    }

    const response = await fetch(httpEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: message.from || defaultFrom,
        to: message.to,
        subject: message.subject,
        html: message.html,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP email fallback failed (${response.status}): ${text || "no response body"}`);
    }

    return { deliveredVia: "http", status: response.status };
  } finally {
    clearTimeout(timeout);
  }
};

const sendMailSafe = async (message = {}) => {
  const payload = {
    ...message,
    from: message.from || defaultFrom,
  };

  if (deliveryMode === "http") {
    try {
      return await sendMailViaHttpApi(payload);
    } catch (error) {
      console.error("❌ HTTP email send failed:", error.message);
      return { skipped: true, reason: error.message };
    }
  }

  if (deliveryMode === "smtp") {
    if (!canSendEmail()) {
      console.warn("⚠️ SMTP mode selected but SMTP is not fully configured. Skipping email delivery.");
      return { skipped: true };
    }

    try {
      return await transporter.sendMail(payload);
    } catch (error) {
      console.error("❌ SMTP email send failed:", error.message);
      return { skipped: true, reason: error.message };
    }
  }

  if (canSendEmail()) {
    try {
      return await transporter.sendMail(payload);
    } catch (error) {
      console.warn("⚠️ SMTP delivery failed, trying HTTP fallback:", error.message);
    }
  }

  if (canSendHttpEmail()) {
    try {
      return await sendMailViaHttpApi(payload);
    } catch (error) {
      console.error("❌ HTTP email fallback failed:", error.message);
      return { skipped: true, reason: error.message };
    }
  }

  console.warn("⚠️ No working email transport configured. Skipping email delivery.");
  return { skipped: true };
};

module.exports = {
  transporter,
  canSendEmail,
  getDefaultFrom,
  sendMailSafe,
};
