const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const { getPool } = require("../config_postgres");
const { redis } = require("../config_redis");

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

function generateOtp() {
  return String(
    crypto.randomInt(100000, 1000000)
  );
}

router.post("/forgot-password", async (req, res) => {
  let client;

  try {
    const email = normalizeEmail(req.body?.email);

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        error: "Please enter a valid email address",
      });
    }

    const rateLimitKey =
      `password-reset:requests:${email}`;

    const requestCount =
      await redis.incr(rateLimitKey);

    if (requestCount === 1) {
      await redis.expire(
        rateLimitKey,
        15 * 60
      );
    }

    if (requestCount > 5) {
      return res.json({
        message:
          "If an account exists for this email, a verification code has been sent.",
      });
    }

    client = await getPool().connect();

    const result = await client.query(
      `SELECT id, email
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (!result.rows.length) {
      return res.json({
        message:
          "If an account exists for this email, a verification code has been sent.",
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const otpKey =
      `password-reset:otp:${email}`;

    await redis.set(
      otpKey,
      otpHash,
      {
        EX: 600,
      }
    );

    await redis.del(
      `password-reset:attempts:${email}`
    );

    const from =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to: email,
      subject: "Your Shortify password reset code",
      text:
        `Your Shortify password reset code is ${otp}.\n\n` +
        `This code expires in 10 minutes.\n\n` +
        `If you did not request a password reset, you can ignore this email.`,
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 560px;
          margin: 0 auto;
          padding: 32px;
        ">
          <h2 style="margin-bottom: 8px;">
            Reset your Shortify password
          </h2>

          <p style="color: #555;">
            Use the verification code below to reset your password.
          </p>

          <div style="
            margin: 24px 0;
            padding: 18px;
            background: #f5f7fa;
            border: 1px solid #e2e6eb;
            border-radius: 8px;
            text-align: center;
            font-size: 30px;
            font-weight: 700;
            letter-spacing: 6px;
          ">
            ${otp}
          </div>

          <p style="color: #555;">
            This code expires in <strong>10 minutes</strong>.
          </p>

          <p style="
            color: #777;
            font-size: 13px;
          ">
            If you didn't request a password reset,
            you can safely ignore this email.
          </p>

          <p style="margin-top: 28px;">
            — Shortify
          </p>
        </div>
      `,
    });

    return res.json({
      message:
        "If an account exists for this email, a verification code has been sent.",
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to process password reset request",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.post("/reset-password", async (req, res) => {
  let client;

  try {
    const email = normalizeEmail(
      req.body?.email
    );

    const otp = String(
      req.body?.otp || ""
    ).trim();

    const newPassword = String(
      req.body?.newPassword || ""
    );

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        error:
          "Enter the 6-digit verification code",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error:
          "Password must be at least 6 characters",
      });
    }

    const attemptsKey =
      `password-reset:attempts:${email}`;

    const attempts =
      await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(
        attemptsKey,
        600
      );
    }

    if (attempts > 5) {
      return res.status(429).json({
        error:
          "Too many incorrect attempts. Please request a new code.",
      });
    }

    const otpKey =
      `password-reset:otp:${email}`;

    const storedOtpHash =
      await redis.get(otpKey);

    if (!storedOtpHash) {
      return res.status(400).json({
        error:
          "Verification code expired. Please request a new one.",
      });
    }

    const submittedOtpHash =
      hashOtp(otp);

    if (
      submittedOtpHash !==
      storedOtpHash
    ) {
      return res.status(400).json({
        error:
          "Invalid verification code",
      });
    }

    client = await getPool().connect();

    const userResult = await client.query(
      `SELECT id
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (!userResult.rows.length) {
      return res.status(400).json({
        error:
          "Unable to reset password",
      });
    }

    const userId =
      Number(userResult.rows[0].id);

    const bcrypt =
      require("bcryptjs");

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        10
      );

    await client.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [
        passwordHash,
        userId,
      ]
    );

    await redis.del(otpKey);
    await redis.del(attemptsKey);
    await redis.del(
      `password-reset:requests:${email}`
    );

    return res.json({
      message:
        "Password reset successful",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to reset password",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;