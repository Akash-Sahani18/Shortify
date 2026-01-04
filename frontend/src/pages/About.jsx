import React from "react";
export default function About() {
  return (
    <div className="analytics-container">
      <h2 className="analytics-title">About Shortify</h2>

      <p className="analytics-subtitle">
        Shortify is a full-stack URL shortening platform built to demonstrate
        scalable backend design and modern frontend practices.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li>URL shortening with unique short codes</li>
        <li>QR code generation</li>
        <li>Click analytics dashboard</li>
        <li>Authentication-protected analytics</li>
      </ul>

      <h3>Tech Stack</h3>
      <ul>
        <li>Frontend: React, React Router, Axios</li>
        <li>Backend: Node.js, Express</li>
        <li>Database: MongoDB</li>
        <li>Authentication: Token-based auth</li>
      </ul>

      <h3>Developer</h3>
      <p>
        Built by <strong>Aakash Sahani</strong> as a full-stack project focused
        on real-world system design and backend reliability.
      </p>
    </div>
  );
}


