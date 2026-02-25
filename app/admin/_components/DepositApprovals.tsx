"use client";

import { useState } from "react";

type Deposit = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  referenceId: string;
  createdAt: string;
  slip_image_url: string | null;
};

export function DepositApprovals({ deposits }: { deposits: Deposit[] }) {
  const [list, setList] = useState(deposits);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      // TODO: Call API to approve transaction (MongoDB: set status = 'approved')
      await new Promise((r) => setTimeout(r, 400));
      setList((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    try {
      // TODO: Call API to reject transaction (MongoDB: set status = 'rejected')
      await new Promise((r) => setTimeout(r, 400));
      setList((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setLoadingId(null);
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-6 py-10 text-center text-slate-500">
        No pending deposit slips.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/80 bg-slate-800/80">
              <th className="px-4 py-3 font-medium text-slate-400">
                Reference
              </th>
              <th className="px-4 py-3 font-medium text-slate-400">Amount</th>
              <th className="px-4 py-3 font-medium text-slate-400">Created</th>
              <th className="px-4 py-3 font-medium text-slate-400">Slip</th>
              <th className="px-4 py-3 font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr
                key={d.id}
                className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
              >
                <td className="px-4 py-3 font-mono text-slate-300">
                  {d.referenceId}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {d.amount.toLocaleString()} {d.currency}
                </td>
                <td className="px-4 py-3 text-slate-500">{d.createdAt}</td>
                <td className="px-4 py-3">
                  {d.slip_image_url ? (
                    <a
                      href={d.slip_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(d.id)}
                      disabled={loadingId === d.id}
                      className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/50 transition hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {loadingId === d.id ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(d.id)}
                      disabled={loadingId === d.id}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/50 transition hover:bg-red-500/30 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
