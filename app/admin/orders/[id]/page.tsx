import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { AdminOrderActions } from "./AdminOrderActions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();
  await connectDB();
  const order = await Order.findById(id)
    .populate("productId", "title price")
    .populate("buyerId", "email fullName")
    .populate("sellerId", "email fullName")
    .lean();
  if (!order) notFound();

  const product = order.productId as { title?: string; price?: number } | null;
  const buyer = order.buyerId as { email?: string; fullName?: string } | null;
  const seller = order.sellerId as { email?: string; fullName?: string } | null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin#orders"
        className="text-sm text-slate-400 hover:text-slate-200"
      >
        ← Back to orders
      </Link>
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Order {order._id.toString().slice(-8)}
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-200 capitalize">
              {order.status}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Amount (MMK)</dt>
            <dd className="font-medium text-slate-200">
              {order.amountMmk.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Platform fee (MMK)</dt>
            <dd className="font-medium text-slate-200">
              {order.platformFeeMmk.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Product</dt>
            <dd className="font-medium text-slate-200">
              {product?.title ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Player ID</dt>
            <dd className="font-mono text-slate-300">{order.playerId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Buyer</dt>
            <dd className="text-slate-300">{buyer?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Seller</dt>
            <dd className="text-slate-300">{seller?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-400">
              {order.createdAt instanceof Date
                ? order.createdAt.toISOString()
                : String(order.createdAt)}
            </dd>
          </div>
        </dl>
        <div className="mt-6">
          <AdminOrderActions orderId={id} currentStatus={order.status} />
        </div>
      </section>
    </div>
  );
}
