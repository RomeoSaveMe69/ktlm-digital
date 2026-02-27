"use client";

/**
 * Admin Recharge: Review and approve/reject pending deposit requests.
 * Approve logic: sets status→'approved' AND increments user.balance by amount.
 */

import { useCallback, useEffect, useState } from "react";

type DepositReq = {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  userBid: string;
  amount: number;
  transactionId: string;
  screenshot: string | null;
  status: string;
  methodName: string;
  methodType: string;
  createdAt: string;
};

export default function AdminRechargePage() {
  const [deposits, setDeposits] = useState<DepositReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ssModal, setSsModal] = useState<string | null>(null);

  const loadDeposits = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/deposits?status=${status}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to load."); return; }
      setDeposits(data.deposits ?? []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeposits(filter);
  }, [loadDeposits, filter]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (
      action === "approve" &&
      !window.confirm("Approve လုပ်မည်လား? User ၏ Balance တက်သွားမည်။")
    )
      return;
    if (
      action === "reject" &&
      !window.confirm("Reject လုပ်မည်လား?")
    )
      return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Action failed.");
        return;
      }
      await loadDeposits(filter);
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-400",
      approved: "bg-emerald-500/20 text-emerald-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    return styles[s] ?? "bg-slate-600/50 text-slate-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Recharge</h2>
        <p className="text-sm text-slate-500">
          User များ ငွေသွင်းထားသည့် Requests စစ်ဆေး အတည်ပြုရန်
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-700/60 bg-slate-800/50 p-1 w-fit">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
              filter === s
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-red-400">
          {error}
        </div>
      ) : deposits.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
          {filter === "pending"
            ? "Pending requests မရှိပါ။"
            : `${filter} requests မရှိပါ။`}
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((r) => {
            const isBusy = actionLoading === r.id;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4"
              >
                <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
                  {/* Screenshot */}
                  <button
                    type="button"
                    onClick={() => r.screenshot && setSsModal(r.screenshot)}
                    className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border ${
                      r.screenshot
                        ? "border-slate-600 cursor-pointer hover:opacity-80"
                        : "border-slate-700 cursor-default"
                    } bg-slate-700/80 flex items-center justify-center`}
                  >
                    {r.screenshot ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.screenshot}
                        alt="Screenshot"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">No SS</span>
                    )}
                  </button>

                  {/* Info */}
                  <div className="min-w-0 flex-1 text-sm space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.userBid && (
                        <span className="rounded bg-slate-700/80 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
                          {r.userBid}
                        </span>
                      )}
                      <span className="font-medium text-slate-200">
                        {r.userFullName || r.userEmail}
                      </span>
                      {r.userFullName && (
                        <span className="text-xs text-slate-500">{r.userEmail}</span>
                      )}
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Amount:{" "}
                      <span className="font-bold text-emerald-400">
                        {r.amount.toLocaleString()} MMK
                      </span>
                    </p>
                    <p className="text-slate-400">
                      Method: {r.methodName}
                      <span className="ml-1 text-xs text-slate-500">
                        ({r.methodType === "qr" ? "MMQR" : "Account"})
                      </span>
                    </p>
                    <p className="text-slate-500 font-mono text-xs">
                      TxID: {r.transactionId}
                    </p>
                    <p className="text-slate-600 text-xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  {r.status === "pending" && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(r.id, "approve")}
                        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {isBusy ? "..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(r.id, "reject")}
                        className="rounded-lg border border-slate-600 bg-slate-700/50 px-5 py-2 text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 disabled:opacity-60"
                      >
                        {isBusy ? "..." : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot modal */}
      {ssModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSsModal(null)}
        >
          <div className="relative max-h-[90vh] max-w-lg overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ssModal}
              alt="Screenshot"
              className="max-h-[80vh] w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setSsModal(null)}
              className="absolute right-3 top-3 rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
