"use client";

import { useCallback, useEffect, useState } from "react";

type WithdrawalItem = {
  _id: string;
  sellerEmail: string;
  sellerName: string;
  amount: number;
  paymentMethod: string;
  accountName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminWithdrawPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/withdrawals");
      const data = await res.json();
      if (res.ok) setWithdrawals(data.withdrawals ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const label = action === "approve" ? "Approve" : "Reject";
    if (!confirm(`${label} this withdrawal request?`)) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await fetchData();
    } catch {
      /* ignore */
    } finally {
      setProcessing(null);
    }
  };

  const pending = withdrawals.filter((w) => w.status === "pending");
  const history = withdrawals.filter((w) => w.status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading withdrawal requests...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          Withdrawal Requests
        </h2>
        <p className="text-sm text-slate-500">
          Seller များ၏ ငွေထုတ်ယူမှု တောင်းဆိုချက်များကို စီမံပါ
        </p>
      </div>

      {/* Pending Requests */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-400">
          Pending ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-8 text-center text-sm text-slate-500">
            Pending withdrawal request မရှိပါ
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {pending.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-800/80">
                    <td className="px-4 py-3">
                      <p className="text-slate-200">
                        {w.sellerName || w.sellerEmail}
                      </p>
                      {w.sellerName && (
                        <p className="text-xs text-slate-500">
                          {w.sellerEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {w.amount.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {w.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {w.accountName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(w.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(w._id, "approve")}
                          disabled={processing === w._id}
                          className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          {processing === w._id ? "..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(w._id, "reject")}
                          disabled={processing === w._id}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                        >
                          {processing === w._id ? "..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            History ({history.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {history.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-800/80">
                    <td className="px-4 py-3 text-slate-300">
                      {w.sellerName || w.sellerEmail}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {w.amount.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {w.paymentMethod}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          w.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(w.updatedAt || w.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
