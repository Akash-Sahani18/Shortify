import React from "react";
import { useState } from "react";
import api from "../services/api";

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidUrl(originalUrl)) {
      alert("Enter a valid URL");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/short", { originalUrl });
      setShortUrl(res.data.shortUrl);
      setQrCode(res.data.qrCode);
    } catch (err) {
      alert("Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="app-container">
        <h1 className="app-title">Shortify</h1>
        <p className="app-subtitle">
          Shorten links. Share smarter. Track better.
        </p>

        <form onSubmit={handleSubmit} className="form-group">
          <input
            className="url-input"
            type="url"
            placeholder="https://example.com"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
          />

          <button className="primary-btn" disabled={loading}>
            {loading ? "Generating..." : "Shorten URL"}
          </button>
        </form>

        {shortUrl && (
          <div className="result-card">
            <a href={shortUrl} target="_blank" rel="noreferrer">
              {shortUrl}
            </a>
            <img src={qrCode} alt="QR Code" />
          </div>
        )}
      </div>
    </div>
  );
}

