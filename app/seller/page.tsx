"use client";

import { useCallback, useEffect, useState } from "react";

type SellerStats = {
  withdrawableBalance: number;
  balance: number;
  pendingBalance: number;
  pendingOrderCount: number;
  processingOrderCount: number;
  withdrawPendingBalance: number;
  totalProfit: number;
};

export default function SellerOverviewPage() {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/overview");
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading overview...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20 text-red-400">
        Failed to load overview data.
      </div>
    );
  }

  const cards = [
    {
      label: "Total Sale Money",
      value: stats.withdrawableBalance,
      icon: "💰",
      color: "text-emerald-400",
      bgGlow: "hover:border-emerald-500/30 hover:shadow-emerald-500/5",
    },
    {
      label: "Balance",
      value: stats.balance,
      icon: "💵",
      color: "text-blue-400",
      bgGlow: "hover:border-blue-500/30 hover:shadow-blue-500/5",
    },
    {
      label: "Pending Money",
      value: stats.pendingBalance,
      icon: "⏳",
      color: "text-amber-400",
      bgGlow: "hover:border-amber-500/30 hover:shadow-amber-500/5",
    },
    {
      label: "Total Pending Order",
      value: stats.pendingOrderCount,
      icon: "📋",
      color: "text-orange-400",
      bgGlow: "hover:border-orange-500/30 hover:shadow-orange-500/5",
      isCount: true,
    },
    {
      label: "Total Processing Order",
      value: stats.processingOrderCount,
      icon: "⚙️",
      color: "text-cyan-400",
      bgGlow: "hover:border-cyan-500/30 hover:shadow-cyan-500/5",
      isCount: true,
    },
    {
      label: "Withdraw Pending Money",
      value: stats.withdrawPendingBalance,
      icon: "🏦",
      color: "text-violet-400",
      bgGlow: "hover:border-violet-500/30 hover:shadow-violet-500/5",
    },
    {
      label: "Total Profit",
      value: stats.totalProfit,
      icon: "✨",
      color: "text-pink-400",
      bgGlow: "hover:border-pink-500/30 hover:shadow-pink-500/5",
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 shadow-lg transition ${card.bgGlow}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${card.color}`}>
                    {card.isCount
                      ? card.value
                      : card.value.toLocaleString()}
                  </p>
                  {!card.isCount && (
                    <p className="mt-0.5 text-xs text-slate-500">MMK</p>
                  )}
                </div>
                <span className="text-2xl opacity-80" aria-hidden>
                  {card.icon}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
