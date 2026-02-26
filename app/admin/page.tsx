"use client";

/**
 * Admin Overview Dashboard.
 * Real data: Total User Money (sum of all balances), Depositing Pending (sum of pending deposit amounts).
 * Placeholder: Withdraw Able Money, Total Sale, Total Order, Admin Profit, Withdraw Pending.
 */

import { useEffect, useState } from "react";

type OverviewStats = {
  totalUserMoney: number;
  depositingPending: number;
};

function StatCard({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 shadow-lg transition hover:border-emerald-500/30 hover:shadow-emerald-500/5">
      <p className="text-sm text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-28 animate-pulse rounded bg-slate-700/60" />
      ) : (
        <p className={`mt-1 text-2xl font-bold ${accent ?? "text-slate-100"}`}>
          {value}
        </p>
      )}
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const PLACEHOLDER_CARDS = [
  { label: "Withdraw Able Money", value: "0 (Pending Data)", sub: "MMK" },
  { label: "Total Sale", value: "0 (Pending Data)", sub: "MMK" },
  { label: "Total Order", value: "0 (Pending Data)", sub: "Count" },
  { label: "Admin Profit (0.5%)", value: "0 (Pending Data)", sub: "MMK" },
  { label: "Withdraw Pending", value: "0 (Pending Data)", sub: "MMK" },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((data) => {
        if (data.totalUserMoney !== undefined) {
          setStats({
            totalUserMoney: data.totalUserMoney,
            depositingPending: data.depositingPending,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Real Data Cards */}
          <StatCard
            label="Total User Money"
            value={
              stats
                ? stats.totalUserMoney.toLocaleString() + " MMK"
                : "Loading..."
            }
            sub="All users' wallet balances"
            accent="text-emerald-400"
            loading={loading}
          />
          <StatCard
            label="Depositing Pending"
            value={
              stats
                ? stats.depositingPending.toLocaleString() + " MMK"
                : "Loading..."
            }
            sub="Pending approval amount"
            accent="text-amber-400"
            loading={loading}
          />

          {/* Placeholder Cards */}
          {PLACEHOLDER_CARDS.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              sub={card.sub}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Charts (Placeholder)
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
            <h3 className="text-sm font-medium text-slate-400">Sales Trend</h3>
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-slate-800/80 text-slate-500">
              Chart area — integrate when backend ready
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
            <h3 className="text-sm font-medium text-slate-400">
              Deposit vs Withdraw
            </h3>
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-slate-800/80 text-slate-500">
              Chart area — integrate when backend ready
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
