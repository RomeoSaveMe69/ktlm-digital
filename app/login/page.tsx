"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMessage({
        type: "success",
        text: "Check your email for the magic link to sign in.",
      });
      setEmail("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      window.location.href = "/profile";
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Invalid email or password.",
      });
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = mode === "magic" ? handleMagicLink : handlePassword;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Kone The Lay Myar
            </span>
            <span className="text-slate-400 font-normal text-sm ml-1">Digital</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 shadow-xl shadow-black/20">
          <h1 className="text-xl font-bold text-slate-100 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-6">
            Use your email — magic link or password
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1.5">
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

            {mode === "password" && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={mode === "password"}
                  autoComplete="current-password"
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
              {loading
                ? "…"
                : mode === "magic"
                  ? "Send magic link"
                  : "Sign in"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "magic" ? "password" : "magic"));
              setMessage(null);
            }}
            className="mt-4 w-full text-center text-sm text-slate-500 hover:text-emerald-400 transition"
          >
            {mode === "magic"
              ? "Sign in with password instead"
              : "Use magic link instead"}
          </button>
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
