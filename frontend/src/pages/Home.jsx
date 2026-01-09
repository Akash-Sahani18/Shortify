import React, { useState } from "react";
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
      alert("Please enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/short", { originalUrl });

      // Production-safe response handling
      const short = res.data.shortUrl || res.data?.data?.shortUrl;
      const qr = res.data.qrCode || res.data?.data?.qrCode;

      setShortUrl(short);
      setQrCode(qr);
    } catch (err) {
      alert("Failed to shorten URL. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = "shortify-qr.png";
    link.click();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shortUrl);
    alert("Link copied to clipboard!");
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ url: shortUrl });
    } else {
      copyLink();
    }
  };

  return (
    <div className="main-content">
      <div className="app-container">
        <div className="header">
          <h1 className="app-title">Shortify</h1>
          <p className="app-subtitle">
            Shorten links. Share smarter. Track better.
          </p>
        </div>

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
            <p className="result-label">Your short link</p>

            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              className="short-url"
            >
              {shortUrl}
            </a>

            <div className="qr-container">
              <img src={qrCode} alt="QR Code" />

              <div className="action-buttons">
                <button
                  className="action-btn btn-green"
                  onClick={downloadQR}
                >
                  Download QR
                </button>

                <button
                  className="action-btn btn-blue"
                  onClick={copyLink}
                >
                  Copy Link
                </button>

                <button
                  className="action-btn btn-pink"
                  onClick={shareLink}
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
