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
  status: string;
  suspendedUntil: string | null;
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

const orderStatusBadge = (s: string) => {
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

const accountStatusBadge = (s: string) => {
  switch (s) {
    case "ACTIVE": return "bg-emerald-500/20 text-emerald-400";
    case "SUSPENDED": return "bg-amber-500/20 text-amber-400";
    case "BANNED": return "bg-red-500/20 text-red-400";
    default: return "bg-slate-600/50 text-slate-400";
  }
};

function UserManageModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(user.status || "ACTIVE");
  const [suspendedUntil, setSuspendedUntil] = useState(
    user.suspendedUntil ? new Date(user.suspendedUntil).toISOString().slice(0, 16) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status };
      if (status === "SUSPENDED") {
        if (!suspendedUntil) {
          setError("Please select a suspension end date/time.");
          setSaving(false);
          return;
        }
        body.suspendedUntil = new Date(suspendedUntil).toISOString();
      }
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status");
        return;
      }
      onSaved();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Manage User</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl leading-none">&times;</button>
        </div>

        {/* User info */}
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-700/40 bg-slate-800/50 p-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">BID</p>
            <p className="font-mono text-emerald-400">{user.bid}</p>
          </div>
          {user.sid && (
            <div>
              <p className="text-xs text-slate-500">SID</p>
              <p className="font-mono text-violet-400">{user.sid}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">Name</p>
            <p className="text-slate-200">{user.fullName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-slate-200 break-all">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Role</p>
            <p className="capitalize text-slate-200">{user.role}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-slate-200">{user.balance.toLocaleString()} MMK</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Status</p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${accountStatusBadge(user.status)}`}>
              {user.status || "ACTIVE"}
            </span>
            {user.status === "SUSPENDED" && user.suspendedUntil && (
              <p className="mt-1 text-xs text-amber-400/80">Until: {new Date(user.suspendedUntil).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Status selector */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspend</option>
              <option value="BANNED">Ban (Permanent)</option>
            </select>
          </div>

          {status === "SUSPENDED" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Suspend Until</label>
              <input
                type="datetime-local"
                value={suspendedUntil}
                onChange={(e) => setSuspendedUntil(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">The user will be auto-reactivated after this date/time.</p>
            </div>
          )}

          {status === "BANNED" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">
                This will permanently ban the user. They will not be able to log in until an admin manually sets their status back to Active.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const [bidSearch, setBidSearch] = useState("");
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [searching, setSearching] = useState(false);

  const [manageUser, setManageUser] = useState<UserDetail | null>(null);
  const [fixingBids, setFixingBids] = useState(false);

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

  const fetchDetail = async (bid: string) => {
    const res = await fetch(`/api/admin/users?bid=${bid}`);
    const data = await res.json();
    if (res.ok && data.user) {
      setDetail(data.user);
      setDeposits(data.deposits ?? []);
      setOrders(data.orders ?? []);
      return data.user as UserDetail;
    }
    return null;
  };

  const handleSearch = async () => {
    const q = bidSearch.trim().toUpperCase();
    if (!q) {
      setDetail(null);
      return;
    }
    setSearching(true);
    try {
      const result = await fetchDetail(q);
      if (!result) {
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

  const handleFixBids = async () => {
    if (!confirm("This will assign BIDs to all users who don't have one. Continue?")) return;
    setFixingBids(true);
    try {
      const res = await fetch("/api/admin/fix-users", { method: "POST" });
      const data = await res.json();
      alert(data.message ?? "Done");
      fetchUsers();
    } catch {
      alert("Failed to fix BIDs.");
    } finally {
      setFixingBids(false);
    }
  };

  const handleManageSaved = async () => {
    setManageUser(null);
    if (detail) {
      await fetchDetail(detail.bid);
    }
    fetchUsers();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Users</h2>
          <p className="text-sm text-slate-500">
            Manage all users — search by BID, view details, update account status
          </p>
        </div>
        <button
          type="button"
          onClick={handleFixBids}
          disabled={fixingBids}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
        >
          {fixingBids ? "Fixing..." : "Fix Missing BIDs"}
        </button>
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
            onClick={() => { setDetail(null); setBidSearch(""); }}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-700"
          >
            Back to List
          </button>
        )}
      </div>

      {/* ── Detail View ── */}
      {detail ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">User Info</h3>
              <button
                type="button"
                onClick={() => setManageUser(detail)}
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
              >
                Manage Status
              </button>
            </div>
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
                <p className="text-sm text-slate-200">
                  {detail.telegramUsername ? `@${detail.telegramUsername}` : detail.email}
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
              <div>
                <p className="text-xs text-slate-500">Account Status</p>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${accountStatusBadge(detail.status)}`}>
                  {detail.status || "ACTIVE"}
                </span>
                {detail.status === "SUSPENDED" && detail.suspendedUntil && (
                  <p className="mt-1 text-xs text-amber-400/80">Until: {new Date(detail.suspendedUntil).toLocaleString()}</p>
                )}
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
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusBadge(d.status)}`}>{d.status}</span>
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
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusBadge(o.status)}`}>{o.status}</span>
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
            <p className="text-sm text-slate-500">Total: {total} users</p>
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
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-200" onClick={() => handleSort("balance")}>
                      Balance <SortArrow active={sortBy === "balance"} order={sortOrder} />
                    </th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-200" onClick={() => handleSort("createdAt")}>
                      Register Date <SortArrow active={sortBy === "createdAt"} order={sortOrder} />
                    </th>
                    <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-200" onClick={() => handleSort("completedOrders")}>
                      Orders Done <SortArrow active={sortBy === "completedOrders"} order={sortOrder} />
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
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${accountStatusBadge(u.status)}`}>
                          {u.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-300">{u.completedOrders}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const result = await fetchDetail(u.bid);
                              if (result) setBidSearch(u.bid);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const result = await fetchDetail(u.bid);
                              if (result) setManageUser(result);
                            }}
                            className="text-violet-400 hover:text-violet-300 text-xs font-medium"
                          >
                            Manage
                          </button>
                        </div>
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
              <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
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

      {/* Management Modal */}
      {manageUser && (
        <UserManageModal
          user={manageUser}
          onClose={() => setManageUser(null)}
          onSaved={handleManageSaved}
        />
      )}
    </div>
  );
}
