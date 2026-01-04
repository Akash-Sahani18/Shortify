import React from "react";

import { useEffect, useState } from "react";
import api from "../services/api";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics")
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        alert("Failed to load analytics");
      });
  }, []);

  if (!data) {
    return <p style={{ color: "white" }}>Loading analytics...</p>;
  }

  return (
    <div className="analytics-container">
      <h2 className="analytics-title">Analytics</h2>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Links</p>
          <h3 className="stat-value">{data.totalLinks}</h3>
        </div>

        <div className="stat-card">
          <p className="stat-label">Total Clicks</p>
          <h3 className="stat-value">{data.totalClicks}</h3>
        </div>

        <div className="stat-card">
          <p className="stat-label">Active Links</p>
          <h3 className="stat-value">{data.activeLinks}</h3>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-card">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Original URL</th>
              <th>Short URL</th>
              <th>Clicks</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {data.urls.map((url) => (
              <tr key={url._id}>
                <td className="url-cell">
                  <a
                    href={url.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="table-link"
                  >
                    {url.originalUrl}
                  </a>
                </td>

                <td className="url-cell">
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL}/${url.shortUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="table-link"
                  >
                    {url.shortUrl}
                  </a>
                </td>

                <td>{url.click}</td>
                <td>{new Date(url.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

