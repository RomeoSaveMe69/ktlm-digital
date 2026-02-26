/** Admin Overview: stat cards + chart shells. Dummy data only. */

const DUMMY_STATS = [
  { label: "Total Deposit", value: "12,450,000", sub: "MMK", icon: "💰" },
  { label: "Total Sales", value: "8,320,000", sub: "MMK", icon: "📈" },
  { label: "Platform Fee (0.5%)", value: "41,600", sub: "MMK", icon: "🏛️" },
  { label: "Profit", value: "41,600", sub: "MMK", icon: "✨" },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DUMMY_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 shadow-lg transition hover:border-emerald-500/30 hover:shadow-emerald-500/5"
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

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Charts (Placeholder)
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
            <h3 className="text-sm font-medium text-slate-400">Sales Trend</h3>
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-slate-800/80 text-slate-500">
              Chart area — integrate when backend ready
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
            <h3 className="text-sm font-medium text-slate-400">Deposit vs Withdraw</h3>
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-slate-800/80 text-slate-500">
              Chart area — integrate when backend ready
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
