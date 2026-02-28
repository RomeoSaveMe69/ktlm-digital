"use client";

import { useCallback, useEffect, useState } from "react";

type SellerProduct = {
  id: string;
  customTitle: string;
  gameTitle: string;
  categoryTitle: string;
  price: number;
  inStock: number;
  status: string;
  isActive: boolean;
  totalSold: number;
  createdAt: string;
};

export default function SellerProductPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/products");
      const data = await res.json();
      if (res.ok) setProducts(data.products ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggle = async (productId: string, currentActive: boolean) => {
    setTogglingId(productId);
    try {
      const res = await fetch("/api/seller/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, isActive: !currentActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, isActive: !currentActive } : p,
          ),
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to toggle.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Products</h2>
        <p className="text-sm text-slate-500">
          Manage your product listings — enable or disable visibility
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-12 text-center text-slate-500">
          No products found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">
                      {p.customTitle}
                    </p>
                    <p className="text-xs text-slate-500">{p.categoryTitle}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.gameTitle}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {p.price.toLocaleString()} MMK
                  </td>
                  <td className="px-4 py-3 text-slate-300">{p.inStock}</td>
                  <td className="px-4 py-3 text-slate-300">{p.totalSold}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(p.id, p.isActive)}
                      disabled={togglingId === p.id}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        p.isActive ? "bg-emerald-600" : "bg-slate-600"
                      }`}
                      role="switch"
                      aria-checked={p.isActive}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          p.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
