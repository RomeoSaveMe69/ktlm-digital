import Link from "next/link";
import { DepositApprovals } from "./_components/DepositApprovals";

// Mock stats (replace with Supabase queries)
const STATS = [
  { label: "Total Users", value: "1,247", sub: "profiles", icon: "👥", color: "emerald" },
  { label: "Pending Orders", value: "23", sub: "processing", icon: "📦", color: "amber" },
  { label: "Revenue (MMK)", value: "2,450,000", sub: "platform fees", icon: "💰", color: "purple" },
];

// Mock pending deposits (type = 'deposit', status = 'pending')
const MOCK_PENDING_DEPOSITS = [
  { id: "tx-1", userId: "user-a", amount: 50000, currency: "MMK", referenceId: "REF-2024-001", createdAt: "2024-02-25 10:30", slip_image_url: null },
  { id: "tx-2", userId: "user-b", amount: 25000, currency: "MMK", referenceId: "REF-2024-002", createdAt: "2024-02-25 11:15", slip_image_url: null },
];

// Mock active orders
const MOCK_ORDERS = [
  { id: "ord-1", buyerId: "user-a", sellerId: "seller-1", amount_mmk: 3500, status: "processing", created_at: "2024-02-25 09:00" },
  { id: "ord-2", buyerId: "user-b", sellerId: "seller-1", amount_mmk: 8500, status: "pending", created_at: "2024-02-25 10:20" },
  { id: "ord-3", buyerId: "user-c", sellerId: "seller-2", amount_mmk: 1200, status: "processing", created_at: "2024-02-25 11:45" },
];

// Mock chat rooms (for admin to supervise)
const MOCK_CHAT_ROOMS = [
  { id: "room-1", order_id: "ord-1", buyer_id: "user-a", seller_id: "seller-1", created_at: "2024-02-25 09:01" },
  { id: "room-2", order_id: "ord-3", buyer_id: "user-c", seller_id: "seller-2", created_at: "2024-02-25 11:46" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      {/* Dashboard Overview */}
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
                  <p className="mt-1 text-2xl font-bold text-slate-100">
                    {stat.value}
                  </p>
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

      {/* Deposit Approvals */}
      <section id="deposits" className="scroll-mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Deposit Approvals
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Transactions where type is &quot;deposit&quot; and status is &quot;pending&quot;. Approve or reject slip uploads.
        </p>
        <DepositApprovals deposits={MOCK_PENDING_DEPOSITS} />
      </section>

      {/* Order Management */}
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
                {MOCK_ORDERS.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-3 font-mono text-slate-300">{order.id}</td>
                    <td className="px-4 py-3 text-slate-200">
                      {order.amount_mmk.toLocaleString()}
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
                    <td className="px-4 py-3 text-slate-500">{order.created_at}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Chat Monitoring */}
      <section id="chat" className="scroll-mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Chat Monitoring
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          All chat rooms. Admins can read all messages for dispute resolution.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-800/80">
                  <th className="px-4 py-3 font-medium text-slate-400">Room ID</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Order ID</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Created</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CHAT_ROOMS.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-3 font-mono text-slate-300">{room.id}</td>
                    <td className="px-4 py-3 text-slate-300">{room.order_id}</td>
                    <td className="px-4 py-3 text-slate-500">{room.created_at}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/chat/${room.id}`}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        View messages
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
