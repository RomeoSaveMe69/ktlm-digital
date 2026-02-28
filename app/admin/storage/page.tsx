"use client";

import { useCallback, useEffect, useState } from "react";

type DepositItem = {
  _id: string;
  userEmail: string;
  userName: string;
  amount: number;
  status: string;
  screenshotSizeKB: number;
  transactionId: string;
  createdAt: string;
};

type StorageStats = {
  rechargeReceipts: { count: number; sizeMB: number };
  kyc: { count: number; sizeMB: number };
  sellerProfiles: { count: number; sizeMB: number };
  gamePhotos: { count: number; sizeMB: number };
};

export default function AdminStoragePage() {
  const [items, setItems] = useState<DepositItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(
    async (p?: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        params.set("limit", String(limit));
        params.set("page", String(p ?? page));
        const res = await fetch(`/api/admin/storage?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setItems(data.items ?? []);
          setStats(data.storageStats ?? null);
          setTotalPages(data.totalPages ?? 1);
          setTotalCount(data.totalCount ?? 0);
          if (p) setPage(p);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, limit, page],
  );

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter() {
    fetchData(1);
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    setTimeout(() => fetchData(1), 0);
  }

  const handleClearOne = async (depositId: string) => {
    if (!confirm("Delete this receipt image?")) return;
    setClearing(depositId);
    try {
      const res = await fetch("/api/admin/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId }),
      });
      if (res.ok) await fetchData();
    } catch {
      /* ignore */
    } finally {
      setClearing(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`Clear ALL ${totalCount} receipt images? This cannot be undone.`))
      return;
    setClearingAll(true);
    try {
      const res = await fetch("/api/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-all" }),
      });
      if (res.ok) await fetchData(1);
    } catch {
      /* ignore */
    } finally {
      setClearingAll(false);
    }
  };

  const totalStorageMB = stats
    ? +(
        stats.rechargeReceipts.sizeMB +
        stats.kyc.sizeMB +
        stats.sellerProfiles.sizeMB +
        stats.gamePhotos.sizeMB
      ).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">
          Storage Management
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage recharge receipt images and monitor database storage usage.
        </p>
      </div>

      {/* ═══ Section A: Recharge Uploads ═══ */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Recharge Receipt Uploads
        </h3>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
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
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
            </select>
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
          {totalCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearingAll}
              className="ml-auto rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {clearingAll ? "Clearing..." : `Clear All (${totalCount})`}
            </button>
          )}
        </div>

        {/* Receipts Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
            No receipt images found for this filter.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Txn ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/80">
                      <td className="px-4 py-3">
                        <p className="text-slate-200">
                          {item.userName || item.userEmail}
                        </p>
                        {item.userName && (
                          <p className="text-xs text-slate-500">
                            {item.userEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.amount.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {item.transactionId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.screenshotSizeKB} KB
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleClearOne(item._id)}
                          disabled={clearing === item._id}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {clearing === item._id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fetchData(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchData(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ═══ Section B: Storage Usage Stats ═══ */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          KYC & Photo Storage Usage
        </h3>
        <p className="text-xs text-slate-500">
          Estimated database storage used by images. No photos are displayed
          here.
        </p>

        {stats ? (
          <>
            {/* Total */}
            <div className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-5">
              <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
                Total Estimated Image Storage
              </p>
              <p className="mt-2 text-4xl font-bold text-violet-400">
                {totalStorageMB}{" "}
                <span className="text-lg text-slate-400">MB</span>
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Recharge Receipts",
                  ...stats.rechargeReceipts,
                  accent: "text-amber-400",
                },
                {
                  label: "KYC Applications",
                  ...stats.kyc,
                  accent: "text-emerald-400",
                },
                {
                  label: "Seller Profiles",
                  ...stats.sellerProfiles,
                  accent: "text-blue-400",
                },
                {
                  label: "Game Photos",
                  ...stats.gamePhotos,
                  accent: "text-violet-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4"
                >
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${s.accent}`}>
                    {s.sizeMB}{" "}
                    <span className="text-sm text-slate-500">MB</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.count} item{s.count !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8 text-slate-500">
            Loading stats...
          </div>
        )}
      </section>
    </div>
  );
}
