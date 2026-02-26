/** Seller Overview: own sales, profit, withdrawable balance. Dummy data only. */

const DUMMY_STATS = [
  { label: "My Sales", value: "1,250,000", sub: "MMK", icon: "📈" },
  { label: "Profit", value: "1,180,000", sub: "MMK", icon: "✨" },
  { label: "Withdrawable Balance", value: "320,000", sub: "MMK", icon: "💰" },
];

export default function SellerOverviewPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}
