
import { useState } from "react";
import {
  Wallet,
  Mail,
  LockKeyhole,
  UserRound,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

import { authAPI, saveToken } from "../services/api";
import "./Auth.css";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function switchMode() {
    setIsLogin((previous) => !previous);
    setError("");
    setSuccess("");
    setShowPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login({
          email: form.email,
          password: form.password
        });

        saveToken(response.token);

        setSuccess("Login successful! Welcome to SpendWise.");

        // Temporary navigation until we build the dashboard
        window.location.href = "/dashboard";
      } else {
        await authAPI.register({
          name: form.name,
          email: form.email,
          password: form.password
        });

        setSuccess("Account created! You can now log in.");
        setIsLogin(true);

        setForm((previous) => ({
          ...previous,
          password: ""
        }));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-brand-panel">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Wallet size={25} />
            </div>
            <span>SpendWise</span>
          </div>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">
              SMARTER MONEY MANAGEMENT
            </span>

            <h1>
              Your money.
              <br />
              Your future.
              <br />
              <span>Your control.</span>
            </h1>

            <p>
              Track every expense, manage monthly budgets,
              and build better financial habits — all in
              one beautiful workspace.
            </p>

            <div className="auth-brand-stats">
              <div>
                <strong>100%</strong>
                <span>Personalized</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>Money insights</span>
              </div>
            </div>
          </div>

          <p className="auth-brand-footer">
            Spend smarter. Live better.
          </p>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-mobile-logo">
              <Wallet size={22} />
              <span>SpendWise</span>
            </div>

            <div className="auth-heading">
              <span className="auth-label">
                {isLogin ? "WELCOME BACK" : "GET STARTED"}
              </span>

              <h2>
                {isLogin
                  ? "Sign in to your account"
                  : "Create your account"}
              </h2>

              <p>
                {isLogin
                  ? "Enter your details to continue managing your money."
                  : "Start taking control of your finances today."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="name">Full name</label>

                  <div className="auth-input-wrapper">
                    <UserRound size={18} />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="email">Email address</label>

                <div className="auth-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">Password</label>

                <div className="auth-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete={
                      isLogin ? "current-password" : "new-password"
                    }
                    minLength={isLogin ? undefined : 8}
                    required
                  />

                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-message auth-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-message auth-success">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}

                {!loading && <ArrowRight size={19} />}
              </button>
            </form>

            <p className="auth-switch">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}

              <button type="button" onClick={switchMode}>
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>

            <p className="auth-privacy">
              Your finances deserve a smarter home.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
