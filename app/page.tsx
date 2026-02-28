import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { Game } from "@/lib/models/Game";
import { Cart } from "@/lib/models/Cart";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  let userBalance: number | null = null;
  let cartCount = 0;

  let games: Array<{ id: string; title: string; image: string }> = [];
  let recentProducts: Array<{
    id: string;
    title: string;
    price: number;
    inStock: number;
    gameId: string;
    gameTitle: string;
    sellerName: string;
    totalSold: number;
  }> = [];
  try {
    await connectDB();

    if (session?.userId) {
      const userData = await User.findById(session.userId)
        .select("balance")
        .lean();
      userBalance = userData?.balance ?? 0;
      cartCount = await Cart.countDocuments({ userId: session.userId });
    }

    let dbGames = await Game.find().sort({ title: 1 }).lean();
    if (dbGames.length === 0) {
      const defaults = [
        { title: "MLBB", image: "", description: "Mobile Legends: Bang Bang" },
        { title: "PUBG", image: "", description: "PUBG Mobile" },
        { title: "Free Fire", image: "", description: "Garena Free Fire" },
        { title: "Genshin Impact", image: "", description: "Genshin Impact" },
        { title: "CODM", image: "", description: "Call of Duty Mobile" },
      ];
      await Game.insertMany(defaults);
      dbGames = await Game.find().sort({ title: 1 }).lean();
    }
    games = dbGames.map((g) => ({
      id: g._id.toString(),
      title: g.title,
      image: g.image ?? "",
    }));

    const products = await Product.find({ status: "active", isActive: { $ne: false } })
      .populate("gameId", "title")
      .populate("sellerId", "fullName email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    recentProducts = products.map((p) => ({
      id: p._id.toString(),
      title: p.customTitle || p.title,
      price: p.price,
      inStock: p.inStock,
      gameId: (p.gameId as { _id?: { toString(): string } })?._id?.toString?.() ?? "",
      gameTitle: (p.gameId as { title?: string })?.title ?? "—",
      sellerName:
        (p.sellerId as { fullName?: string })?.fullName ||
        (p.sellerId as { email?: string })?.email ||
        "Seller",
      totalSold: p.totalSold ?? 0,
    }));
  } catch (e) {
    console.error("Home page load error:", e);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 safe-area-pb">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Kone The Lay Myar
            </span>
            <span className="ml-1 text-sm font-normal text-slate-400">
              Digital
            </span>
          </h1>

          {session ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5">
                <span className="text-xs font-semibold text-emerald-400">
                  {(userBalance ?? 0).toLocaleString()} MMK
                </span>
                <Link
                  href="/deposit"
                  title="Deposit / Add Funds"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold transition hover:bg-emerald-500/40 hover:text-emerald-300"
                >
                  +
                </Link>
              </div>
              {/* Cart icon with badge */}
              <Link
                href="/cart"
                title="Cart"
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/80 text-slate-300 transition hover:border-emerald-500/40 hover:text-slate-100"
              >
                🛒
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                title="Profile"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/80 text-slate-300 transition hover:border-emerald-500/40 hover:text-slate-100"
              >
                👤
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="shrink-0 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/50 transition hover:bg-emerald-500/30 hover:ring-emerald-400/60"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      <main className="px-4 pt-6">
        {/* Hero / Search */}
        <section className="mb-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-slate-100 sm:text-2xl">
            Find games & items
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Search by game name or item (diamonds, UC, top-up…)
          </p>
          <div className="mx-auto max-w-xl">
            <label htmlFor="hero-search" className="sr-only">Search games or items</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden>🔍</span>
              <input
                id="hero-search"
                type="search"
                placeholder="e.g. MLBB, 100 Diamonds, PUBG UC..."
                className="w-full rounded-2xl border border-slate-700/80 bg-slate-800/80 py-4 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
        </section>

        {/* Popular Games with images */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Popular Games
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/game/${game.id}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 py-4 transition hover:border-emerald-500/40 hover:bg-slate-800 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] active:scale-[0.98]"
              >
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700/50 text-2xl">
                    🎮
                  </span>
                )}
                <span className="text-xs font-medium text-slate-300 text-center px-1 line-clamp-1">
                  {game.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Listings */}
        <section className="mb-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Recent Listings
          </h2>
          {recentProducts.length === 0 ? (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-6 py-12 text-center text-slate-500">
              No items available currently.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex flex-col rounded-xl border border-slate-700/60 bg-slate-800/60 p-4 transition hover:border-emerald-500/40 hover:bg-slate-800/80 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)] active:scale-[0.99]"
                >
                  <p className="font-medium text-slate-200">{p.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{p.gameTitle}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-semibold text-emerald-400">
                      {p.price.toLocaleString()} MMK
                    </span>
                    <span className="rounded bg-slate-700/80 px-2 py-0.5 text-xs text-slate-400">
                      Stock: {p.inStock}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Seller: {p.sellerName}</span>
                    {p.totalSold > 0 && <span className="text-amber-400">{p.totalSold} sold</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 text-center">
          <p className="text-sm text-slate-400">
            Secure escrow · Telegram notifications · Low platform fee
          </p>
          <Link
            href="/categories"
            className="mt-3 inline-block rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500"
          >
            Browse all categories
          </Link>
        </div>
      </main>

      {/* Bottom nav handled by global BottomNav component */}
    </div>
  );
}
