import "../analytics.css";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

const APP_BASE =
  import.meta.env.VITE_APP_BASE_URL ||
  "http://localhost:3000";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExpiry(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  if (date <= new Date()) {
    return "Expired";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortDestination(value) {
  if (!value) {
    return "—";
  }

  try {
    const url = new URL(value);

    return `${url.hostname}${
      url.pathname === "/"
        ? ""
        : url.pathname
    }`;
  } catch {
    return value;
  }
}

export default function Analytics() {
  const [data, setData] = useState({
    urls: [],
    stats: {
      totalLinks: 0,
      totalClicks: 0,
      activeLinks: 0,
    },
    dailyClicks: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [qrLoadingId, setQrLoadingId] =
    useState(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  /* =========================================================
     Individual analytics
  ========================================================= */

  const [selectedLink, setSelectedLink] =
    useState(null);

  const [linkAnalytics, setLinkAnalytics] =
    useState(null);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);

  const loadAnalytics = async () => {
    try {
      setError("");

      const response =
        await api.get("/analytics");

      setData({
        urls: response.data.urls || [],

        stats:
          response.data.stats || {
            totalLinks: 0,
            totalClicks: 0,
            activeLinks: 0,
          },

        dailyClicks:
          response.data.dailyClicks || [],
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load your links."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const chart = useMemo(() => {
    const values =
      data.dailyClicks || [];

    const max = Math.max(
      1,
      ...values.map((item) =>
        Number(item.clicks || 0)
      )
    );

    return values.map((item) => ({
      ...item,

      height: Math.max(
        8,
        (Number(item.clicks || 0) /
          max) *
          100
      ),
    }));
  }, [data.dailyClicks]);

  const filteredUrls = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    return data.urls.filter((link) => {
      const matchesSearch =
        !query ||
        link.shortUrl
          ?.toLowerCase()
          .includes(query) ||
        link.originalUrl
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        link.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    data.urls,
    searchQuery,
    statusFilter,
  ]);

  /* =========================================================
     Copy
  ========================================================= */

  const copyLink = async (
    code,
    id
  ) => {
    const url =
      `${APP_BASE}/${code}`;

    try {
      await navigator.clipboard.writeText(
        url
      );

      setCopiedId(id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1600);
    } catch {
      setError(
        "Could not copy the short link."
      );
    }
  };

  /* =========================================================
     QR
  ========================================================= */

  const openQRCode = async (id) => {
    setQrLoadingId(id);
    setError("");

    const qrWindow = window.open(
      "about:blank",
      "_blank"
    );

    if (!qrWindow) {
      setQrLoadingId(null);
      setError(
        "Please allow pop-ups to view the QR code."
      );
      return;
    }

    qrWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shortify QR Code</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
              color: #111827;
            }
            .loading {
              padding: 24px;
              color: #6b7280;
            }
          </style>
        </head>
        <body><div class="loading">Generating QR code…</div></body>
      </html>
    `);
    qrWindow.document.close();

    try {
      const response =
        await api.get(
          `/short/${id}/qr`
        );

      const qrCode =
        response.data?.qrCode;

      const shortUrl =
        response.data?.shortUrl;

      if (!qrCode) {
        throw new Error(
          "The server did not return a QR code."
        );
      }

      qrWindow.document.open();
      qrWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shortify QR Code</title>

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background: #ffffff;
                color: #111827;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              .qr-page {
                width: 100%;
                max-width: 420px;
                text-align: center;
                padding: 32px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: #ffffff;
              }

              .qr-page h1 {
                margin: 0;
                font-size: 22px;
              }

              .qr-page p {
                margin: 8px 0 0;
                color: #6b7280;
                font-size: 14px;
              }

              .qr-page img {
                width: 280px;
                height: 280px;
                max-width: 100%;
                display: block;
                margin: 28px auto;
              }

              .qr-url {
                display: block;
                color: #2563eb;
                font-size: 14px;
                line-height: 1.5;
                text-decoration: none;
                word-break: break-all;
              }

              .qr-url:hover {
                text-decoration: underline;
              }
            </style>
          </head>

          <body>
            <div class="qr-page">
              <h1>Shortify QR Code</h1>

              <p>
                Scan to open your shortened link
              </p>

              <img
                src="${qrCode}"
                alt="QR code"
              />

              <a
                class="qr-url"
                href="${shortUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${shortUrl}
              </a>
            </div>
          </body>
        </html>
      `);

      qrWindow.document.close();
    } catch (err) {
      if (qrWindow && !qrWindow.closed) {
        qrWindow.close();
      }

      setError(
        err.response?.data?.error ||
          err.message ||
          "Could not generate QR code."
      );
    } finally {
      setQrLoadingId(null);
    }
  };

  /* =========================================================
     Disable
  ========================================================= */

  const disableLink = async (id) => {
    if (
      !window.confirm(
        "Disable this short link?"
      )
    ) {
      return;
    }

    setBusyId(id);
    setError("");

    try {
      await api.delete(
        `/short/${id}`
      );

      await loadAnalytics();

      if (
        selectedLink?._id === id
      ) {
        setSelectedLink(null);
        setLinkAnalytics(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not disable the link."
      );
    } finally {
      setBusyId(null);
    }
  };

  /* =========================================================
     Open individual analytics
  ========================================================= */

  const openLinkAnalytics = async (
    link
  ) => {
    setSelectedLink(link);
    setLinkAnalytics(null);
    setAnalyticsLoading(true);
    setError("");

    try {
      const response =
        await api.get(
          `/analytics/${link._id}`
        );

      setLinkAnalytics(
        response.data
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load link analytics."
      );

      setSelectedLink(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const closeLinkAnalytics = () => {
    setSelectedLink(null);
    setLinkAnalytics(null);
  };

  if (loading) {
    return (
      <main className="main-content">
        <div className="loading-state">
          Loading your workspace…
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <section className="analytics-container">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="page-intro">
          <div>
            <p className="section-kicker">
              WORKSPACE
            </p>

            <h1>Your links</h1>

            <p className="intro-copy">
              Create, monitor, and manage
              your shortened URLs from one
              place.
            </p>
          </div>

          <div className="intro-meta">
            <span className="status-dot" />
            Workspace active
          </div>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* ===================================================
            STATS
        =================================================== */}

        <div className="stats-grid">
          <article className="stat-card">
            <span>Total links</span>

            <strong>
              {data.stats.totalLinks}
            </strong>
          </article>

          <article className="stat-card">
            <span>Total clicks</span>

            <strong>
              {data.stats.totalClicks}
            </strong>
          </article>

          <article className="stat-card">
            <span>Active links</span>

            <strong>
              {data.stats.activeLinks}
            </strong>
          </article>
        </div>

        {/* ===================================================
            LINKS
        =================================================== */}

        <section className="table-card">

          <div className="table-header">
            <div>
              <h2>Your links</h2>

              <span className="table-count">
                {searchQuery ||
                statusFilter !== "all"
                  ? `${filteredUrls.length} of ${data.urls.length} links`
                  : `${data.urls.length} link${
                      data.urls.length ===
                      1
                        ? ""
                        : "s"
                    }`}
              </span>
            </div>

            <div className="workspace-filters">
              <input
                type="search"
                className="workspace-search"
                placeholder="Search links..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                aria-label="Search links"
              />

              <select
                className="workspace-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                aria-label="Filter links by status"
              >
                <option value="all">
                  All status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="disabled">
                  Disabled
                </option>

                <option value="expired">
                  Expired
                </option>
              </select>
            </div>
          </div>

          <div className="links-table-wrap">
            <table className="links-table">
              <thead>
                <tr>
                  <th>Short link</th>
                  <th>Destination</th>
                  <th>Clicks</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {data.urls.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="empty-state"
                    >
                      No links yet.
                      Create your first
                      short URL from the
                      home page.
                    </td>
                  </tr>
                ) : filteredUrls.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="empty-state"
                    >
                      No links match
                      your search or
                      status filter.
                    </td>
                  </tr>
                ) : (
                  filteredUrls.map(
                    (link) => {
                      const isExpired =
                        link.expiresAt &&
                        new Date(
                          link.expiresAt
                        ) <=
                          new Date();

                      return (
                        <tr
                          key={
                            link._id
                          }
                        >
                          <td>
                            <a
                              className="table-short-link"
                              href={`${APP_BASE}/${link.shortUrl}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              /
                              {
                                link.shortUrl
                              }
                            </a>
                          </td>

                          <td
                            className="destination-cell"
                            title={
                              link.originalUrl
                            }
                          >
                            {shortDestination(
                              link.originalUrl
                            )}
                          </td>

                          <td>
                            {link.click}
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                link.status ===
                                "active"
                                  ? "badge-success"
                                  : link.status ===
                                    "expired"
                                  ? "badge-expired"
                                  : "badge-muted"
                              }`}
                            >
                              {
                                link.status
                              }
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              link.createdAt
                            )}
                          </td>

                          <td
                            className={
                              isExpired
                                ? "expiry-expired"
                                : ""
                            }
                          >
                            {formatExpiry(
                              link.expiresAt
                            )}
                          </td>

                          <td className="action-cell">

                            <button
                              type="button"
                              className="table-action table-action-neutral"
                              onClick={() =>
                                openLinkAnalytics(
                                  link
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="table-action table-action-neutral"
                              onClick={() =>
                                copyLink(
                                  link.shortUrl,
                                  link._id
                                )
                              }
                            >
                              {copiedId ===
                              link._id
                                ? "Copied"
                                : "Copy"}
                            </button>

                            <button
                              type="button"
                              className="table-action table-action-neutral"
                              disabled={
                                qrLoadingId ===
                                link._id
                              }
                              onClick={() =>
                                openQRCode(
                                  link._id
                                )
                              }
                            >
                              {qrLoadingId ===
                              link._id
                                ? "Loading…"
                                : "QR"}
                            </button>

                            {link.status ===
                              "active" && (
                              <button
                                type="button"
                                className="table-action"
                                disabled={
                                  busyId ===
                                  link._id
                                }
                                onClick={() =>
                                  disableLink(
                                    link._id
                                  )
                                }
                              >
                                {busyId ===
                                link._id
                                  ? "Disabling…"
                                  : "Disable"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================================================
            CLICK ACTIVITY
        =================================================== */}

        <section className="analytics-chart-card">
          <div className="table-header">
            <div>
              <h2>
                Click activity
              </h2>

              <span className="table-count">
                Last 30 days
              </span>
            </div>
          </div>

          {chart.length === 0 ? (
            <div className="chart-empty">
              Click activity will
              appear here after
              someone opens one of
              your links.
            </div>
          ) : (
            <div className="click-chart">
              {chart.map(
                (item, index) => (
                  <div
                    className="chart-column"
                    key={`${item.date}-${index}`}
                    title={`${formatDate(
                      item.date
                    )}: ${
                      item.clicks
                    } clicks`}
                  >
                    <div
                      className="chart-bar"
                      style={{
                        height: `${item.height}%`,
                      }}
                    />
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* ===================================================
            INDIVIDUAL LINK ANALYTICS
        =================================================== */}

        {selectedLink && (
          <div
            className="link-analytics-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeLinkAnalytics();
              }
            }}
          >
            <section className="link-analytics-panel">

              <div className="link-analytics-header">
                <div>
                  <p className="section-kicker">
                    LINK ANALYTICS
                  </p>

                  <h2>
                    /
                    {
                      selectedLink.shortUrl
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  className="analytics-close"
                  onClick={
                    closeLinkAnalytics
                  }
                  aria-label="Close analytics"
                >
                  ×
                </button>
              </div>

              {analyticsLoading ? (
                <div className="link-analytics-loading">
                  Loading link analytics…
                </div>
              ) : linkAnalytics ? (
                <>
                  {/* SUMMARY */}

                  <div className="link-detail-grid">

                    <div className="link-detail-card">
                      <span>
                        Total clicks
                      </span>

                      <strong>
                        {
                          linkAnalytics
                            .link
                            .clickCount
                        }
                      </strong>
                    </div>

                    <div className="link-detail-card">
                      <span>
                        Status
                      </span>

                      <strong>
                        {
                          linkAnalytics
                            .link
                            .status
                        }
                      </strong>
                    </div>

                    <div className="link-detail-card">
                      <span>
                        Created
                      </span>

                      <strong>
                        {formatDate(
                          linkAnalytics
                            .link
                            .createdAt
                        )}
                      </strong>
                    </div>

                    <div className="link-detail-card">
                      <span>
                        Expires
                      </span>

                      <strong>
                        {formatExpiry(
                          linkAnalytics
                            .link
                            .expiresAt
                        )}
                      </strong>
                    </div>
                  </div>

                  {/* DESTINATION */}

                  <div className="link-detail-section">
                    <span>
                      Destination
                    </span>

                    <a
                      href={
                        linkAnalytics
                          .link
                          .originalUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="link-detail-url"
                    >
                      {
                        linkAnalytics
                          .link
                          .originalUrl
                      }
                    </a>
                  </div>

                  {/* CLICK HISTORY */}

                  <div className="link-detail-section">
                    <div className="detail-section-heading">
                      <div>
                        <h3>
                          Click history
                        </h3>

                        <span>
                          {
                            linkAnalytics
                              .clicks
                              .length
                          }{" "}
                          recorded clicks
                        </span>
                      </div>
                    </div>

                    {linkAnalytics
                      .clicks
                      .length === 0 ? (
                      <div className="detail-empty">
                        No clicks recorded
                        for this link yet.
                      </div>
                    ) : (
                      <div className="click-history">
                        {linkAnalytics.clicks.map(
                          (
                            click,
                            index
                          ) => (
                            <div
                              className="click-history-row"
                              key={`${click.clickedAt}-${index}`}
                            >
                              <div>
                                <strong>
                                  {formatDateTime(
                                    click.clickedAt
                                  )}
                                </strong>

                                <span>
                                  {click.referrer ||
                                    "Direct visit"}
                                </span>
                              </div>

                              <div
                                className="click-user-agent"
                                title={
                                  click.userAgent ||
                                  "Unknown"
                                }
                              >
                                {
                                  click.userAgent ||
                                  "Unknown browser"
                                }
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}