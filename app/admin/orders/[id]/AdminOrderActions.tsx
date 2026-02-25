"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "disputed",
] as const;

export function AdminOrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!STATUSES.includes(newStatus as (typeof STATUSES)[number])) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">
        Change status (admin intervene)
      </p>
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-200 disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
