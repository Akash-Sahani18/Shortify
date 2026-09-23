require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const { initPostgres, getPool } = require("./config_postgres");
const { initRedis, redis } = require("./config_redis");

const analyticsRoutes = require("./routes/analytics");
const guardianRoutes = require("./routes/guardian");
const passwordResetRoutes = require("./routes/passwordReset");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

const PORT = process.env.PORT || 3000;

const BASE_URL =
  process.env.BASE_URL ||
  `http://localhost:${PORT}`;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing from .env");
  process.exit(1);
}

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://s.shrtfy.cloud",
      "https://shrtfy.cloud",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api", passwordResetRoutes);

async function rateLimit(req, res, next) {
  try {
    const ip = req.ip || "unknown";
    const key = `rate:${ip}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 60);
    }

    if (count > 100) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("RATE LIMIT ERROR:", error);
    next();
  }
}

app.use("/api", rateLimit);

function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.slice(7);

    return jwt.verify(
      token,
      process.env.JWT_SECRET
    );
  } catch (error) {
    if (error.name !== "TokenExpiredError") {
      console.error(
        "JWT VERIFY ERROR:",
        error.message
      );
    }

    return null;
  }
}

app.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    service: "Shortify API",
  });
});

app.post("/api/register", async (req, res) => {
  let client;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    client = await getPool().connect();

    const existingUser = await client.query(
      `SELECT id
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (
         email,
         password_hash
       )
       VALUES ($1, $2)
       RETURNING id`,
      [
        normalizedEmail,
        passwordHash,
      ]
    );

    const userId = Number(result.rows[0].id);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: userId,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    return res.status(500).json({
      error: "Registration failed",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.post("/api/login", async (req, res) => {
  let client;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    client = await getPool().connect();

    const result = await client.query(
      `SELECT
         id,
         email,
         password_hash
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: Number(user.id),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: Number(user.id),
        email: user.email,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      error: "Login failed",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.post("/api/short", async (req, res) => {
  let client;

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const {
      originalUrl,
      customAlias,
      expiresAt,
    } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        error: "Original URL is required",
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      return res.status(400).json({
        error: "Invalid URL",
      });
    }

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      return res.status(400).json({
        error: "Only HTTP and HTTPS URLs are supported",
      });
    }

    if (customAlias) {
      if (!/^[A-Za-z0-9_-]{3,32}$/.test(customAlias)) {
        return res.status(400).json({
          error:
            "Custom alias must be 3-32 characters and contain only letters, numbers, _ or -",
        });
      }
    }

    if (expiresAt) {
      const expiration = new Date(expiresAt);

      if (
        Number.isNaN(expiration.getTime()) ||
        expiration <= new Date()
      ) {
        return res.status(400).json({
          error: "Expiration date must be in the future",
        });
      }
    }

    const shortCode = customAlias || nanoid(6);

    client = await getPool().connect();

    const existing = await client.query(
      `SELECT id
       FROM short_urls
       WHERE short_code = $1`,
      [shortCode]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        error: "Short code already exists",
      });
    }

    const result = await client.query(
      `INSERT INTO short_urls (
         user_id,
         short_code,
         original_url,
         click_count,
         status,
         expires_at
       )
       VALUES (
         $1,
         $2,
         $3,
         0,
         'active',
         $4
       )
       RETURNING id`,
      [
        Number(user.id),
        shortCode,
        originalUrl,
        expiresAt ? new Date(expiresAt) : null,
      ]
    );

    const id = Number(result.rows[0].id);

    const shortUrl = `${BASE_URL}/${shortCode}`;

    const qrCode = await QRCode.toDataURL(shortUrl);

    return res.status(201).json({
      id,
      shortCode,
      shortUrl,
      qrCode,
    });
  } catch (error) {
    console.error("SHORT URL ERROR:", error);

    return res.status(500).json({
      error: "Failed to create short link",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/* =========================================================
   GET QR CODE FOR EXISTING SHORT URL
   ========================================================= */

app.get("/api/short/:id/qr", async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid link ID",
      });
    }

    const result = await getPool().query(
      `SELECT
         short_code,
         status,
         expires_at
       FROM short_urls
       WHERE id = $1
         AND user_id = $2`,
      [
        id,
        Number(user.id),
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Link not found",
      });
    }

    const row = result.rows[0];

    if (row.status !== "active") {
      return res.status(410).json({
        error: "This short link is no longer active",
      });
    }

    if (
      row.expires_at &&
      new Date(row.expires_at) <= new Date()
    ) {
      return res.status(410).json({
        error: "This short link has expired",
      });
    }

    const shortUrl =
      `${BASE_URL}/${row.short_code}`;

    const qrCode =
      await QRCode.toDataURL(shortUrl);

    return res.json({
      qrCode,
      shortUrl,
    });
  } catch (error) {
    console.error("QR CODE ERROR:", error);

    return res.status(500).json({
      error: "Failed to generate QR code",
    });
  }
});

app.delete("/api/short/:id", async (req, res) => {
  let client;

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    client = await getPool().connect();

    const result = await client.query(
      `UPDATE short_urls
       SET status = 'disabled'
       WHERE id = $1
         AND user_id = $2`,
      [
        Number(req.params.id),
        Number(user.id),
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Link not found",
      });
    }

    const linkResult = await client.query(
      `SELECT short_code
       FROM short_urls
       WHERE id = $1
         AND user_id = $2`,
      [
        Number(req.params.id),
        Number(user.id),
      ]
    );

    if (linkResult.rows.length) {
      await redis.del(
        `url:${linkResult.rows[0].short_code}`
      );
    }

    return res.json({
      message: "Short link disabled",
    });
  } catch (error) {
    console.error(
      "DELETE SHORT URL ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to disable short link",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/:shortCode", async (req, res) => {
  let client;

  try {
    const { shortCode } = req.params;
    const cacheKey = `url:${shortCode}`;

    let cached = await redis.get(cacheKey);

    let destination;
    let linkStatus;
    let expiresAt;
    let shortUrlId;

    if (cached) {
      try {
        const cachedLink = JSON.parse(cached);

        destination = cachedLink.destination;
        linkStatus = cachedLink.status;
        expiresAt = cachedLink.expiresAt;
        shortUrlId = Number(cachedLink.id);
      } catch (error) {
        console.error(
          "REDIS CACHE PARSE ERROR:",
          error
        );

        await redis.del(cacheKey);
        cached = null;
      }
    }

    if (!cached) {
      client = await getPool().connect();

      const result = await client.query(
        `SELECT
           id,
           original_url,
           status,
           expires_at
         FROM short_urls
         WHERE short_code = $1`,
        [shortCode]
      );

      if (!result.rows.length) {
        return res.status(404).send(
          "Short link not found"
        );
      }

      const row = result.rows[0];

      shortUrlId = Number(row.id);
      destination = row.original_url;
      linkStatus = row.status;
      expiresAt = row.expires_at;

      if (linkStatus !== "active") {
        return res.status(410).send(
          "This short link is no longer active"
        );
      }

      if (
        expiresAt &&
        new Date(expiresAt) <= new Date()
      ) {
        return res.status(410).send(
          "This short link has expired"
        );
      }

      await redis.set(
        cacheKey,
        JSON.stringify({
          id: shortUrlId,
          destination,
          status: linkStatus,
          expiresAt: expiresAt
            ? new Date(expiresAt).toISOString()
            : null,
        }),
        {
          EX: 300,
        }
      );
    }

    if (linkStatus !== "active") {
      await redis.del(cacheKey);

      return res.status(410).send(
        "This short link is no longer active"
      );
    }

    if (
      expiresAt &&
      new Date(expiresAt) <= new Date()
    ) {
      await redis.del(cacheKey);

      return res.status(410).send(
        "This short link has expired"
      );
    }

    if (!client) {
      client = await getPool().connect();
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE short_urls
       SET click_count = click_count + 1
       WHERE id = $1`,
      [shortUrlId]
    );

    await client.query(
      `INSERT INTO clicks (
         short_url_id,
         user_agent,
         referrer
       )
       VALUES ($1, $2, $3)`,
      [
        shortUrlId,
        req.get("user-agent") || null,
        req.get("referer") || null,
      ]
    );

    await client.query("COMMIT");

    return res.redirect(
      302,
      destination
    );
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {}
    }

    console.error(
      "REDIRECT ERROR:",
      error
    );

    return res.status(500).send(
      "Failed to redirect"
    );
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.use("/api", analyticsRoutes);
app.use("/api", guardianRoutes);

async function startServer() {
  try {
    await initPostgres();
    await initRedis();

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "SERVER STARTUP ERROR:",
      error
    );

    process.exit(1);
  }
}

startServer();