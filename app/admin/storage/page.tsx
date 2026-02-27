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
  updatedAt: string;
};

export default function AdminStoragePage() {
  const [items, setItems] = useState<DepositItem[]>([]);
  const [totalMB, setTotalMB] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/storage");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setTotalMB(data.totalMB ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearOne = async (depositId: string) => {
    if (!confirm("ဤ Deposit ၏ Screenshot ကို ဖျက်မည်။ သေချာပါသလား?")) return;
    setClearing(depositId);
    try {
      const res = await fetch("/api/admin/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      /* ignore */
    } finally {
      setClearing(null);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        `Approved/Rejected Deposit ${items.length} ခု၏ Screenshot အားလုံးကို ဖျက်မည်။ သေချာပါသလား?`,
      )
    )
      return;
    setClearingAll(true);
    try {
      const res = await fetch("/api/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-all" }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      /* ignore */
    } finally {
      setClearingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading storage data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          Storage Management
        </h2>
        <p className="text-sm text-slate-500">
          Database နေရာလွတ်စေရန် Approved/Rejected Deposit Screenshot များကို
          ရှင်းလင်းပါ
        </p>
      </div>

      {/* Storage Overview Card */}
      <div className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Estimated Storage Used by Images
            </p>
            <p className="mt-2 text-4xl font-bold text-violet-400">
              {totalMB} <span className="text-lg text-slate-400">MB</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {items.length} screenshot(s) from approved/rejected deposits
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearingAll}
              className="rounded-lg bg-red-600/80 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {clearingAll ? "Clearing..." : "Clear All Images"}
            </button>
          )}
        </div>
      </div>

      {/* Deposit Screenshots Table */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-10 text-center text-slate-500">
          ရှင်းလင်းရန် Screenshot မရှိပါ။
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Image Size</th>
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
                      <p className="text-xs text-slate-500">{item.userEmail}</p>
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
                      {clearing === item._id ? "..." : "Clear Image"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
