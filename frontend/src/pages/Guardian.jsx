import React, { useEffect, useState } from "react";
import api from "../services/api";
import "../guardian.css";

export default function Guardian() {
  const [links, setLinks] = useState([]);
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/analytics");

      setLinks(response.data?.urls || []);
    } catch (err) {
      console.error("GUARDIAN LINKS ERROR:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load your links."
      );
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (id) => {
    try {
      setChecking((prev) => ({
        ...prev,
        [id]: true,
      }));

      setError("");

      const response = await api.get(`/guardian/${id}`);

      setHealth((prev) => ({
        ...prev,
        [id]: response.data,
      }));
    } catch (err) {
      console.error("GUARDIAN CHECK ERROR:", err);

      setHealth((prev) => ({
        ...prev,
        [id]: {
          health: {
            status: "unreachable",
            statusCode: null,
            error:
              err.response?.data?.error ||
              "Unable to check this destination.",
          },
        },
      }));
    } finally {
      setChecking((prev) => ({
        ...prev,
        [id]: false,
      }));
    }
  };

  const checkAll = async () => {
    for (const link of links) {
      await checkHealth(link._id);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "healthy":
        return "Healthy";

      case "redirect":
        return "Redirect";

      case "client_error":
        return "Client error";

      case "server_error":
        return "Server error";

      case "unreachable":
        return "Unreachable";

      default:
        return "Not checked";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "healthy":
        return "guardian-status-healthy";

      case "redirect":
        return "guardian-status-redirect";

      case "client_error":
      case "server_error":
      case "unreachable":
        return "guardian-status-error";

      default:
        return "guardian-status-neutral";
    }
  };

  if (loading) {
    return (
      <main className="guardian-page">
        <div className="guardian-header">
          <h1>Link Guardian</h1>
          <p>
            Monitor the health of your shortened links.
          </p>
        </div>

        <div className="guardian-message">
          Loading your links...
        </div>
      </main>
    );
  }

  return (
    <main className="guardian-page">
      <div className="guardian-header guardian-header-row">
        <div>
          <h1>Link Guardian</h1>

          <p>
            Monitor the health of your shortened links.
          </p>
        </div>

        {links.length > 0 && (
          <button
            type="button"
            className="guardian-check-all"
            onClick={checkAll}
            disabled={Object.values(checking).some(Boolean)}
          >
            Check all
          </button>
        )}
      </div>

      {error && (
        <div className="guardian-error">
          {error}
        </div>
      )}

      {!error && links.length === 0 && (
        <div className="guardian-empty">
          <h2>No links yet</h2>

          <p>
            Create a shortened link first and Guardian
            will monitor its destination.
          </p>
        </div>
      )}

      {links.length > 0 && (
        <div className="guardian-links">
          {links.map((link) => {
            const result = health[link._id];
            const currentHealth = result?.health;

            const status =
              currentHealth?.status || "not_checked";

            return (
              <article
                className="guardian-link-card"
                key={link._id}
              >
                <div className="guardian-link-main">
                  <div className="guardian-link-info">
                    <div className="guardian-link-top">
                      <a
                        href={`${window.location.origin}/${link.shortUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="guardian-short-url"
                      >
                        /{link.shortUrl}
                      </a>

                      <span
                        className={`guardian-status ${getStatusClass(
                          status
                        )}`}
                      >
                        <span className="guardian-status-dot" />

                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <div className="guardian-original-url">
                      {link.originalUrl}
                    </div>

                    {currentHealth?.statusCode && (
                      <div className="guardian-health-meta">
                        HTTP {currentHealth.statusCode}
                      </div>
                    )}

                    {currentHealth?.error && (
                      <div className="guardian-health-error">
                        {currentHealth.error}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="guardian-check-button"
                    onClick={() =>
                      checkHealth(link._id)
                    }
                    disabled={checking[link._id]}
                  >
                    {checking[link._id]
                      ? "Checking..."
                      : currentHealth
                      ? "Check again"
                      : "Check health"}
                  </button>
                </div>

                {currentHealth?.finalUrl &&
                  currentHealth.finalUrl !==
                    link.originalUrl && (
                    <div className="guardian-final-url">
                      <span>Final destination</span>

                      <a
                        href={currentHealth.finalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {currentHealth.finalUrl}
                      </a>
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}