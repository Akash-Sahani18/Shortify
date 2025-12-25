const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true, 
    unique: true,
  },
  click: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent OverwriteModelError
module.exports = mongoose.models.Url || mongoose.model("Url", urlSchema);
