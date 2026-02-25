import Link from "next/link";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { DepositApprovals } from "./_components/DepositApprovals";

export default async function AdminDashboardPage() {
  await connectDB();

  const [userCount, orders, revenueResult] = await Promise.all([
    User.countDocuments(),
    Order.find({ status: { $in: ["pending", "processing", "disputed"] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("productId", "name gameName")
      .lean(),
    Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$platformFeeMmk" } } },
    ]),
  ]);

  const pendingOrderCount = await Order.countDocuments({
    status: { $in: ["pending", "processing"] },
  });
  const revenue = revenueResult[0]?.total ?? 0;

  const STATS = [
    { label: "Total Users", value: userCount.toLocaleString(), sub: "profiles", icon: "👥" },
    { label: "Pending Orders", value: pendingOrderCount.toString(), sub: "processing", icon: "📦" },
    { label: "Revenue (MMK)", value: revenue.toLocaleString(), sub: "platform fees", icon: "💰" },
  ];

  // Deposit approvals: optional Transaction model later; for now empty list
  const pendingDeposits: Array<{
    id: string;
    userId: string;
    amount: number;
    currency: string;
    referenceId: string;
    createdAt: string;
    slip_image_url: string | null;
  }> = [];

  return (
    <div className="space-y-10">
      <section id="overview" className="scroll-mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Dashboard Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 transition hover:border-slate-600/60"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-100">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{stat.sub}</p>
                </div>
                <span className="text-2xl opacity-80" aria-hidden>
                  {stat.icon}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="deposits" className="scroll-mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Deposit Approvals
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Transactions where type is &quot;deposit&quot; and status is &quot;pending&quot;. Approve or reject slip uploads.
        </p>
        <DepositApprovals deposits={pendingDeposits} />
      </section>

      <section id="orders" className="scroll-mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Order Management
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          All active orders (pending, processing, disputed).
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-800/80">
                  <th className="px-4 py-3 font-medium text-slate-400">Order ID</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Amount (MMK)</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Created</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No active orders.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id.toString()}
                      className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {order._id.toString().slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {order.amountMmk.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            order.status === "processing"
                              ? "bg-amber-500/20 text-amber-400"
                              : order.status === "disputed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-slate-600/50 text-slate-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {order.createdAt instanceof Date
                          ? order.createdAt.toISOString().slice(0, 16)
                          : String(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="chat" className="scroll-mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Chat Monitoring
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          All chat rooms. Admins can read all messages for dispute resolution.
        </p>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-6 py-8 text-center text-slate-500">
          Chat rooms will be linked to orders. (Phase 2)
        </div>
      </section>
    </div>
  );
}
