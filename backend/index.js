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
    "https://www.shrtfy.cloud",
    "https://www.shrtfy.cloud/",
    "https://shrtfy.cloud"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// DB connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("DB connected Successfully"))
  .catch((err) => console.log("Failed to connect database", err));

// REGISTER ROUTES
app.use("/api", analyticsRoutes);

// CREATE SHORT URL
app.post("/api/short", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({ error: "Invalid originalUrl" });
    }

    // generate unique short code
    let shortCode;
    let exists = true;

    while (exists) {
      shortCode = nanoid(6);
      exists = await Url.findOne({ shortUrl: shortCode });
    }

    const fullShortUrl = `https://localhost:3000/${shortCode}`;
    const qrCode = await QRCode.toDataURL(fullShortUrl);

    await Url.create({
      originalUrl,
      shortUrl: shortCode,
    });

    res.status(201).json({
      shortUrl: fullShortUrl,
      qrCode,
    });
  } catch (error) {
    console.error("CREATE SHORT ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (email !== "abc@shortify.com" || password !== "Abc@123") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// REDIRECT + CLICK COUNT
app.get("/:shortUrl", async (req, res) => {
  try {
    const url = await Url.findOne({ shortUrl: req.params.shortUrl });
    if (!url) return res.status(404).json({ error: "URL not found" });

    url.click++;
    await url.save();
    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => console.log("Server is running on port 3000"));


