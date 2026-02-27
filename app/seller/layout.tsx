import Link from "next/link";

/** Sidebar menu for seller panel. UI shell: auth not enforced. */
const SIDEBAR_NAV = [
  { href: "/seller", label: "Overview", icon: "📊" },
  { href: "/seller/order", label: "Order", icon: "📦" },
  { href: "/seller/wallet", label: "Wallet", icon: "💳" },
  { href: "/seller/chat", label: "Chat", icon: "💬" },
  { href: "/seller/product", label: "Product", icon: "🛒" },
  { href: "/seller/product-info", label: "Product Info", icon: "📄" },
  { href: "/seller/price", label: "Price", icon: "💰" },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // UI shell: auth re-enabled when backend connected
  // await requireSeller();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900/80 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <Link href="/seller" className="block">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
              KTLM Digital
            </span>
            <span className="ml-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Seller
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto" aria-label="Seller sections">
          <ul className="space-y-0.5">
            {SIDEBAR_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
                >
                  <span className="text-base" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-slate-800 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          >
            ← Back to site
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-100">Seller Dashboard</h1>
          <p className="text-sm text-slate-500">Kone The Lay Myar Digital — Seller Panel</p>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
