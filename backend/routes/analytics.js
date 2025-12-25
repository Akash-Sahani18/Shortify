const express = require("express");
const Url = require("../models/Url");
const verifyToken = require("../middleware/auth");

const router = express.Router();


router.get("/analytics", verifyToken, async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    const totalClicks = urls.reduce((sum, u) => sum + u.click, 0);

    res.json({
      totalLinks: urls.length,
      totalClicks,
      activeLinks: urls.length,
      urls,
    });
  } catch (error) {
    res.status(500).json({ error: "Analytics failed" });
  }
});

module.exports = router;
