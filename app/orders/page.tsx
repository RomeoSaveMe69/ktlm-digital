"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OrderInputData = { label: string; value: string };
type Order = {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  gameTitle: string;
  price: number;
  feeAmount: number;
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
  return <span className="text-xs text-amber-400">⏱ Auto-complete in {h}h {m}m</span>;
}

function ReviewModal({
  order,
  onClose,
}: {
  order: { id: string; orderId: string; productTitle: string };
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const handleSubmit = async () => {
    if (!comment.trim()) { alert("Please write a review comment."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, rating, text: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to submit review."); return; }
      onClose();
    } catch { alert("Network error."); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Leave a Review</h3>
          <p className="text-sm text-slate-400 mt-1">
            Order <span className="font-mono text-slate-300">{order.orderId}</span> — {order.productTitle}
          </p>
        </div>

        {/* Star Rating */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                className={`text-2xl transition ${
                  star <= (hoverStar || rating) ? "text-amber-400" : "text-slate-600"
                } hover:scale-110`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 self-center text-sm text-slate-400">{rating}/5</span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Comment</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

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

  const handleConfirm = async (order: Order) => {
    if (!window.confirm("Order ရောက်ကြောင်း Confirm ပြုလုပ်မည်လား? Seller ထံ ငွေပေးချေမည်။")) return;
    setConfirmingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.error || "Confirm failed."); return; }
      setReviewOrder(order);
      await loadOrders();
    } catch {
      alert("Network error.");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
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
            <Link href="/" className="mt-3 inline-block text-sm text-emerald-400 hover:underline">Products ကြည့်ရန် →</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">{order.orderId}</p>
                  <p className="font-semibold text-slate-200">{order.productTitle}</p>
                  {order.gameTitle && <p className="text-xs text-slate-500">{order.gameTitle}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{order.price.toLocaleString()} MMK</p>
                  <p className="text-xs text-slate-500">Fee: {(order.feeAmount ?? 0).toLocaleString()} MMK</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status] ?? "bg-slate-600/50 text-slate-400"}`}>
                  {STATUS_MM[order.status] ?? order.status}
                </span>
                {order.status === "sent" && order.sentAt && <RemainingTime sentAt={order.sentAt} />}
                {order.completedAt && (
                  <span className="text-xs text-slate-500">Completed: {new Date(order.completedAt).toLocaleDateString()}</span>
                )}
              </div>

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

              <p className="text-xs text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>

              {order.status === "sent" && (
                <button
                  type="button"
                  onClick={() => handleConfirm(order)}
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

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
        />
      )}
    </div>
  );
}
