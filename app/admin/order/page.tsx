/** Admin Order: all website orders. Dummy data only. */

const DUMMY_ORDERS = [
  { id: "ORD-A1B2C3", amount: "4,500", status: "completed", buyer: "user1@mail.com", createdAt: "2025-02-25 14:30" },
  { id: "ORD-D4E5F6", amount: "12,000", status: "pending", buyer: "user2@mail.com", createdAt: "2025-02-26 09:15" },
  { id: "ORD-G7H8I9", amount: "6,200", status: "processing", buyer: "user3@mail.com", createdAt: "2025-02-26 10:00" },
  { id: "ORD-J0K1L2", amount: "8,800", status: "disputed", buyer: "user4@mail.com", createdAt: "2025-02-24 16:45" },
  { id: "ORD-M3N4O5", amount: "3,100", status: "completed", buyer: "user5@mail.com", createdAt: "2025-02-23 11:20" },
];

const statusClass: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-amber-500/20 text-amber-400",
  processing: "bg-blue-500/20 text-blue-400",
  disputed: "bg-red-500/20 text-red-400",
};

export default function AdminOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Order</h2>
        <p className="text-sm text-slate-500">Website တစ်ခုလုံးရှိ အော်ဒါအားလုံး</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Order ID</th>
                <th className="px-4 py-3 font-medium text-slate-400">Amount (MMK)</th>
                <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 font-medium text-slate-400">Buyer</th>
                <th className="px-4 py-3 font-medium text-slate-400">Created</th>
                <th className="px-4 py-3 font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_ORDERS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-mono text-slate-300">{row.id}</td>
                  <td className="px-4 py-3 text-slate-200">{row.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusClass[row.status] ?? "bg-slate-600/50 text-slate-400"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.buyer}</td>
                  <td className="px-4 py-3 text-slate-500">{row.createdAt}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-emerald-400 hover:text-emerald-300">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
