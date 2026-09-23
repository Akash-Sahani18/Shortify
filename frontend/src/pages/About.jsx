import React from "react";

export default function About() {
  return (
    <main className="main-content">
      <section className="content-page">
        <p className="eyebrow">ABOUT SHORTIFY</p>
        <h1>URL management for teams.</h1>
        <p className="intro-copy">Shortify keeps link creation, sharing and basic reliability signals in one focused workspace.</p>

        <div className="feature-grid">
          <article className="feature-card"><h2>Clean links</h2><p>Create compact URLs with optional custom aliases and expiration.</p></article>
          <article className="feature-card"><h2>Useful analytics</h2><p>Track clicks and review the links that are driving traffic.</p></article>
          <article className="feature-card"><h2>Built for reliability</h2><p>Redis handles fast lookups while Oracle remains the source of truth.</p></article>
        </div>
      </section>
    </main>
  );
}
