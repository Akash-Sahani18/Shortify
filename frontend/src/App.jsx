import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Analytics from "./pages/Analytics";
import Guardian from "./pages/Guardian";

import "./App.css";


function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  /*
   * Navigate to a section on the Home page.
   *
   * If we're already on Home, scroll directly.
   * If we're on another page, navigate to Home first and then
   * the useEffect below will handle the hash.
   */
  const goToSection = (section) => {
    const target = `/#${section}`;

    if (location.pathname === "/") {
      navigate(target, { replace: true });
    } else {
      navigate(target);
    }

    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setSidebarOpen(false);
    navigate("/");
    window.location.reload();
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const isHomeSectionActive = (section) => {
    return location.pathname === "/" && location.hash === `#${section}`
      ? "active"
      : "";
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <Link to="/" className="navbar-brand">
          Shortify<span>.</span>
        </Link>

        {/* Navigation */}
        <nav className="navbar-links" aria-label="Primary navigation">

          <Link
            to="/"
            className={isActive("/") && !location.hash ? "active" : ""}
          >
            Home
          </Link>

          <button
            type="button"
            className={`navbar-link ${isHomeSectionActive("features")}`}
            onClick={() => goToSection("features")}
          >
            Features
          </button>

          <button
            type="button"
            className={`navbar-link ${isHomeSectionActive("how-it-works")}`}
            onClick={() => goToSection("how-it-works")}
          >
            How it works
          </button>

          <Link
            to="/analytics"
            className={isActive("/analytics")}
          >
            Analytics
          </Link>

          <Link
            to="/guardian"
            className={isActive("/guardian")}
          >
            Guardian
          </Link>

          <Link
            to="/about"
            className={isActive("/about")}
          >
            About
          </Link>

        </nav>

        {/* Right-side actions */}
        <div className="navbar-actions">

          {/* Theme toggle */}
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setDarkMode((current) => !current)}
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {darkMode ? "☀" : "☾"}
          </button>

          {isLoggedIn ? (
            <>
              <button
                type="button"
                className="nav-signout"
                onClick={handleLogout}
              >
                Sign out
              </button>

              <Link
                to="/analytics"
                className="nav-workspace"
              >
                Workspace
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-login"
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="nav-cta"
              >
                Get started
              </Link>
            </>
          )}

        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
        >
          ☰
        </button>
      </div>

      {sidebarOpen && (
        <div className="mobile-sidebar-layer">
          <button
            type="button"
            className="mobile-sidebar-backdrop"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          />

          <aside className="mobile-sidebar" aria-label="Mobile navigation">
            <div className="mobile-sidebar-header">
              <Link to="/" className="navbar-brand" onClick={closeSidebar}>
                Shortify<span>.</span>
              </Link>
              <button
                type="button"
                className="mobile-sidebar-close"
                onClick={closeSidebar}
                aria-label="Close navigation menu"
              >
                ×
              </button>
            </div>

            <nav className="mobile-sidebar-nav">
              <Link to="/" onClick={closeSidebar}>Home</Link>
              <a href="/#features" onClick={closeSidebar}>Features</a>
              <a href="/#how-it-works" onClick={closeSidebar}>How it works</a>
              <Link to="/analytics" onClick={closeSidebar}>Analytics</Link>
              <Link to="/guardian" onClick={closeSidebar}>Guardian</Link>
              <Link to="/about" onClick={closeSidebar}>About</Link>
            </nav>

            <div className="mobile-sidebar-footer">
              <button
                type="button"
                className="mobile-theme-button"
                onClick={() => setDarkMode((current) => !current)}
              >
                <span>{darkMode ? "Light theme" : "Dark theme"}</span>
                <span>{darkMode ? "☀" : "☾"}</span>
              </button>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/analytics"
                    className="mobile-sidebar-primary"
                    onClick={closeSidebar}
                  >
                    Open workspace
                  </Link>
                  <button
                    type="button"
                    className="mobile-sidebar-secondary"
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="mobile-sidebar-secondary"
                    onClick={closeSidebar}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="mobile-sidebar-primary"
                    onClick={closeSidebar}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}


function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const location = useLocation();

  /*
   * Keep the theme state and CSS variables synchronized.
   *
   * App.css uses [data-theme="dark"], so don't use
   * document.documentElement.classList here.
   */
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);


  /*
   * Handle URLs such as:
   *
   * /#features
   * /#how-it-works
   *
   * This is especially important when the user clicks a
   * navbar section while currently on another page.
   */
  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) {
      return;
    }

    const section = location.hash.substring(1);

    const scrollToSection = () => {
      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    /*
     * Wait one frame so Home has rendered before searching
     * for the target element.
     */
    requestAnimationFrame(scrollToSection);
  }, [location.pathname, location.hash]);


  return (
    <>
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <Routes>

        {/* Landing page */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Product */}
        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
          path="/guardian"
          element={<Guardian />}
        />

        {/* About */}
        <Route
          path="/about"
          element={<About />}
        />

      </Routes>
    </>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}