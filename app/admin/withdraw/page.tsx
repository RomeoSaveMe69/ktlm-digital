/** Admin Withdraw: approve seller withdrawal requests. UI shell only. */

const DUMMY_WITHDRAWS = [
  { id: "W1", seller: "seller1@mail.com", amount: "150,000", time: "2025-02-26 10:00" },
  { id: "W2", seller: "seller2@mail.com", amount: "80,000", time: "2025-02-26 11:30" },
];

export default function AdminWithdrawPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Withdraw</h2>
        <p className="text-sm text-slate-500">Seller များ ငွေထုတ်ယူမှုကို လက်ခံပေးရန်</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Seller</th>
                <th className="px-4 py-3 font-medium text-slate-400">Amount (MMK)</th>
                <th className="px-4 py-3 font-medium text-slate-400">Requested</th>
                <th className="px-4 py-3 font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_WITHDRAWS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 text-slate-300">{row.seller}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">{row.amount}</td>
                  <td className="px-4 py-3 text-slate-500">{row.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="text-red-400 hover:text-red-300"
                      >
                        Reject
                      </button>
                    </div>
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
