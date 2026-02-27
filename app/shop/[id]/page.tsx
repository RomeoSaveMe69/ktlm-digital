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

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params?.id as string;
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    fetch(`/api/seller/profile/${sellerId}`)
      .then((r) => r.json())
      .then((d) => { if (d.seller) setProfile(d.seller); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <p>Seller not found.</p>
        <Link href="/" className="text-emerald-400 hover:underline">← Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
          <h1 className="text-lg font-bold text-slate-100">Seller Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-8">
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-2xl font-bold text-emerald-400">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-100">{profile.name}</h2>
          <p className="text-sm text-slate-500">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/40">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{profile.totalProducts}</p>
              <p className="text-xs text-slate-500">Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{profile.totalSold}</p>
              <p className="text-xs text-slate-500">Total Sold</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("open-chat", { detail: { sellerId: profile.id, sellerName: profile.name } }),
              );
            }}
            className="mt-4 w-full rounded-xl border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-400 transition hover:bg-violet-500/20"
          >
            Chat with Seller
          </button>
        </div>
      </main>
    </div>
  );
}
