"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type GameInfo = { id: string; title: string; image: string; description: string };
type Category = { id: string; title: string };
type ProductItem = {
  id: string;
  customTitle: string;
  categoryTitle: string;
  sellerId: string;
  sellerName: string;
  price: number;
  inStock: number;
  totalSold: number;
  deliveryTime: string;
};

export default function GamePage() {
  const params = useParams();
  const gameId = params?.id as string;

  const [game, setGame] = useState<GameInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prodLoading, setProdLoading] = useState(false);
  const [sort, setSort] = useState("price_asc");

  useEffect(() => {
    if (!gameId) return;
    (async () => {
      try {
        const res = await fetch(`/api/games/${gameId}`);
        const data = await res.json();
        if (res.ok) {
          setGame(data.game);
          setCategories(data.categories ?? []);
          if (data.categories?.length > 0) {
            setSelectedCategory(data.categories[0].id);
          }
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [gameId]);

  const fetchProducts = useCallback(async () => {
    if (!gameId) return;
    setProdLoading(true);
    try {
      let url = `/api/products?gameId=${gameId}&sort=${sort}`;
      if (selectedCategory) url += `&categoryId=${selectedCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setProducts(data.products ?? []);
    } catch { /* ignore */ } finally { setProdLoading(false); }
  }, [gameId, selectedCategory, sort]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleChat = (sellerId: string, sellerName: string) => {
    window.dispatchEvent(
      new CustomEvent("open-chat", { detail: { sellerId, sellerName } }),
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }
  if (!game) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>Game not found.</p>
        <Link href="/" className="text-emerald-400 hover:underline">← Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
          <h1 className="flex-1 truncate text-sm font-semibold text-slate-200">{game.title}</h1>
        </div>
      </header>

      {/* Game Banner */}
      <div className="relative border-b border-slate-800/60 bg-gradient-to-b from-slate-800/50 to-slate-950">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          {game.image ? (
            <img
              src={game.image}
              alt={game.title}
              className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
              style={{ maxHeight: "80px" }}
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-3xl sm:h-20 sm:w-20">
              🎮
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-100 sm:text-2xl">{game.title}</h2>
            {game.description && (
              <p className="mt-1 text-sm text-slate-400 line-clamp-2">{game.description}</p>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pt-5 space-y-5">
        {/* Category Dropdown + Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="cat-select" className="text-xs text-slate-500 shrink-0">Category:</label>
              <select
                id="cat-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-slate-500 shrink-0">Sort:</label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="price_asc">Price: Low → High</option>
              <option value="sold_desc">Highest Sold</option>
            </select>
          </div>
        </div>

        {/* Product Cards */}
        {prodLoading ? (
          <div className="py-8 text-center text-slate-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
            No products available in this category.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4 transition hover:border-emerald-500/30 hover:bg-slate-800/80"
              >
                <Link href={`/product/${p.id}`} className="block">
                  <p className="font-medium text-slate-200">{p.customTitle}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.categoryTitle} · {p.deliveryTime}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-400">
                      {p.price.toLocaleString()} <span className="text-xs text-slate-400">MMK</span>
                    </span>
                    <span className="rounded bg-slate-700/80 px-2 py-0.5 text-xs text-slate-400">
                      Stock: {p.inStock}
                    </span>
                  </div>
                </Link>

                {/* Seller info + action icons */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-700/40 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                    <span className="truncate">Seller: <span className="text-slate-300">{p.sellerName}</span></span>
                    {p.totalSold > 0 && (
                      <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-400">
                        {p.totalSold} sold
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Chat icon */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleChat(p.sellerId, p.sellerName); }}
                      title="Chat with Seller"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-violet-400 transition hover:bg-violet-500/20 hover:text-violet-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    {/* Profile icon */}
                    <Link
                      href={`/shop/${p.sellerId}`}
                      title="View Seller Profile"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-sky-400 transition hover:bg-sky-500/20 hover:text-sky-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
