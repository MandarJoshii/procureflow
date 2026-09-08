import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../../../lib/api-client";

const fieldClass =
  "w-full bg-transparent px-0 py-2.5 text-[15px] text-white/90 outline-none placeholder:text-white/25 transition-colors";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const response = await apiClient.post("/api/auth/login", { email, password });
      localStorage.setItem("procureflow_token", response.data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setStatus("idle");
      if (err.response?.data?.error === "INVALID_CREDENTIALS") {
        setError("Incorrect email or password.");
      } else {
        setError("Something went wrong. Try again.");
      }
    }
  }

  return (
    <>
      <h1 className="text-[26px] font-medium tracking-tight text-white mb-1.5">Welcome back</h1>
      <p className="text-sm text-white/40 mb-8">Enter the workspace you left off in.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-1">
        <div className="border-b border-white/10 focus-within:border-indigo-400 transition-colors">
          <label htmlFor="email" className="block text-[11px] uppercase tracking-wider text-white/35 pt-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="you@company.com"
          />
        </div>

        <div className="border-b border-white/10 focus-within:border-indigo-400 transition-colors mt-5">
          <div className="flex items-center justify-between pt-1">
            <label htmlFor="password" className="block text-[11px] uppercase tracking-wider text-white/35">
              Password
            </label>
            <button type="button" tabIndex={-1} className="text-[11px] text-white/35 hover:text-white/60 transition-colors">
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass + " pr-8"}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60 transition-colors"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.2A9.8 9.8 0 0112 5c5 0 8.5 4 10 7-1 1.9-2.7 3.8-4.9 5.1M6.6 6.6C4.7 7.9 3 9.9 2 12c1.2 2.4 4.1 6 10 6 1.1 0 2.1-.1 3-.4" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="text-[13px] text-rose-400 pt-4"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="group relative w-full mt-8 rounded-lg bg-indigo-500 text-white text-sm font-medium py-3 overflow-hidden transition-all active:scale-[0.98] disabled:opacity-60"
        >
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            style={{ background: "linear-gradient(115deg, transparent, rgba(255,255,255,0.25), transparent)" }}
          />
          <span className="relative">{status === "loading" ? "Authenticating…" : "Enter the workspace"}</span>
        </button>
      </form>

      <p className="text-sm text-white/35 mt-7 text-center">
        Don't have an account?{" "}
        <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          Create one
        </Link>
      </p>
    </>
  );
}