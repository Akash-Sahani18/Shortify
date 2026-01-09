const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { nanoid } = require("nanoid");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const analyticsRoutes = require("./routes/analytics");
const Url = require("./models/Url");

const app = express();

app.use(cors({
  origin: [
    "https://s.shrtfy.cloud",
    "https://shrtfy.cloud"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

// Routes
app.use("/api", analyticsRoutes);

// Create short URL
app.post("/api/short", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({ error: "Invalid originalUrl" });
    }

    let shortCode;
    do {
      shortCode = nanoid(6);
    } while (await Url.findOne({ shortUrl: shortCode }));

    const fullShortUrl = `${process.env.BASE_URL}/${shortCode}`;
    const qrCode = await QRCode.toDataURL(fullShortUrl);

    await Url.create({
      originalUrl,
      shortUrl: shortCode,
      click: 0
    });

    res.status(201).json({ shortUrl: fullShortUrl, qrCode });

  } catch (error) {
    console.error("CREATE SHORT ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (email !== "abc@shortify.com" || password !== "Abc@123") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// Redirect
app.get("/r/:shortUrl", async (req, res) => {
  try {
    const { shortUrl } = req.params;

    const url = await Url.findOne({ shortUrl });
    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    url.click += 1;
    await url.save();

    return res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error("REDIRECT ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
});


// Start server (ONLY ONCE)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



