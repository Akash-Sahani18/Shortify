import { useState, useEffect } from "react";
import axios from "axios";
import { Routes, Route, NavLink } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/login";
import Home from "./pages/home";
import Analytics from "./pages/analytics";
import About from "./pages/about";

export default function App() {

  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);

 
  const toggleTheme = () => {
    const t = theme === "light" ? "dark" : "light";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = "qr-code.jpeg";
    link.click();
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shortUrl);
    alert("Short URL copied!");
  };

  const shareUrl = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Short URL",
        text: "Check out this shortened link:",
        url: shortUrl,
      });
    } else {
      copyToClipboard();
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
      const res = await axios.post("http://localhost:3000/api/short", {
        originalUrl,
      });

      setShortUrl(res.data.shortUrl);
      setQrCode(res.data.qrCode);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <span className="nav-logo"></span>
          <span className="nav-title">Shortify</span>
        </div>

        <div className="nav-right">
          <NavLink to="/" className="nav-link">Home</NavLink>
          <NavLink to="/analytics" className="nav-link">Analytics</NavLink>
          <NavLink to="/about" className="nav-link">About</NavLink>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>

      <Routes>
        \
        <Route
          path="/"
          element={
            <Home>
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

                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Generating..." : "Shorten URL"}
                    </button>
                  </form>

                  {shortUrl && (
                    <div className="result-card">
                      <p className="result-label">Your short link</p>
                      <a
                        className="short-url"
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shortUrl}
                      </a>

                      {qrCode && (
                        <div className="qr-container">
                          <img src={qrCode} alt="QR" />

                          <div className="action-buttons">
                            <button
                              className="action-btn btn-green"
                              onClick={downloadQR}
                            >
                              Download QR
                            </button>
                            <button
                              className="action-btn btn-blue"
                              onClick={copyToClipboard}
                            >
                              Copy Link
                            </button>
                            <button
                              className="action-btn btn-pink"
                              onClick={shareUrl}
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Home>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
