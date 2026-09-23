import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim();

    if (!normalizedEmail) {
      setError(
        "Enter your email address."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await api.post(
          "/forgot-password",
          {
            email: normalizedEmail,
          }
        );

      /*
       * Keep the email available if the
       * user refreshes the reset page.
       */
      sessionStorage.setItem(
        "passwordResetEmail",
        normalizedEmail
      );

      /*
       * Pass the email directly to the
       * Reset Password page as well.
       */
      navigate("/reset-password", {
        state: {
          email: normalizedEmail,
          message:
            response.data.message,
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Unable to process request"
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

          <h1>
            Forgot your password?
          </h1>

          <p>
            Enter your account email and
            we'll send you a verification
            code.
          </p>
        </div>

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
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending code..."
              : "Send verification code"}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password?{" "}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}