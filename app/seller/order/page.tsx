"use client";

import { useCallback, useEffect, useState } from "react";

type Order = {
  id: string;
  orderId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  price: number;
  buyerInputData: { label: string; value: string }[];
  status: string;
  sentAt: string | null;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  processing: "bg-blue-500/20 text-blue-400",
  sent: "bg-violet-500/20 text-violet-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function SellerOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/seller/orders";
      if (statusFilter) url += `?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setOrders(data.orders ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAction = async (orderId: string, action: "advance" | "cancel") => {
    if (action === "cancel" && !confirm("Cancel this order? Buyer will be refunded.")) return;
    setActionId(orderId);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Action failed"); return; }
      fetchOrders();
    } catch { alert("Network error"); } finally { setActionId(null); }
  };

  const openChat = (buyerId: string, buyerName: string) => {
    window.dispatchEvent(
      new CustomEvent("open-chat", { detail: { sellerId: buyerId, sellerName: buyerName } }),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Orders</h2>
        <p className="text-sm text-slate-500">Manage incoming orders from buyers</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {["", "pending", "processing", "sent", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === s
                ? "bg-emerald-600 text-white"
                : "border border-slate-600 text-slate-400 hover:bg-slate-800"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">{o.orderId}</p>
                  <p className="font-medium text-slate-200">{o.productTitle}</p>
                  <p className="text-xs text-slate-500">Buyer: {o.buyerName || o.buyerEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-emerald-400">{o.price.toLocaleString()} MMK</p>
                  {/* Chat with buyer */}
                  {o.buyerId && (
                    <button
                      type="button"
                      onClick={() => openChat(o.buyerId, o.buyerName || o.buyerEmail)}
                      title="Chat with Buyer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 transition hover:bg-violet-500/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status] ?? "bg-slate-600/50 text-slate-400"}`}>
                  {o.status}
                </span>
                <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</span>
              </div>

              {o.buyerInputData.length > 0 && (
                <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2 space-y-0.5">
                  {o.buyerInputData.map((d) => (
                    <div key={d.label} className="flex justify-between text-xs">
                      <span className="text-slate-500">{d.label}</span>
                      <span className="font-mono text-slate-300">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {(o.status === "pending" || o.status === "processing") && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(o.id, "advance")}
                    disabled={actionId === o.id}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {actionId === o.id ? "..." : o.status === "pending" ? "Accept (Processing)" : "Mark as Sent"}
                  </button>
                  {o.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleAction(o.id, "cancel")}
                      disabled={actionId === o.id}
                      className="rounded-lg border border-red-500/40 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
