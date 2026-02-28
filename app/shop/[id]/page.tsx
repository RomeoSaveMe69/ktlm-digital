"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SellerProfile = {
  id: string;
  name: string;
  createdAt: string;
  totalProducts: number;
  totalSold: number;
};

type ProductItem = {
  id: string;
  customTitle: string;
  gameId: string;
  gameTitle: string;
  categoryTitle: string;
  price: number;
  inStock: number;
  totalSold: number;
  deliveryTime: string;
};

type GameOption = { id: string; title: string };

type ReviewItem = {
  id: string;
  buyerName: string;
  productTitle: string;
  rating: number;
  text: string;
  reply: string | null;
  createdAt: string;
};

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params?.id as string;
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState("");

  useEffect(() => {
    if (!sellerId) return;
    fetch(`/api/seller/profile/${sellerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.seller) setProfile(d.seller);
        if (d.products) setProducts(d.products);
        if (d.games) setGames(d.games);
        if (d.reviews) setReviews(d.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  const filteredProducts = selectedGame
    ? products.filter((p) => p.gameId === selectedGame)
    : products;

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>Seller not found.</p>
        <Link href="/" className="text-emerald-400 hover:underline">
          ← Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            ← Home
          </Link>
          <h1 className="text-lg font-bold text-slate-100">Seller Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8 space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-2xl font-bold text-emerald-400">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-100">{profile.name}</h2>
          <p className="text-sm text-slate-500">
            Member since {new Date(profile.createdAt).toLocaleDateString()}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/40">
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {profile.totalProducts}
              </p>
              <p className="text-xs text-slate-500">Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {profile.totalSold}
              </p>
              <p className="text-xs text-slate-500">Total Sold</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("open-chat", {
                  detail: {
                    sellerId: profile.id,
                    sellerName: profile.name,
                  },
                }),
              );
            }}
            className="mt-4 w-full rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-400 transition hover:bg-violet-500/20"
          >
            Chat with Seller
          </button>
        </div>

        {/* Products with Game Filter */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50">
          <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Products ({filteredProducts.length})
            </h3>
            {games.length > 1 && (
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Games</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          {filteredProducts.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No products found.</p>
          ) : (
            <div className="divide-y divide-slate-700/40">
              {filteredProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="flex items-center justify-between px-5 py-4 transition hover:bg-slate-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-200 truncate">
                      {p.customTitle}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.gameTitle} · {p.categoryTitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right ml-4">
                    <p className="font-semibold text-emerald-400">
                      {p.price.toLocaleString()} MMK
                    </p>
                    <p className="text-xs text-slate-500">
                      Stock: {p.inStock}
                      {p.totalSold > 0 && (
                        <span className="ml-2 text-amber-400">
                          {p.totalSold} sold
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Seller Reviews */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50">
          <h3 className="border-b border-slate-700/80 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Reviews ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No reviews yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-700/40">
              {reviews.map((r) => (
                <div key={r.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                        {r.buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-200">
                          {r.buyerName}
                        </span>
                        <span className="ml-2 text-amber-400 text-xs">
                          {stars(r.rating)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      {r.productTitle}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 pl-9">{r.text}</p>
                  {r.reply && (
                    <div className="ml-9 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <p className="text-xs text-emerald-400 mb-0.5">
                        Seller Reply
                      </p>
                      <p className="text-sm text-slate-300">{r.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
