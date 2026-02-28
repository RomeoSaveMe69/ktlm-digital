"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Order = {
  id: string;
  orderId: string;
  productTitle: string;
  gameTitle: string;
  price: number;
  status: string;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  processing: "bg-blue-500/20 text-blue-400",
  sent: "bg-violet-500/20 text-violet-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) return;
      const data = await res.json();
      setOrders((data.orders ?? []).slice(0, 5));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        Loading orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No orders yet.{" "}
        <Link href="/" className="text-emerald-400 hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-900/50 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {order.productTitle}
            </p>
            <p className="text-xs text-slate-500">
              {order.orderId} · {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3 pl-3">
            <span className="text-sm font-semibold text-emerald-400">
              {order.price.toLocaleString()} MMK
            </span>
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status] ?? "bg-slate-600/50 text-slate-400"}`}
            >
              {order.status}
            </span>
          </div>
        </div>
      ))}
      <Link
        href="/orders"
        className="block text-center text-sm text-emerald-400 hover:underline pt-2"
      >
        View all orders →
      </Link>
    </div>
  );
}
