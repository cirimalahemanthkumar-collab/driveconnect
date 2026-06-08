const dns = require("dns").promises;
const nodemailer = require("nodemailer");

const brevoEndpoint = "https://api.brevo.com/v3/smtp/email";
const emailTimeoutMs = 15000;

function boolFromEnv(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function emailProvider() {
  return String(process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
}

function shouldUseBrevoApi() {
  return emailProvider() === "brevo_api" || Boolean(process.env.BREVO_API_KEY);
}

function smtpPort() {
  const port = Number(process.env.SMTP_PORT || 465);
  return Number.isFinite(port) ? port : 465;
}

function smtpAuth() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS are required");
  }

  return {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

async function createSmtpTransporter() {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  let connectHost = smtpHost;

  try {
    const addresses = await dns.resolve4(smtpHost);
    if (addresses.length > 0) {
      connectHost = addresses[0];
    }
  } catch (error) {
    console.warn("SMTP IPv4 resolve failed, falling back to host:", {
      message: error?.message,
      code: error?.code,
    });
  }

  return nodemailer.createTransport({
    host: connectHost,
    port: smtpPort(),
    secure: boolFromEnv(process.env.SMTP_SECURE),
    auth: smtpAuth(),
    tls: {
      servername: smtpHost,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

function emailErrorDetails(error) {
  return {
    message: error?.message,
    code: error?.code,
    command: error?.command,
    responseCode: error?.responseCode,
    status: error?.status,
    responseText: error?.responseText,
    provider: error?.provider,
  };
}

async function sendRegistrationOtpEmail(email, otp) {
  const subject = "DriveConnect verification code";
  const text = [
    `Your DriveConnect verification code is: ${otp}`,
    "This code expires in 10 minutes.",
    "If you did not request this, ignore this email.",
  ].join("\n");
  const html = [
    "<p>Your DriveConnect verification code is:</p>",
    `<p><strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong></p>`,
    "<p>This code expires in 10 minutes.</p>",
    "<p>If you did not request this, ignore this email.</p>",
  ].join("");

  if (shouldUseBrevoApi()) {
    await sendBrevoEmail({ to: email, subject, text, html });
    return;
  }

  await sendSmtpEmail({ to: email, subject, text });
}

async function sendSmtpEmail({ to, subject, text }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER is required");
  }

  const transporter = await createSmtpTransporter();

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}

async function sendBrevoEmail({ to, subject, text, html }) {
  assertBrevoConfig();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), emailTimeoutMs);

  try {
    const response = await fetch(brevoEndpoint, {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "DriveConnect",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error("Brevo API email request failed");
      error.provider = "brevo_api";
      error.status = response.status;
      error.responseText = safeResponseText(await response.text());
      throw error;
    }
  } catch (error) {
    if (error?.provider) throw error;

    const wrappedError = new Error(error?.message || "Brevo API email request failed");
    wrappedError.provider = "brevo_api";
    wrappedError.code = error?.code;
    wrappedError.status = error?.status;
    wrappedError.responseText = error?.responseText;
    throw wrappedError;
  } finally {
    clearTimeout(timeout);
  }
}

function assertBrevoConfig() {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    const error = new Error("BREVO_API_KEY and BREVO_SENDER_EMAIL are required for Brevo API email");
    error.provider = "brevo_api";
    throw error;
  }
}

function safeResponseText(value) {
  return String(value || "").slice(0, 500);
}

module.exports = {
  emailErrorDetails,
  sendRegistrationOtpEmail,
};
