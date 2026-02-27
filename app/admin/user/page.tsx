"use client";

import { useCallback, useEffect, useState } from "react";

type UserItem = {
  id: string;
  bid: string;
  email: string;
  fullName: string;
  role: string;
  balance: number;
  telegramUsername: string;
  createdAt: string;
  completedOrders: number;
};

type UserDetail = UserItem & { sid: string };
type DepositItem = { id: string; amount: number; status: string; transactionId: string; createdAt: string };
type OrderItem = { id: string; orderId: string; productTitle: string; price: number; status: string; createdAt: string };

type SortField = "balance" | "createdAt" | "completedOrders";

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

export default function AdminUserPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  // Search
  const [bidSearch, setBidSearch] = useState("");
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      );
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder]);

  useEffect(() => {
    if (!detail) fetchUsers();
  }, [fetchUsers, detail]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleSearch = async () => {
    const q = bidSearch.trim().toUpperCase();
    if (!q) {
      setDetail(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users?bid=${q}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setDetail(data.user);
        setDeposits(data.deposits ?? []);
        setOrders(data.orders ?? []);
      } else {
        setDetail(null);
        setDeposits([]);
        setOrders([]);
        alert("User not found with that BID.");
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
        <h2 className="text-lg font-semibold text-slate-100">Users</h2>
        <p className="text-sm text-slate-500">
          User အားလုံး၏ စာရင်း — BID ဖြင့် ရှာဖွေ၍ အသေးစိတ်ကြည့်ရန်
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={bidSearch}
          onChange={(e) => setBidSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by BID (e.g. BID0000001)"
          className="w-64 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
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
              setBidSearch("");
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
          {/* User Info Card */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">BID</p>
                <p className="font-mono text-lg font-bold text-emerald-400">{detail.bid}</p>
              </div>
              {detail.sid && (
                <div>
                  <p className="text-xs text-slate-500">SID</p>
                  <p className="font-mono text-lg font-bold text-violet-400">{detail.sid}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-slate-200">{detail.fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Contact</p>
                <p className="text-slate-200 text-sm">
                  {detail.telegramUsername
                    ? `@${detail.telegramUsername}`
                    : detail.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <p className="capitalize text-slate-200">{detail.role}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Balance</p>
                <p className="font-semibold text-slate-200">{detail.balance.toLocaleString()} MMK</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Completed Orders</p>
                <p className="font-semibold text-slate-200">{detail.completedOrders}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Registered</p>
                <p className="text-sm text-slate-400">{new Date(detail.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Deposit History */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50">
            <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Deposit History ({deposits.length})
            </h3>
            {deposits.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No deposits</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">TxID</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/80">
                        <td className="px-4 py-2 text-xs text-slate-400">{new Date(d.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2 text-slate-200">{d.amount.toLocaleString()} MMK</td>
                        <td className="px-4 py-2 font-mono text-xs text-slate-400">{d.transactionId}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(d.status)}`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50">
            <h3 className="border-b border-slate-700/80 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Order History ({orders.length})
            </h3>
            {orders.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-left text-xs uppercase text-slate-500">
                      <th className="px-4 py-2">Order ID</th>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/80">
                        <td className="px-4 py-2 font-mono text-xs text-slate-400">{o.orderId}</td>
                        <td className="px-4 py-2 text-slate-200">{o.productTitle}</td>
                        <td className="px-4 py-2 text-slate-200">{o.price.toLocaleString()} MMK</td>
                        <td className="px-4 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(o.status)}`}>{o.status}</span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
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
          {/* Controls */}
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
            <p className="text-sm text-slate-500">
              Total: {total} users
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">UID (BID)</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none hover:text-slate-200"
                      onClick={() => handleSort("balance")}
                    >
                      Balance
                      <SortArrow active={sortBy === "balance"} order={sortOrder} />
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none hover:text-slate-200"
                      onClick={() => handleSort("createdAt")}
                    >
                      Register Date
                      <SortArrow active={sortBy === "createdAt"} order={sortOrder} />
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer select-none hover:text-slate-200"
                      onClick={() => handleSort("completedOrders")}
                    >
                      Orders Done
                      <SortArrow active={sortBy === "completedOrders"} order={sortOrder} />
                    </th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/80">
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400">{u.bid || "—"}</td>
                      <td className="px-4 py-3 text-slate-200">{u.fullName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {u.telegramUsername ? `@${u.telegramUsername}` : u.email}
                      </td>
                      <td className="px-4 py-3 text-slate-200">{u.balance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-300">{u.completedOrders}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setBidSearch(u.bid);
                            setTimeout(() => handleSearch(), 0);
                            // Directly fetch detail
                            (async () => {
                              const res = await fetch(`/api/admin/users?bid=${u.bid}`);
                              const data = await res.json();
                              if (res.ok && data.user) {
                                setDetail(data.user);
                                setDeposits(data.deposits ?? []);
                                setOrders(data.orders ?? []);
                              }
                            })();
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

          {/* Pagination */}
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
