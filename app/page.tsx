import Link from "next/link";

// Quick category items (game top-ups)
const CATEGORIES = [
  { id: "mlbb", name: "MLBB", icon: "🎮", slug: "/category/mlbb" },
  { id: "pubg", name: "PUBG", icon: "🔫", slug: "/category/pubg" },
  { id: "freefire", name: "Free Fire", icon: "🔥", slug: "/category/freefire" },
  { id: "genshin", name: "Genshin", icon: "⚔️", slug: "/category/genshin" },
  { id: "codm", name: "CODM", icon: "🎯", slug: "/category/codm" },
  { id: "more", name: "More", icon: "⋯", slug: "/categories" },
];

// Mock flash sales (replace with real data later)
const FLASH_SALES = [
  { id: "1", game: "MLBB", product: "100 Diamonds", price: 2500, originalPrice: 3000, discount: "17%", endsIn: "2h 15m" },
  { id: "2", game: "PUBG", product: "60 UC", price: 1800, originalPrice: 2200, discount: "18%", endsIn: "5h 42m" },
  { id: "3", game: "Free Fire", product: "50 Diamonds", price: 1200, originalPrice: 1500, discount: "20%", endsIn: "1h 08m" },
  { id: "4", game: "Genshin", product: "330 Genesis", price: 8500, originalPrice: 10000, discount: "15%", endsIn: "8h 00m" },
];

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 safe-area-pb">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Kone The Lay Myar
            </span>
            <span className="text-slate-400 font-normal text-sm ml-1">Digital</span>
          </h1>
          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/50 transition hover:bg-emerald-500/30 hover:ring-emerald-400/60"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="px-4 pt-4">
        {/* Search bar */}
        <div className="mb-5">
          <label htmlFor="search" className="sr-only">
            Search products or games
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden>
              🔍
            </span>
            <input
              id="search"
              type="search"
              placeholder="Search games, diamonds, UC..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Quick Categories */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Quick Categories
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={cat.slug}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 py-4 transition hover:border-emerald-500/40 hover:bg-slate-800 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] active:scale-[0.98]"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-slate-300">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Live Flash Sales */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Live Flash Sales
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              Live
            </span>
          </div>
          <div className="space-y-3">
            {FLASH_SALES.map((sale) => (
              <Link
                key={sale.id}
                href={`/product/${sale.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-3 transition hover:border-purple-500/40 hover:bg-slate-800/80 hover:shadow-[0_0_24px_-6px_rgba(168,85,247,0.25)] active:scale-[0.99]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-700/80 text-xl">
                  🎮
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-200">{sale.product}</p>
                  <p className="text-xs text-slate-500">{sale.game}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-emerald-400">
                    {sale.price.toLocaleString()} MMK
                  </p>
                  <p className="text-xs text-slate-500 line-through">
                    {sale.originalPrice.toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="rounded-md bg-purple-500/25 px-2 py-0.5 text-xs font-medium text-purple-300">
                    -{sale.discount}
                  </span>
                  <p className="mt-1 text-[10px] text-slate-500">Ends {sale.endsIn}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 text-center">
          <p className="text-sm text-slate-400">
            Secure escrow • Telegram notifications • 0.5% platform fee
          </p>
          <Link
            href="/categories"
            className="mt-3 inline-block rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500"
          >
            Browse all categories
          </Link>
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md safe-area-bottom"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-2 text-xs font-medium transition ${
                item.href === "/"
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
