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
    return jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET
    );
  } catch {
    return null;
  }
}

router.get("/analytics", async (req, res) => {
  let client;

  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    client = await getPool().connect();

    const linksResult = await client.query(
      `SELECT
         id,
         short_code,
         original_url,
         click_count,
         status,
         expires_at,
         created_at
       FROM short_urls
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [Number(user.id)]
    );

    const statsResult = await client.query(
      `SELECT
         COUNT(*) AS total_links,
         COALESCE(SUM(click_count), 0) AS total_clicks,
         COALESCE(SUM(
           CASE
             WHEN status = 'active'
               AND (
                 expires_at IS NULL
                 OR expires_at > CURRENT_TIMESTAMP
               )
             THEN 1
             ELSE 0
           END
         ), 0) AS active_links
       FROM short_urls
       WHERE user_id = $1`,
      [Number(user.id)]
    );

    const chartResult = await client.query(
      `SELECT
         DATE(c.clicked_at) AS click_date,
         COUNT(*) AS clicks
       FROM clicks c
       JOIN short_urls s
         ON s.id = c.short_url_id
       WHERE s.user_id = $1
         AND c.clicked_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
       GROUP BY DATE(c.clicked_at)
       ORDER BY click_date ASC`,
      [Number(user.id)]
    );

    const urls = linksResult.rows.map((row) => ({
      _id: Number(row.id),
      shortUrl: row.short_code,
      originalUrl: row.original_url,
      click: Number(row.click_count || 0),
      status:
        row.status === "active" &&
        row.expires_at &&
        new Date(row.expires_at) <= new Date()
          ? "expired"
          : row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));

    const stats = statsResult.rows[0] || {};

    const dailyClicks = chartResult.rows.map((row) => ({
      date: row.click_date,
      clicks: Number(row.clicks || 0),
    }));

    return res.json({
      urls,
      stats: {
        totalLinks: Number(stats.total_links || 0),
        totalClicks: Number(stats.total_clicks || 0),
        activeLinks: Number(stats.active_links || 0),
      },
      dailyClicks,
    });
  } catch (error) {
    console.error("ANALYTICS ERROR:", error);

    return res.status(500).json({
      error: "Failed to load analytics",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.get("/analytics/:id", async (req, res) => {
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
         s.id,
         s.short_code,
         s.original_url,
         s.click_count,
         s.status,
         s.expires_at,
         s.created_at,
         c.clicked_at,
         c.user_agent,
         c.referrer
       FROM short_urls s
       LEFT JOIN clicks c
         ON c.short_url_id = s.id
       WHERE s.id = $1
         AND s.user_id = $2
       ORDER BY c.clicked_at DESC`,
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

    const first = result.rows[0];

    return res.json({
      link: {
        id: Number(first.id),
        shortUrl: first.short_code,
        originalUrl: first.original_url,
        clickCount: Number(first.click_count || 0),
        status: first.status,
        expiresAt: first.expires_at,
        createdAt: first.created_at,
      },
      clicks: result.rows
        .filter((row) => row.clicked_at)
        .map((row) => ({
          clickedAt: row.clicked_at,
          userAgent: row.user_agent,
          referrer: row.referrer,
        })),
    });
  } catch (error) {
    console.error("LINK ANALYTICS ERROR:", error);

    return res.status(500).json({
      error: "Failed to load link analytics",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;