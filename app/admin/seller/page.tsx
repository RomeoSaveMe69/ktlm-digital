"use client";

import { useCallback, useEffect, useState } from "react";

type SellerItem = {
  id: string;
  sid: string;
  email: string;
  fullName: string;
  withdrawableBalance: number;
  telegramUsername: string;
  createdAt: string;
  salesCompleted: number;
};

type SellerDetail = SellerItem & {
  bid: string;
  role: string;
  balance: number;
  pendingBalance: number;
  withdrawPendingBalance: number;
};

type WithdrawalItem = { id: string; amount: number; paymentMethod: string; accountName: string; paymentNumber: string; status: string; createdAt: string };
type SaleItem = { id: string; orderId: string; productTitle: string; buyerName: string; price: number; feeAmount: number; sellerReceivedAmount: number; status: string; createdAt: string };

type SortField = "withdrawableBalance" | "createdAt" | "salesCompleted";

const SortArrow = ({ active, order }: { active: boolean; order: string }) => (
  <span className={`ml-1 inline-block ${active ? "text-emerald-400" : "text-slate-600"}`}>
    {active && order === "asc" ? "▲" : active && order === "desc" ? "▼" : "⇅"}
  </span>
);

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    approved: "bg-emerald-500/20 text-emerald-400",
    rejected: "bg-red-500/20 text-red-400",
    completed: "bg-emerald-500/20 text-emerald-400",
    processing: "bg-blue-500/20 text-blue-400",
    sent: "bg-cyan-500/20 text-cyan-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  return m[s] ?? "bg-slate-600/50 text-slate-400";
};

export default function AdminSellerPage() {
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  // Search
  const [sidSearch, setSidSearch] = useState("");
  const [detail, setDetail] = useState<SellerDetail | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/sellers?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      );
      const data = await res.json();
      if (res.ok) {
        setSellers(data.sellers ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder]);

  useEffect(() => {
    if (!detail) fetchSellers();
  }, [fetchSellers, detail]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleSearch = async (sid?: string) => {
    const q = (sid ?? sidSearch).trim().toUpperCase();
    if (!q) {
      setDetail(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/sellers?sid=${q}`);
      const data = await res.json();
      if (res.ok && data.seller) {
        setDetail(data.seller);
        setWithdrawals(data.withdrawals ?? []);
        setSales(data.sales ?? []);
      } else {
        setDetail(null);
        alert("Seller not found with that SID.");
      }
    } catch {
      alert("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Sellers</h2>
        <p className="text-sm text-slate-500">
          Seller အားလုံး၏ စာရင်း — SID ဖြင့် ရှာဖွေ၍ အသေးစိတ်ကြည့်ရန်
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={sidSearch}
          onChange={(e) => setSidSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by SID (e.g. SID0000001)"
          className="w-64 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={searching}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {searching ? "..." : "Search"}
        </button>
        {detail && (
          <button
            type="button"
            onClick={() => {
              setDetail(null);
              setSidSearch("");
            }}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-700"
          >
            Back to List
          </button>
        )}
      </div>

      {/* ── Detail View ── */}
      {detail ? (
        <div className="space-y-6">
          {/* Seller Info Card */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">SID</p>
                <p className="font-mono text-lg font-bold text-violet-400">{detail.sid}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">BID</p>
                <p className="font-mono text-lg font-bold text-emerald-400">{detail.bid}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-slate-200">{detail.fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Contact</p>
                <p className="text-slate-200 text-sm">
                  {detail.telegramUsername ? `@${detail.telegramUsername}` : detail.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Sale Money</p>
                <p className="font-semibold text-emerald-400">{detail.withdrawableBalance.toLocaleString()} MMK</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Balance</p>
                <p className="font-semibold text-blue-400">{detail.balance.toLocaleString()} MMK</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending Balance</p>
                <p className="font-semibold text-amber-400">{detail.pendingBalance.toLocaleString()} MMK</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Withdraw Pending</p>
                <p className="font-semibold text-violet-400">{detail.withdrawPendingBalance.toLocaleString()} MMK</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Sales Completed</p>
                <p className="font-semibold text-slate-200">{detail.salesCompleted}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Registered</p>
                <p className="text-sm text-slate-400">{new Date(detail.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50">
            <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Withdrawal History ({withdrawals.length})
            </h3>
            {withdrawals.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No withdrawals</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Method</th>
                      <th className="px-4 py-2">Account</th>
                      <th className="px-4 py-2">Number</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/80">
                        <td className="px-4 py-2 text-xs text-slate-400">{new Date(w.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2 text-slate-200">{w.amount.toLocaleString()} MMK</td>
                        <td className="px-4 py-2 text-slate-300">{w.paymentMethod}</td>
                        <td className="px-4 py-2 text-slate-300">{w.accountName}</td>
                        <td className="px-4 py-2 text-slate-400">{w.paymentNumber || "—"}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(w.status)}`}>{w.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sales History */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50">
            <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Sales History ({sales.length})
            </h3>
            {sales.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No sales</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-2">Order ID</th>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Buyer</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Fee</th>
                      <th className="px-4 py-2">Received</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {sales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/80">
                        <td className="px-4 py-2 font-mono text-xs text-slate-400">{s.orderId}</td>
                        <td className="px-4 py-2 text-slate-200">{s.productTitle}</td>
                        <td className="px-4 py-2 text-slate-300">{s.buyerName}</td>
                        <td className="px-4 py-2 text-slate-200">{s.price.toLocaleString()}</td>
                        <td className="px-4 py-2 text-red-400">{s.feeAmount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-emerald-400">{s.sellerReceivedAmount.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(s.status)}`}>{s.status}</span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Table View ── */
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
            <p className="text-sm text-slate-500">Total: {total} sellers</p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">SID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none hover:text-slate-200"
                      onClick={() => handleSort("withdrawableBalance")}
                    >
                      Total Sale Money
                      <SortArrow active={sortBy === "withdrawableBalance"} order={sortOrder} />
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none hover:text-slate-200"
                      onClick={() => handleSort("salesCompleted")}
                    >
                      Sales Done
                      <SortArrow active={sortBy === "salesCompleted"} order={sortOrder} />
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none hover:text-slate-200"
                      onClick={() => handleSort("createdAt")}
                    >
                      Register Date
                      <SortArrow active={sortBy === "createdAt"} order={sortOrder} />
                    </th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/80">
                      <td className="px-4 py-3 font-mono text-xs text-violet-400">{s.sid || "—"}</td>
                      <td className="px-4 py-3 text-slate-200">{s.fullName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {s.telegramUsername ? `@${s.telegramUsername}` : s.email}
                      </td>
                      <td className="px-4 py-3 text-emerald-400">{s.withdrawableBalance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">{s.salesCompleted}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSidSearch(s.sid);
                            handleSearch(s.sid);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-slate-400">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
