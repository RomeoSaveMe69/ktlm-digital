"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BecomeSellerForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "seller" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessage({ type: "success", text: "You are now a seller. Redirecting..." });
      router.push("/seller");
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
      {message && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <p className="mb-6 text-sm text-slate-400">
        By becoming a seller you can list products (game top-ups, etc.). You will need to complete KYC when we enable it.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500/20 py-3 font-medium text-emerald-400 ring-1 ring-emerald-500/50 transition hover:bg-emerald-500/30 disabled:opacity-50"
      >
        {loading ? "…" : "Apply to become a Seller"}
      </button>
    </form>
  );
}
