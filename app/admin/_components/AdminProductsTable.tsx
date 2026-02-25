"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  gameName: string;
  priceMmk: number;
  isActive: boolean;
  seller: { id: string; email?: string; fullName?: string; role?: string } | null;
};

export function AdminProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleActive = async (id: string, current: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch {
      // keep loading state on error so user can retry
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch {
      // keep loading state on error
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700/80 bg-slate-800/80">
            <th className="px-4 py-3 font-medium text-slate-400">Product</th>
            <th className="px-4 py-3 font-medium text-slate-400">Game</th>
            <th className="px-4 py-3 font-medium text-slate-400">Price (MMK)</th>
            <th className="px-4 py-3 font-medium text-slate-400">Seller</th>
            <th className="px-4 py-3 font-medium text-slate-400">Active</th>
            <th className="px-4 py-3 font-medium text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No products.
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
              >
                <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                <td className="px-4 py-3 text-slate-400">{p.gameName}</td>
                <td className="px-4 py-3 text-slate-300">{p.priceMmk.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-400">
                  {p.seller?.email ?? p.seller?.fullName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                      p.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-600/50 text-slate-500"
                    }`}
                  >
                    {p.isActive ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p.id, p.isActive)}
                      disabled={loadingId === p.id}
                      className="text-amber-400 hover:text-amber-300 disabled:opacity-50 text-xs"
                    >
                      {loadingId === p.id ? "…" : p.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={loadingId === p.id}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
