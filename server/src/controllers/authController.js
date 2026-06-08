const bcrypt = require("bcrypt");
const { randomInt } = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { emailErrorDetails, sendRegistrationOtpEmail } = require("../utils/email");

const allowedPublicRoles = ["CUSTOMER", "SCHOOL_OWNER"];
const otpExpiryMs = 10 * 60 * 1000;
const maxOtpAttempts = 5;
const resendCooldownMs = 60 * 1000;

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

const register = async (req, res) => registerStart(req, res);

const registerStart = async (req, res) => {
  try {
    const input = normalizeRegistrationInput(req.body);
    const validationMessage = validateRegistrationInput(input);

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const existingMessage = await getExistingUserMessage(input.email, input.phone);

    if (existingMessage) {
      return res.status(409).json({
        success: false,
        message: existingMessage,
      });
    }

    const otp = generateOtp();
    const [passwordHash, otpHash] = await Promise.all([
      bcrypt.hash(input.password, 10),
      bcrypt.hash(otp, 10),
    ]);

    await pool.query("DELETE FROM registration_otps WHERE email = $1", [input.email]);

    await pool.query(
      `INSERT INTO registration_otps
       (full_name, email, phone, password_hash, role, school_name, otp_hash, expires_at, last_sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        input.fullName,
        input.email,
        input.phone,
        passwordHash,
        input.role,
        input.schoolName || null,
        otpHash,
        new Date(Date.now() + otpExpiryMs),
      ]
    );

    try {
      await sendRegistrationOtpEmail(input.email, otp);
    } catch (error) {
      console.error("Send registration OTP error:", emailErrorDetails(error));
      await pool.query("DELETE FROM registration_otps WHERE email = $1", [input.email]);

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP. Please try again.",
      });
    }

    return res.json({
      success: true,
      message: "OTP sent to your email.",
      email: input.email,
    });
  } catch (error) {
    console.error("Register start error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

const registerVerify = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = cleanText(req.body?.otp);

  if (!email || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pendingResult = await client.query(
      `SELECT *
       FROM registration_otps
       WHERE email = $1
       FOR UPDATE`,
      [email]
    );

    if (pendingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const pending = pendingResult.rows[0];

    if (new Date(pending.expires_at).getTime() < Date.now()) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }

    if (Number(pending.attempts) >= maxOtpAttempts) {
      await client.query("ROLLBACK");
      return res.status(429).json({
        success: false,
        message: "Maximum OTP attempts reached. Please resend OTP.",
      });
    }

    const isOtpCorrect = await bcrypt.compare(otp, pending.otp_hash);

    if (!isOtpCorrect) {
      const nextAttempts = Number(pending.attempts) + 1;
      await client.query(
        `UPDATE registration_otps
         SET attempts = $1, updated_at = NOW()
         WHERE id = $2`,
        [nextAttempts, pending.id]
      );
      await client.query("COMMIT");

      return res.status(400).json({
        success: false,
        message: nextAttempts >= maxOtpAttempts
          ? "Maximum OTP attempts reached. Please resend OTP."
          : "Invalid OTP",
      });
    }

    const existingMessage = await getExistingUserMessage(pending.email, pending.phone, client);

    if (existingMessage) {
      await client.query("DELETE FROM registration_otps WHERE id = $1", [pending.id]);
      await client.query("COMMIT");

      return res.status(409).json({
        success: false,
        message: existingMessage,
      });
    }

    const userResult = await client.query(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role, status, email_verified, phone_verified)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', true, false)
       RETURNING id, full_name, email, phone, role, status, created_at`,
      [
        pending.full_name,
        pending.email,
        pending.phone,
        pending.password_hash,
        pending.role,
      ]
    );

    await client.query("DELETE FROM registration_otps WHERE id = $1", [pending.id]);
    await client.query("COMMIT");

    const user = userResult.rows[0];
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Register verify error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  } finally {
    client.release();
  }
};

const registerResend = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const pendingResult = await pool.query(
      `SELECT id, email, last_sent_at
       FROM registration_otps
       WHERE email = $1`,
      [email]
    );

    if (pendingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Please start registration again.",
      });
    }

    const pending = pendingResult.rows[0];
    const lastSentAt = pending.last_sent_at ? new Date(pending.last_sent_at).getTime() : 0;
    const elapsedMs = Date.now() - lastSentAt;

    if (lastSentAt && elapsedMs < resendCooldownMs) {
      const seconds = Math.ceil((resendCooldownMs - elapsedMs) / 1000);

      return res.status(429).json({
        success: false,
        message: `Please wait ${seconds} seconds before resending OTP.`,
      });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await pool.query(
      `UPDATE registration_otps
       SET otp_hash = $1,
           expires_at = $2,
           attempts = 0,
           resend_count = resend_count + 1,
           last_sent_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [otpHash, new Date(Date.now() + otpExpiryMs), pending.id]
    );

    try {
      await sendRegistrationOtpEmail(email, otp);
    } catch (error) {
      console.error("Resend registration OTP error:", emailErrorDetails(error));

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP. Please try again.",
      });
    }

    return res.json({
      success: true,
      message: "OTP resent to your email.",
    });
  } catch (error) {
    console.error("Register resend error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT id, full_name, email, phone, password_hash, role, status
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
      user.id,
    ]);

    delete user.password_hash;

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

function normalizeRegistrationInput(body = {}) {
  return {
    fullName: cleanText(body.full_name ?? body.fullName ?? body.name),
    email: normalizeEmail(body.email),
    phone: cleanText(body.phone),
    password: String(body.password || ""),
    role: cleanText(body.role || "CUSTOMER").toUpperCase(),
    schoolName: cleanText(body.school_name ?? body.schoolName),
  };
}

function validateRegistrationInput(input) {
  if (!input.fullName || !input.email || !input.phone || !input.password) {
    return "Full name, email, phone, and password are required";
  }

  if (input.password.length < 6) {
    return "Password must be at least 6 characters";
  }

  if (!allowedPublicRoles.includes(input.role)) {
    return "Invalid role for public registration";
  }

  if (input.role === "SCHOOL_OWNER" && !input.schoolName) {
    return "Driving school name is required";
  }

  return "";
}

async function getExistingUserMessage(email, phone, client = pool) {
  const existingUser = await client.query(
    `SELECT email, phone
     FROM users
     WHERE email = $1 OR phone = $2
     LIMIT 1`,
    [email, phone]
  );

  if (!existingUser.rows.length) return "";

  const existing = existingUser.rows[0];
  if (normalizeEmail(existing.email) === email) return "Email already registered";
  if (cleanText(existing.phone) === phone) return "Phone already registered";
  return "User with this email or phone already exists";
}

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

module.exports = {
  register,
  registerStart,
  registerVerify,
  registerResend,
  login,
};
