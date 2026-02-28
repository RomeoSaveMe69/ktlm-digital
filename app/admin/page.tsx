"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type OverviewStats = {
  totalUserMoney: number;
  depositPending: number;
  withdrawableMoney: number;
  totalSale: number;
  totalOrderCount: number;
  withdrawPendingCount: number;
  charts: {
    dailySale: { date: string; amount: number; orders: number }[];
    monthlySale: { month: string; amount: number; orders: number }[];
    dailyRecharge: { date: string; amount: number }[];
  };
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

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(71, 85, 105, 0.6)",
    borderRadius: "0.75rem",
    fontSize: "0.75rem",
  },
  labelStyle: { color: "#94a3b8" },
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [sid, setSid] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchStats = useCallback(
    async (s?: string, sd?: string, ed?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const _sid = s ?? sid;
        const _sd = sd ?? startDate;
        const _ed = ed ?? endDate;
        if (_sid) params.set("sid", _sid);
        if (_sd) params.set("startDate", _sd);
        if (_ed) params.set("endDate", _ed);
        const res = await fetch(`/api/admin/overview?${params.toString()}`);
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [sid, startDate, endDate],
  );

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter() {
    fetchStats(sid, startDate, endDate);
  }

  function handleClear() {
    setSid("");
    setStartDate("");
    setEndDate("");
    fetchStats("", "", "");
  }

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-100">Overview</h2>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Seller ID (SID)
          </label>
          <input
            type="text"
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            placeholder="e.g. SID0000001"
            className="w-40 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleFilter}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 transition hover:bg-slate-800"
        >
          Clear
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatCard
          label="Total User Money"
          value={stats ? fmt(stats.totalUserMoney) + " MMK" : "—"}
          sub="All users' wallet balances"
          accent="text-emerald-400"
          loading={loading}
        />
        <StatCard
          label="Total Deposit Pending"
          value={stats ? fmt(stats.depositPending) + " MMK" : "—"}
          sub="Pending approval amount"
          accent="text-amber-400"
          loading={loading}
        />
        <StatCard
          label="Withdrawable Money"
          value={stats ? fmt(stats.withdrawableMoney) + " MMK" : "—"}
          sub="Seller withdrawable balances"
          accent="text-violet-400"
          loading={loading}
        />
        <StatCard
          label="Total Sale"
          value={stats ? fmt(stats.totalSale) + " MMK" : "—"}
          sub="Total order amounts"
          accent="text-emerald-400"
          loading={loading}
        />
        <StatCard
          label="Total Orders"
          value={stats ? fmt(stats.totalOrderCount) : "—"}
          sub="Order count"
          accent="text-blue-400"
          loading={loading}
        />
        <StatCard
          label="Withdraw Pending"
          value={stats ? fmt(stats.withdrawPendingCount) : "—"}
          sub="Pending withdrawal requests"
          accent="text-amber-400"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Sale Amount */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-400">
            Daily Sale Amount
          </h3>
          {stats?.charts.dailySale.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.charts.dailySale}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip {...chartTooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Sale (MMK)"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-slate-600">
              No data
            </div>
          )}
        </div>

        {/* Monthly Sale Amount */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-400">
            Monthly Sale Amount
          </h3>
          {stats?.charts.monthlySale.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.charts.monthlySale}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip {...chartTooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }}
                />
                <Bar
                  dataKey="amount"
                  name="Sale (MMK)"
                  fill="#34d399"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="orders"
                  name="Order Count"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-slate-600">
              No data
            </div>
          )}
        </div>

        {/* Daily Recharge Amount */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-400">
            Daily Recharge Amount
          </h3>
          {stats?.charts.dailyRecharge.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.charts.dailyRecharge}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip {...chartTooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Recharge (MMK)"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-slate-600">
              No data
            </div>
          )}
        </div>

        {/* Daily Orders */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-400">
            Daily Orders
          </h3>
          {stats?.charts.dailySale.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.charts.dailySale}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip {...chartTooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }}
                />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-slate-600">
              No data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
