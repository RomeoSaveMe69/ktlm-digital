"use client";

import Link from "next/link";
import { useState } from "react";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      let data: { error?: string; user?: unknown } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid response from server." };
      }
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Login failed." });
        setLoading(false);
        return;
      }
      window.location.href = "/profile";
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim() || undefined,
        }),
      });
      let data: { error?: string; user?: unknown } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid response from server." };
      }
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Sign up failed." });
        setLoading(false);
        return;
      }
      window.location.href = "/profile";
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = authMode === "signin";
  const onSubmit = isSignIn ? handleSignIn : handleSignUp;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Kone The Lay Myar
            </span>
            <span className="text-slate-400 font-normal text-sm ml-1">
              Digital
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 shadow-xl shadow-black/20">
          <div className="flex rounded-lg bg-slate-900/80 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setMessage(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                isSignIn
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setMessage(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                !isSignIn
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign up
            </button>
          </div>

          <h1 className="text-xl font-bold text-slate-100 mb-1">
            {isSignIn ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {isSignIn
              ? "Use your email and password"
              : "Sign up with email and password"}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-400 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/80 py-3 px-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {!isSignIn && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-slate-400 mb-1.5"
                >
                  Name (optional)
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/80 py-3 px-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-400 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignIn ? undefined : 6}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/80 py-3 px-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              {!isSignIn && (
                <p className="mt-1 text-xs text-slate-500">
                  At least 6 characters
                </p>
              )}
            </div>

            {!isSignIn && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-400 mb-1.5"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/80 py-3 px-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            )}

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                    : "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
                }`}
              >
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "…" : isSignIn ? "Sign in" : "Sign up"}
            </button>
          </form>

          {!isSignIn && (
            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setMessage(null);
                }}
                className="text-emerald-400 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-emerald-400 hover:underline">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
