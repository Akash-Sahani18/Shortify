const express = require("express");
const jwt = require("jsonwebtoken");
const { getPool } = require("../config_postgres");

const router = express.Router();

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
    console.error(
      "GUARDIAN JWT VERIFY ERROR:",
      error.message
    );

    return null;
  }
}

function classifyStatus(statusCode) {
  if (!statusCode) return "unknown";

  if (statusCode >= 200 && statusCode < 300) {
    return "healthy";
  }

  if (statusCode >= 300 && statusCode < 400) {
    return "redirect";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "client_error";
  }

  if (statusCode >= 500) {
    return "server_error";
  }

  return "unknown";
}

router.get("/guardian/:id", async (req, res) => {
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
      `SELECT
         id,
         short_code,
         original_url,
         click_count,
         status,
         expires_at,
         created_at
       FROM short_urls
       WHERE id = $1
         AND user_id = $2`,
      [
        Number(req.params.id),
        Number(user.id),
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Link not found",
      });
    }

    const row = result.rows[0];

    let health;

    try {
      const startTime = Date.now();

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 8000);

      const response = await fetch(
        row.original_url,
        {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      health = {
        status: classifyStatus(response.status),
        statusCode: response.status,
        finalUrl: row.original_url,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      health = {
        status: "unreachable",
        statusCode: null,
        finalUrl: row.original_url,
        responseTime: null,
        error:
          error.name === "AbortError"
            ? "Request timed out"
            : "Destination could not be reached",
      };
    }

    return res.json({
      link: {
        id: Number(row.id),
        shortUrl: row.short_code,
        originalUrl: row.original_url,
        clickCount: Number(row.click_count || 0),
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      },
      health,
    });
  } catch (error) {
    console.error("GUARDIAN ERROR:", error);

    return res.status(500).json({
      error: "Failed to check link health",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;