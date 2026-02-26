"use client";

/**
 * Seller Order Management Page.
 * - Lists real orders from DB (via /api/seller/orders)
 * - Status flow buttons: Pending → Processing → Sent
 * - "View Detail" modal showing buyer's input data (UID etc.)
 * - Cancel button for pending orders
 */

import { useCallback, useEffect, useState } from "react";

type InputData = { label: string; value: string };
type Order = {
  id: string;
  orderId: string;
  productTitle: string;
  buyerEmail: string;
  buyerName: string;
  price: number;
  buyerInputData: InputData[];
  status: string;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type FilterStatus = "" | "pending" | "processing" | "sent" | "completed" | "cancelled";

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
  sent: "Sent",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ADVANCE_LABEL: Record<string, string> = {
  pending: "▶ Processing",
  processing: "📦 Mark as Sent",
};

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "sent", label: "Sent" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function SellerOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Detail modal
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async (status?: FilterStatus) => {
    setLoading(true);
    setError(null);
    try {
      const url = status
        ? `/api/seller/orders?status=${status}`
        : "/api/seller/orders";
      const res = await fetch(url);
      if (res.status === 401 || res.status === 403) {
        setError("Access denied.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to load."); return; }
      setOrders(data.orders ?? []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(filterStatus || undefined);
  }, [loadOrders, filterStatus]);

  const handleAdvance = async (order: Order) => {
    if (!ADVANCE_LABEL[order.status]) return;
    const confirmMsg =
      order.status === "processing"
        ? `Order ${order.orderId} ကို 'Sent' အဖြစ် မှတ်သားမည်လား? Buyer သတိပေးချက် ရရှိမည်။`
        : `Order ${order.orderId} ကို 'Processing' ပြောင်းမည်လား?`;
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(order.id);
    try {
      const res = await fetch(`/api/seller/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || "Failed."); return; }
      await loadOrders(filterStatus || undefined);
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (order: Order) => {
    if (!window.confirm(`Order ${order.orderId} ကို Cancel လုပ်မည်လား?`)) return;
    setActionLoading(order.id);
    try {
      const res = await fetch(`/api/seller/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || "Failed."); return; }
      await loadOrders(filterStatus || undefined);
    } catch {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Orders</h2>
        <p className="text-sm text-slate-500">ဝယ်သူများထံမှ ဝင်လာသော အော်ဒါများ</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilterStatus(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filterStatus === opt.value
                ? "bg-emerald-600 text-white"
                : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
        {loading ? (
          <div className="px-6 py-10 text-center text-slate-500">Loading...</div>
        ) : error ? (
          <div className="px-6 py-10 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-800/80">
                  <th className="px-4 py-3 font-medium text-slate-400">Order ID</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Product</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Buyer</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Price</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Date</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      Order မရှိသေးပါ
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {o.orderId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200 max-w-[160px] truncate">
                        {o.productTitle}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-[140px] truncate">
                        {o.buyerName || o.buyerEmail}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-medium">
                        {o.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLE[o.status] ?? "bg-slate-600/50 text-slate-400"
                          }`}
                        >
                          {STATUS_MM[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => setDetailOrder(o)}
                            className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
                          >
                            Detail
                          </button>
                          {/* Advance Status */}
                          {ADVANCE_LABEL[o.status] && (
                            <button
                              type="button"
                              onClick={() => handleAdvance(o)}
                              disabled={actionLoading === o.id}
                              className="rounded-md bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1 text-xs text-emerald-400 transition hover:bg-emerald-600/30 disabled:opacity-60"
                            >
                              {actionLoading === o.id ? "..." : ADVANCE_LABEL[o.status]}
                            </button>
                          )}
                          {/* Cancel */}
                          {o.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleCancel(o)}
                              disabled={actionLoading === o.id}
                              className="rounded-md bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-500/20 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-slate-500">{detailOrder.orderId}</p>
                <h3 className="font-semibold text-slate-100 mt-0.5">
                  {detailOrder.productTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="shrink-0 rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Buyer</span>
                <span className="text-slate-300">
                  {detailOrder.buyerName || detailOrder.buyerEmail}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Price</span>
                <span className="font-medium text-emerald-400">
                  {detailOrder.price.toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLE[detailOrder.status] ?? "bg-slate-600/50 text-slate-400"
                  }`}
                >
                  {STATUS_MM[detailOrder.status] ?? detailOrder.status}
                </span>
              </div>
              {detailOrder.sentAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sent At</span>
                  <span className="text-slate-400">
                    {new Date(detailOrder.sentAt).toLocaleString()}
                  </span>
                </div>
              )}

              {detailOrder.buyerInputData.length > 0 && (
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Buyer Provided Information
                  </p>
                  <div className="space-y-2">
                    {detailOrder.buyerInputData.map((d) => (
                      <div key={d.label} className="flex justify-between gap-4">
                        <span className="text-sm text-slate-500">{d.label}</span>
                        <span className="font-mono font-semibold text-slate-100 text-sm">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailOrder.buyerInputData.length === 0 && (
                <p className="rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-500">
                  Buyer input data မရှိပါ
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              {ADVANCE_LABEL[detailOrder.status] && (
                <button
                  type="button"
                  onClick={() => { handleAdvance(detailOrder); setDetailOrder(null); }}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {ADVANCE_LABEL[detailOrder.status]}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="flex-1 rounded-xl border border-slate-600 py-2.5 text-sm text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
