/** Admin Recharge: approve user deposit slips/screenshots. UI shell only. */

const DUMMY_RECHARGES = [
  { id: "R1", user: "user1@mail.com", amount: "50,000", ref: "REF-001", time: "2025-02-26 08:30" },
  { id: "R2", user: "user2@mail.com", amount: "100,000", ref: "REF-002", time: "2025-02-26 09:15" },
];

export default function AdminRechargePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Recharge</h2>
        <p className="text-sm text-slate-500">User များ ငွေသွင်းထားသည့် Screenshot / Slips စစ်ဆေး အတည်ပြုရန်</p>
      </div>
      <div className="space-y-4">
        {DUMMY_RECHARGES.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4 sm:flex-nowrap"
          >
            <div className="h-20 w-32 shrink-0 rounded-lg bg-slate-700/80 flex items-center justify-center text-slate-500 text-xs">
              Slip / Screenshot
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-slate-200">{r.user}</p>
              <p className="text-slate-400">Amount: {r.amount} MMK</p>
              <p className="text-slate-500">Ref: {r.ref} · {r.time}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {DUMMY_RECHARGES.length === 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-6 py-12 text-center text-slate-500">
          No pending recharge requests.
        </div>
      )}
    </div>
  );
}
