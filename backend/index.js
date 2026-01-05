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
    "https://shrtfy.cloud",
    "https://www.shrtfy.cloud"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

app.use("/api", analyticsRoutes);

app.post("/api/short", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({ error: "Invalid originalUrl" });
    }

    let shortCode;
    let exists = true;

    while (exists) {
      shortCode = nanoid(6);
      exists = await Url.findOne({ shortUrl: shortCode });
    }

    const fullShortUrl = `${process.env.BASE_URL}/${shortCode}`;

    const qrCode = await QRCode.toDataURL(fullShortUrl);

    await Url.create({
      originalUrl,
      shortUrl: shortCode,
      click: 0
    });

    res.status(201).json({
      shortUrl: fullShortUrl,
      qrCode
    });

  } catch (error) {
    console.error(" CREATE SHORT ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
