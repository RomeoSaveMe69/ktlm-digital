"use client";

/**
 * Buyer Orders Page.
 * - Lists all the buyer's orders
 * - Shows buyerInputData, status, price
 * - "Confirm Received" button when status = 'sent'
 * - Escrow settlement on confirm (handled server-side)
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OrderInputData = { label: string; value: string };
type Order = {
  id: string;
  orderId: string;
  productTitle: string;
  gameTitle: string;
  price: number;
  platformFee: number;
  buyerInputData: OrderInputData[];
  status: string;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  processing: "bg-blue-500/20 text-blue-400",
  sent: "bg-violet-500/20 text-violet-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const STATUS_MM: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  sent: "Sent - ရောက်ပြီ",
  completed: "Completed",
  cancelled: "Cancelled",
};

function RemainingTime({ sentAt }: { sentAt: string }) {
  const deadline = new Date(sentAt).getTime() + 24 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return <span className="text-xs text-slate-500">Auto-completing soon...</span>;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return (
    <span className="text-xs text-amber-400">
      ⏱ Auto-complete in {h}h {m}m
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      if (res.status === 401) { window.location.href = "/login"; return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to load."); return; }
      setOrders(data.orders ?? []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleConfirm = async (orderId: string) => {
    if (!window.confirm("Order ရောက်ကြောင်း Confirm ပြုလုပ်မည်လား? Seller ထံ ငွေပေးချေမည်။")) return;
    setConfirmingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Confirm failed.");
        return;
      }
      await loadOrders();
    } catch {
      alert("Network error.");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
            <h1 className="text-lg font-bold text-slate-100">My Orders</h1>
          </div>
          <Link href="/profile" className="text-sm text-slate-500 hover:text-slate-300">Profile</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-400">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center">
            <p className="text-slate-500">Order မရှိသေးပါ။</p>
            <Link href="/" className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
              Products ကြည့်ရန် →
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 space-y-3"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">{order.orderId}</p>
                  <p className="font-semibold text-slate-200">{order.productTitle}</p>
                  {order.gameTitle && (
                    <p className="text-xs text-slate-500">{order.gameTitle}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">
                    {order.price.toLocaleString()} MMK
                  </p>
                  <p className="text-xs text-slate-500">
                    Fee: {order.platformFee.toLocaleString()} MMK
                  </p>
                </div>
              </div>

              {/* Status + timing */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status] ?? "bg-slate-600/50 text-slate-400"}`}>
                  {STATUS_MM[order.status] ?? order.status}
                </span>
                {order.status === "sent" && order.sentAt && (
                  <RemainingTime sentAt={order.sentAt} />
                )}
                {order.completedAt && (
                  <span className="text-xs text-slate-500">
                    Completed: {new Date(order.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Buyer Input Data */}
              {order.buyerInputData.length > 0 && (
                <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2 space-y-1">
                  <p className="text-xs font-medium text-slate-500 mb-1">Order Details</p>
                  {order.buyerInputData.map((d) => (
                    <div key={d.label} className="flex justify-between text-xs">
                      <span className="text-slate-500">{d.label}</span>
                      <span className="font-mono font-medium text-slate-300">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-slate-600">
                {new Date(order.createdAt).toLocaleString()}
              </p>

              {/* Confirm Received */}
              {order.status === "sent" && (
                <button
                  type="button"
                  onClick={() => handleConfirm(order.id)}
                  disabled={confirmingId === order.id}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {confirmingId === order.id ? "Confirming..." : "✅ Confirm Received"}
                </button>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
