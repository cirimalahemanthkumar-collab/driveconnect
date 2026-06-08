const dns = require("dns").promises;
const nodemailer = require("nodemailer");

function boolFromEnv(value) {
  return String(value || "").trim().toLowerCase() === "true";
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
  };
}

async function sendRegistrationOtpEmail(email, otp) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER is required");
  }

  const transporter = await createSmtpTransporter();

  await transporter.sendMail({
    from,
    to: email,
    subject: "DriveConnect verification code",
    text: [
      `Your DriveConnect verification code is: ${otp}`,
      "This code expires in 10 minutes.",
      "If you did not request this, ignore this email.",
    ].join("\n"),
  });
}

module.exports = {
  emailErrorDetails,
  sendRegistrationOtpEmail,
};
