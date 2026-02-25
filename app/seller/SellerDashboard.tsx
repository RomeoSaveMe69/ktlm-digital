"use client";

import { useState, useEffect } from "react";

type ProductItem = {
  id: string;
  name: string;
  gameName: string;
  priceMmk: number;
  fulfillmentType: string;
  isActive: boolean;
};

export function SellerDashboard() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setProducts(data.products ?? []);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to load products." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const clearMessage = () => setMessage(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessage();
    const form = e.currentTarget;
    const name = (form.querySelector('[name="name"]') as HTMLInputElement).value.trim();
    const gameName = (form.querySelector('[name="gameName"]') as HTMLInputElement).value.trim();
    const priceMmk = Number((form.querySelector('[name="priceMmk"]') as HTMLInputElement).value);
    if (!name || !gameName || Number.isNaN(priceMmk) || priceMmk < 0) {
      setMessage({ type: "error", text: "Name, game name and valid price (MMK) are required." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gameName, priceMmk, fulfillmentType: "manual" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setMessage({ type: "success", text: "Product created." });
      setShowForm(false);
      form.reset();
      loadProducts();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Create failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    clearMessage();
    const form = e.currentTarget;
    const name = (form.querySelector('[name="name"]') as HTMLInputElement).value.trim();
    const gameName = (form.querySelector('[name="gameName"]') as HTMLInputElement).value.trim();
    const priceMmk = Number((form.querySelector('[name="priceMmk"]') as HTMLInputElement).value);
    if (!name || !gameName || Number.isNaN(priceMmk) || priceMmk < 0) {
      setMessage({ type: "error", text: "Name, game name and valid price (MMK) are required." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/products/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gameName, priceMmk }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setMessage({ type: "success", text: "Product updated." });
      setEditing(null);
      loadProducts();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Update failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    clearMessage();
    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setMessage({ type: "success", text: "Product deleted." });
      loadProducts();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">My Products</h1>
        <button
          type="button"
          onClick={() => { setShowForm(true); setEditing(null); clearMessage(); }}
          className="rounded-xl bg-emerald-500/20 px-4 py-2 font-medium text-emerald-400 ring-1 ring-emerald-500/50 hover:bg-emerald-500/30"
        >
          + Add Product
        </button>
      </div>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}

      {showForm && (
        <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            New Product
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Product name</label>
              <input name="name" type="text" required className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Game name</label>
              <input name="gameName" type="text" required className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Price (MMK)</label>
              <input name="priceMmk" type="number" min={0} step={1} required className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                Create
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700">
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {editing && (
        <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Edit Product
          </h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Product name</label>
              <input name="name" type="text" defaultValue={editing.name} required className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Game name</label>
              <input name="gameName" type="text" defaultValue={editing.gameName} required className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Price (MMK)</label>
              <input name="priceMmk" type="number" min={0} step={1} defaultValue={editing.priceMmk} required className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700">
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {loading && !products.length ? (
        <p className="text-slate-500">Loading products…</p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 p-4"
            >
              <div>
                <p className="font-medium text-slate-200">{p.name}</p>
                <p className="text-sm text-slate-500">{p.gameName} · {p.priceMmk.toLocaleString()} MMK</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEditing(p); setShowForm(false); clearMessage(); }}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deletingId === p.id ? "…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && products.length === 0 && !showForm && (
        <p className="text-slate-500">No products yet. Click &quot;Add Product&quot; to create one.</p>
      )}
    </div>
  );
}
