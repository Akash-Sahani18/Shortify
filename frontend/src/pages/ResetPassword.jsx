import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => {
    return (
      location.state?.email ||
      sessionStorage.getItem("passwordResetEmail") ||
      ""
    );
  });

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const message = location.state?.message || "";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setError("Enter a valid email address.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError(
        "Enter the 6-digit verification code."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/reset-password", {
        email: normalizedEmail,
        otp,
        newPassword: password,
      });

      sessionStorage.removeItem(
        "passwordResetEmail"
      );

      navigate("/login", {
        state: {
          message:
            "Password reset successfully. You can now log in.",
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Unable to reset password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-eyebrow">
            SHORTIFY
          </p>

          <h1>Reset your password</h1>

          <p>
            Enter the verification code sent
            to your email and choose a new
            password.
          </p>
        </div>

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Email address

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email address"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Verification code

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              placeholder="123456"
              autoComplete="one-time-code"
              required
            />
          </label>

          <label>
            New password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            Confirm new password

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Resetting password..."
              : "Reset password"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}