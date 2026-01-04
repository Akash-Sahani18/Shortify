import React from "react";

import { Routes, Route, NavLink } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";

import { useEffect } from "react";

useEffect(() => {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
}, []);
const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
};


export default function App() {
  return (
    <div className="page-wrapper">
    <nav className="navbar">
  <div className="nav-left">
    <span className="nav-title">Shortify</span>
  </div>

  <div className="nav-right">
    <NavLink to="/" className="nav-link">Home</NavLink>
    <NavLink to="/analytics" className="nav-link">Analytics</NavLink>
    <NavLink to="/about" className="nav-link">About</NavLink>
  </div>

  <button className="theme-toggle" onClick={toggleTheme}>
    {theme === "light" ? "🌙" : "☀️"}
  </button>
</nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
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
