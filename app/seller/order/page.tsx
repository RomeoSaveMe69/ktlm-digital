/** Seller Order: orders from buyers. Dummy data only. */

const DUMMY_ORDERS = [
  { id: "ORD-X1", product: "60 UC", amount: "4,500", status: "pending", buyer: "user1@mail.com", time: "2025-02-26 09:15" },
  { id: "ORD-X2", product: "325 UC", amount: "12,000", status: "processing", buyer: "user2@mail.com", time: "2025-02-26 10:00" },
];

const statusClass: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-amber-500/20 text-amber-400",
  processing: "bg-blue-500/20 text-blue-400",
};

export default function SellerOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Order</h2>
        <p className="text-sm text-slate-500">ဝယ်သူများထံမှ ဝင်လာမည့် အော်ဒါများ</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Order ID</th>
                <th className="px-4 py-3 font-medium text-slate-400">Product</th>
                <th className="px-4 py-3 font-medium text-slate-400">Amount (MMK)</th>
                <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 font-medium text-slate-400">Buyer</th>
                <th className="px-4 py-3 font-medium text-slate-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_ORDERS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-mono text-slate-300">{row.id}</td>
                  <td className="px-4 py-3 text-slate-200">{row.product}</td>
                  <td className="px-4 py-3 text-slate-200">{row.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusClass[row.status] ?? "bg-slate-600/50 text-slate-400"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.buyer}</td>
                  <td className="px-4 py-3 text-slate-500">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
