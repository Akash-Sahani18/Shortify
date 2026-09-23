import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

const APP_BASE =
  import.meta.env.VITE_APP_BASE_URL ||
  "http://localhost:3000";

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [result, setResult] = useState(null);
  const [recentLinks, setRecentLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadRecentLinks = async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await api.get("/analytics");
      setRecentLinks((res.data.urls || []).slice(0, 5));
    } catch {
      // Recent links are optional on the public landing page.
    }
  };

  useEffect(() => {
    loadRecentLinks();
  }, []);

  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setCopied(false);

    if (!isValidUrl(originalUrl)) {
      setError("Enter a valid HTTP or HTTPS URL.");
      return;
    }

    setLoading(true);
    try {
      const payload = { originalUrl };
      if (customAlias.trim()) payload.customAlias = customAlias.trim();
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();

      const res = await api.post("/short", payload);
      setResult({
        shortUrl: res.data.shortUrl,
        shortCode: res.data.shortCode,
        qrCode: res.data.qrCode,
      });
      setOriginalUrl("");
      setCustomAlias("");
      setExpiresAt("");
      await loadRecentLinks();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create the short link.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!result?.qrCode) return;
    const link = document.createElement("a");
    link.href = result.qrCode;
    link.download = `shortify-${result.shortCode}.png`;
    link.click();
  };

  const copyLink = async (url = result?.shortUrl) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareLink = async () => {
    if (!result?.shortUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Shortify link", url: result.shortUrl });
      } catch {
        // Native share was cancelled.
      }
    } else {
      await copyLink();
    }
  };

  return (
    <main className="landing">
      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">URL MANAGEMENT PLATFORM</p>
          <h1>Shorten, manage, and monitor your links.</h1>
          <p className="hero-description">
            Create clean short URLs, generate QR codes, and track link performance from one focused workspace.
          </p>

          <form className="hero-shortener" onSubmit={handleSubmit}>
            <div className="hero-input-wrap">
              <span className="input-prefix">↗</span>
              <input
                id="original-url"
                type="url"
                value={originalUrl}
                onChange={(event) => setOriginalUrl(event.target.value)}
                placeholder="Paste a long URL to shorten"
                aria-label="Destination URL"
                required
              />
            </div>
            <button className="primary-btn hero-submit" disabled={loading}>
              {loading ? "Creating…" : "Shorten URL"}
              <span>→</span>
            </button>
          </form>

          <button className="hero-options" type="button" onClick={() => setShowOptions((value) => !value)}>
            <span>{showOptions ? "Hide advanced options" : "Custom alias and expiry"}</span>
            <span>{showOptions ? "−" : "+"}</span>
          </button>

          {showOptions && (
            <div className="hero-options-grid">
              <div>
                <label className="field-label" htmlFor="custom-alias">Custom alias</label>
                <input id="custom-alias" className="secondary-input" placeholder="product-launch" value={customAlias} onChange={(event) => setCustomAlias(event.target.value)} maxLength={32} />
              </div>
              <div>
                <label className="field-label" htmlFor="expires-at">Expires</label>
                <input id="expires-at" className="secondary-input" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
              </div>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="hero-meta">
            <span><i /> HTTP & HTTPS supported</span>
            <span>•</span>
            <span>QR code included</span>
            <span>•</span>
            <span>Optional custom alias</span>
          </div>

      {result && (
        <section className="result-panel landing-result">
          <div className="result-main">
            <div>
              <p className="section-kicker">LINK CREATED</p>
              <a className="short-url" href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a>
              <p className="destination-preview">Your short link is ready to share.</p>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="result-divider" />
          <div className="result-tools">
            <img className="qr-image" src={result.qrCode} alt="QR code for the short URL" />
            <div className="result-actions">
              <button className="secondary-btn" onClick={() => copyLink()}>{copied ? "Copied" : "Copy link"}</button>
              <button className="secondary-btn" onClick={downloadQR}>Download QR</button>
              <button className="secondary-btn" onClick={shareLink}>Share</button>
            </div>
          </div>
        </section>
      )}
        </div>

        <div className="hero-product-card" aria-label="Shortify workspace preview">
          <div className="product-window-bar">
            <span className="window-dots"><i /><i /><i /></span>
            <span>Shortify / Links</span>
            <span className="window-status">● Live</span>
          </div>
          <div className="product-window-body">
            <div className="preview-sidebar">
              <strong>Shortify<span>.</span></strong>
              <span className="preview-active">Links</span>
              <span>Analytics</span>
              <span>Settings</span>
            </div>
            <div className="preview-main">
              <div className="preview-heading">
                <div><small>WORKSPACE</small><h3>Your links</h3></div>
                <button>+ Create link</button>
              </div>
              <div className="preview-form"><span>https://example.com/long-campaign-url</span><b>Shorten</b></div>
              <div className="preview-table">
                <div><strong>shortify.app/demo</strong><span>example.com/campaign</span><em>24 clicks</em></div>
                <div><strong>shortify.app/launch</strong><span>product.example.com/launch</span><em>81 clicks</em></div>
                <div><strong>shortify.app/docs</strong><span>docs.example.com/start</span><em>12 clicks</em></div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="section-block" id="features">
        <div className="center-heading">
          <p className="eyebrow">BUILT AROUND THE LINK</p>
          <h2>Everything important, without the clutter.</h2>
          <p>Shortify keeps the everyday workflow simple while giving you the controls you need as your link library grows.</p>
        </div>
        <div className="feature-grid four">
          <article className="feature-card landing-feature"><span className="feature-icon">↗</span><h3>Short links</h3><p>Create compact URLs with generated codes or custom aliases.</p><a href="#how-it-works">Learn more →</a></article>
          <article className="feature-card landing-feature"><span className="feature-icon">⌗</span><h3>QR codes</h3><p>Every shortened link can produce a ready-to-share QR code.</p><a href="#how-it-works">Learn more →</a></article>
          <article className="feature-card landing-feature"><span className="feature-icon">▥</span><h3>Analytics</h3><p>See click activity and manage your links from one workspace.</p><a href="/analytics">Open analytics →</a></article>
          <article className="feature-card landing-feature"><span className="feature-icon">✓</span><h3>Link Guardian</h3><p>Build toward healthier links with status, expiry and destination checks.</p><a href="#how-it-works">Learn more →</a></article>
        </div>
      </section>

      <section className="section-block workflow" id="how-it-works">
        <div className="center-heading">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>From long URL to managed link.</h2>
          <p>A straightforward workflow for creating and keeping track of the links you share.</p>
        </div>

        <div className="workflow-row">
          <div className="workflow-copy">
            <span className="step-number">01</span>
            <h3>Create a clean short link</h3>
            <p>Paste your destination, optionally choose a memorable alias or expiry, and Shortify creates the redirect.</p>
            <a href="#top">Create a link →</a>
          </div>
          <div className="workflow-mock link-mock">
            <div className="mock-top"><span>CREATE LINK</span><span>Shortify</span></div>
            <div className="mock-input">https://example.com/marketing/campaign/summer-launch</div>
            <div className="mock-fields"><span>Custom alias</span><span>Expiry</span></div>
            <div className="mock-button">Create short link →</div>
          </div>
        </div>

        <div className="workflow-row reverse">
          <div className="workflow-copy">
            <span className="step-number">02</span>
            <h3>Track what happens next</h3>
            <p>Keep an eye on click counts and link activity instead of managing scattered spreadsheets or separate tools.</p>
            <a href="/analytics">View analytics →</a>
          </div>
          <div className="workflow-mock analytics-mock">
            <div className="mock-top"><span>ANALYTICS</span><span>Last 30 days</span></div>
            <div className="mock-stats"><span><b>1,284</b>Clicks</span><span><b>42</b>Links</span><span><b>38</b>Active</span></div>
            <div className="mini-chart"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          </div>
        </div>

        <div className="workflow-row">
          <div className="workflow-copy">
            <span className="step-number">03</span>
            <h3>Keep links reliable</h3>
            <p>Use status and expiry controls today, with Link Guardian designed to surface destination problems before they become a broken experience.</p>
            <a href="#features">Explore features →</a>
          </div>
          <div className="workflow-mock health-mock">
            <div className="mock-top"><span>LINK HEALTH</span><span className="health-good">● Healthy</span></div>
            <div className="health-row"><b>/launch</b><span>200 OK</span><em>Active</em></div>
            <div className="health-row"><b>/docs</b><span>200 OK</span><em>Active</em></div>
            <div className="health-row"><b>/campaign</b><span>301 Redirect</span><em>Review</em></div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <p className="eyebrow">READY WHEN YOU ARE</p>
        <h2>Make every link easier to share and manage.</h2>
        <p>Start with a URL. Keep the rest of the workflow in Shortify.</p>
        <a className="nav-primary cta-button" href="#top">Create a short link →</a>
      </section>

      {isAuthenticated() && recentLinks.length > 0 && (
        <section className="recent-section landing-recent">
          <div className="section-heading-row">
            <div><p className="section-kicker">RECENT LINKS</p><h2>Your latest links</h2></div>
            <a href="/analytics" className="text-link">View analytics →</a>
          </div>
          <div className="links-table-wrap">
            <table className="links-table">
              <thead><tr><th>Short link</th><th>Destination</th><th>Clicks</th><th>Status</th></tr></thead>
              <tbody>
                {recentLinks.map((link) => (
                  <tr key={link._id}>
                    <td><a className="table-short-link" href={`${APP_BASE}/${link.shortUrl}`} target="_blank" rel="noreferrer">/{link.shortUrl}</a></td>
                    <td className="destination-cell" title={link.originalUrl}>{link.originalUrl}</td>
                    <td>{link.click}</td>
                    <td><span className={`badge ${link.status === "active" ? "badge-success" : "badge-muted"}`}>{link.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <Link to="/" className="home-footer-logo">Shortify<span>.</span></Link>
            <p>Simple links, useful analytics, and a focused workspace for creating, sharing, and managing your URLs.</p>
          </div>

          <div className="home-footer-links">
            <div>
              <span>Product</span>
              <a href="#features">Features</a>
              <a href="/analytics">Analytics</a>
              <a href="/guardian">Guardian</a>
            </div>
            <div>
              <span>Company</span>
              <a href="/about">About</a>
              <a href="#how-it-works">How it works</a>
            </div>
          </div>
        </div>

        <div className="home-footer-bottom">
          <span>© {new Date().getFullYear()} Shortify</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
