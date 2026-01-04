import React from "react";

import { Routes, Route, NavLink } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="page-wrapper">
      <nav className="navbar">
  <span className="nav-title">Shortify</span>
  <div>
    <NavLink>Home</NavLink>
    <NavLink>Analytics</NavLink>
    <NavLink>About</NavLink>
  </div>
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
