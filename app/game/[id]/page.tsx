"use client";

/**
 * Game Page: shows all active products for a game.
 * Features:
 *   - Category filter bar (fetched from DB)
 *   - Sort: Lowest Price / Highest Sold
 *   - Product cards linking to /product/[id]
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Category = { id: string; title: string };
type Product = {
  id: string;
  customTitle: string;
  gameTitle: string;
  categoryId: string;
  categoryTitle: string;
  sellerName: string;
  price: number;
  inStock: number;
  deliveryTime: string;
  totalSold: number;
};

type SortOption = "price_asc" | "sold_desc";

export default function GamePage() {
  const params = useParams();
  const gameId = params?.id as string;

  const [gameTitle, setGameTitle] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [sort, setSort] = useState<SortOption>("price_asc");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!gameId) return;
    try {
      const [gRes, cRes] = await Promise.all([
        fetch("/api/games"),
        fetch(`/api/categories?gameId=${gameId}`),
      ]);
      const gData = await gRes.json().catch(() => ({}));
      const cData = await cRes.json().catch(() => ({}));
      const found = (gData.games ?? []).find(
        (g: { id: string; title: string }) => g.id === gameId,
      );
      if (found) setGameTitle(found.title);
      setCategories(cData.categories ?? []);
    } catch {
      /* ignore */
    }
  }, [gameId]);

  const loadProducts = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ gameId, sort });
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json().catch(() => ({}));
      setProducts(data.products ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [gameId, selectedCategoryId, sort]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCategorySelect = (id: string) => {
    setSelectedCategoryId((prev) => (prev === id ? "" : id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">
            ← Back
          </Link>
          <h1 className="text-lg font-bold">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              {gameTitle || "Game"}
            </span>
          </h1>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* Category Filter Bar */}
        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  selectedCategoryId === ""
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-slate-200"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategorySelect(c.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    selectedCategoryId === c.id
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-slate-200"
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            {loading ? "Loading..." : `${products.length} listings`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSort("price_asc")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                sort === "price_asc"
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              💰 Lowest Price
            </button>
            <button
              type="button"
              onClick={() => setSort("sold_desc")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                sort === "sold_desc"
                  ? "border-violet-500 bg-violet-500/20 text-violet-400"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              🔥 Highest Sold
            </button>
          </div>
        </div>

        {/* Product List */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 animate-pulse rounded-xl border border-slate-700/40 bg-slate-800/50"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
            Product မရှိသေးပါ
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="flex flex-col rounded-xl border border-slate-700/60 bg-slate-800/60 p-4 transition hover:border-emerald-500/40 hover:bg-slate-800/80 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-200 truncate">
                      {p.customTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.categoryTitle} · {p.sellerName}
                    </p>
                  </div>
                  {p.inStock > 0 ? (
                    <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      In Stock
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                      Out
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-emerald-400">
                    {p.price.toLocaleString()} MMK
                  </span>
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span>⚡ {p.deliveryTime}</span>
                    {p.totalSold > 0 && <span>🔥 {p.totalSold} sold</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
