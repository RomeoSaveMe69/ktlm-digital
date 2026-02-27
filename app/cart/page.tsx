"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  cartId: string;
  productId: string;
  customTitle: string;
  gameTitle: string;
  categoryTitle: string;
  sellerId: string;
  sellerName: string;
  price: number;
  inStock: number;
  status: string;
  quantity: number;
  buyerInputData: { label: string; value: string }[];
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkingOut, setCheckingOut] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setSelected(new Set((data.items ?? []).map((i: CartItem) => i.cartId)));
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { loadCart(); }, [loadCart]);

  const toggleItem = (cartId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cartId)) next.delete(cartId);
      else next.add(cartId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.cartId)));
    }
  };

  const selectedTotal = items
    .filter((i) => selected.has(i.cartId))
    .reduce((sum, i) => sum + i.price, 0);

  const handleRemove = async (cartId: string) => {
    setRemoving(cartId);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      });
      setItems((prev) => prev.filter((i) => i.cartId !== cartId));
      setSelected((prev) => { const n = new Set(prev); n.delete(cartId); return n; });
    } catch { /* ignore */ } finally { setRemoving(null); }
  };

  const handleCheckout = async () => {
    const cartIds = items.filter((i) => selected.has(i.cartId)).map((i) => i.cartId);
    if (cartIds.length === 0) { alert("Please select at least one item."); return; }
    if (!confirm(`Checkout ${cartIds.length} item(s) for ${selectedTotal.toLocaleString()} MMK?`)) return;

    setCheckingOut(true);
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartIds }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Checkout failed."); return; }
      alert(`${data.orderCount} order(s) created successfully!`);
      router.push("/orders");
    } catch {
      alert("Network error.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">← Home</Link>
            <h1 className="text-lg font-bold text-slate-100">My Cart</h1>
          </div>
          <span className="text-sm text-slate-500">{items.length} item(s)</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center">
            <p className="text-slate-500">Cart is empty.</p>
            <Link href="/" className="mt-3 inline-block text-sm text-emerald-400 hover:underline">Browse Products →</Link>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === items.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                Select All ({selected.size}/{items.length})
              </label>
            </div>

            {items.map((item) => (
              <div
                key={item.cartId}
                className={`rounded-xl border p-4 transition ${
                  selected.has(item.cartId)
                    ? "border-emerald-500/40 bg-slate-800/70"
                    : "border-slate-700/60 bg-slate-800/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(item.cartId)}
                    onChange={() => toggleItem(item.cartId)}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-200">{item.customTitle}</p>
                        <p className="text-xs text-slate-500">{item.gameTitle} · {item.categoryTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Seller: {item.sellerName}</p>
                      </div>
                      <p className="shrink-0 font-bold text-emerald-400">{item.price.toLocaleString()} MMK</p>
                    </div>

                    {item.buyerInputData.length > 0 && (
                      <div className="mt-2 rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2 space-y-0.5">
                        {item.buyerInputData.map((d) => (
                          <div key={d.label} className="flex justify-between text-xs">
                            <span className="text-slate-500">{d.label}</span>
                            <span className="font-mono text-slate-300">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                      {item.inStock <= 0 && (
                        <span className="text-xs text-red-400">Out of Stock</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.cartId)}
                        disabled={removing === item.cartId}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        {removing === item.cartId ? "..." : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      {/* Sticky checkout footer */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Selected: {selected.size} item(s)</p>
              <p className="text-lg font-bold text-emerald-400">{selectedTotal.toLocaleString()} MMK</p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut || selected.size === 0}
              className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {checkingOut ? "Processing..." : `Checkout (${selected.size})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
