/** Admin Seller: seller list with sales & balance. Dummy data only. */

const DUMMY_SELLERS = [
  { id: "S1", name: "Seller One", email: "seller1@mail.com", sales: "1,250,000", balance: "320,000" },
  { id: "S2", name: "Seller Two", email: "seller2@mail.com", sales: "890,000", balance: "180,500" },
  { id: "S3", name: "Seller Three", email: "seller3@mail.com", sales: "2,100,000", balance: "510,000" },
];

export default function AdminSellerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Seller</h2>
        <p className="text-sm text-slate-500">Seller စာရင်း၊ Sales နှင့် Balance</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="px-4 py-3 font-medium text-slate-400">Email</th>
                <th className="px-4 py-3 font-medium text-slate-400">Sales (MMK)</th>
                <th className="px-4 py-3 font-medium text-slate-400">Balance (MMK)</th>
                <th className="px-4 py-3 font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_SELLERS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{row.name}</td>
                  <td className="px-4 py-3 text-slate-400">{row.email}</td>
                  <td className="px-4 py-3 text-emerald-400">{row.sales}</td>
                  <td className="px-4 py-3 text-slate-200">{row.balance}</td>
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
