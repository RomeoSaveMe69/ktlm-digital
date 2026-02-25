"use client";

import { useState, useEffect } from "react";

type GameOption = { id: string; title: string };
type ProductItem = {
  id: string;
  gameId: string;
  gameTitle: string;
  title: string;
  price: number;
  inStock: number;
  deliveryTime: string;
  status: string;
};

/**
 * Seller dashboard: list own products, Add New Product (Kaleoz-style).
 * Uses new Product schema (gameId, title, price, inStock, deliveryTime, status).
 */
export function SellerDashboard() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/seller/products?t=${Date.now()}`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store" },
          credentials: "same-origin",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to load products.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      if (res.ok && data.games?.length) setGames(data.games);
    } catch {
      // optional
    }
  };

  useEffect(() => {
    loadProducts();
    loadGames();
  }, []);

  const clearMessage = () => setMessage(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessage();
    const form = e.currentTarget;
    const gameId = (
      form.querySelector('[name="gameId"]') as HTMLSelectElement
    ).value.trim();
    const title = (
      form.querySelector('[name="title"]') as HTMLInputElement
    ).value.trim();
    const price = Number(
      (form.querySelector('[name="price"]') as HTMLInputElement).value,
    );
    const inStock = Number(
      (form.querySelector('[name="inStock"]') as HTMLInputElement).value,
    );
    const deliveryTime = (
      form.querySelector('[name="deliveryTime"]') as HTMLInputElement
    ).value.trim();
    if (
      !gameId ||
      !title ||
      Number.isNaN(price) ||
      price < 0 ||
      Number.isNaN(inStock) ||
      inStock < 0
    ) {
      setMessage({
        type: "error",
        text: "Game, title, price (≥ 0), and inStock (≥ 0) are required.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          title,
          price,
          inStock,
          deliveryTime: deliveryTime || "5-15 min",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");

      const gameTitle =
        games.find((g) => g.id === gameId)?.title ?? "Unknown Game";
      const newItem: ProductItem = {
        id: data.product.id,
        gameId: data.product.gameId ?? gameId,
        gameTitle,
        title: data.product.title,
        price: data.product.price,
        inStock: data.product.inStock,
        deliveryTime: data.product.deliveryTime ?? "5-15 min",
        status: data.product.status ?? "active",
      };
      setProducts((prev) => [newItem, ...prev]);
      setMessage({ type: "success", text: "Product created." });
      setShowForm(false);
      form.reset();
      await loadProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Create failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    clearMessage();
    const form = e.currentTarget;
    const title = (
      form.querySelector('[name="title"]') as HTMLInputElement
    ).value.trim();
    const price = Number(
      (form.querySelector('[name="price"]') as HTMLInputElement).value,
    );
    const inStock = Number(
      (form.querySelector('[name="inStock"]') as HTMLInputElement).value,
    );
    const deliveryTime = (
      form.querySelector('[name="deliveryTime"]') as HTMLInputElement
    ).value.trim();
    if (
      !title ||
      Number.isNaN(price) ||
      price < 0 ||
      Number.isNaN(inStock) ||
      inStock < 0
    ) {
      setMessage({
        type: "error",
        text: "Title, price (≥ 0), and inStock (≥ 0) are required.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/products/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price,
          inStock,
          deliveryTime: deliveryTime || "5-15 min",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setMessage({ type: "success", text: "Product updated." });
      setEditing(null);
      loadProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    clearMessage();
    try {
      const res = await fetch(`/api/seller/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setMessage({ type: "success", text: "Product deleted." });
      loadProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Delete failed.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-100">Seller Dashboard</h1>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            clearMessage();
          }}
          className="rounded-xl bg-emerald-500/20 px-5 py-3 font-medium text-emerald-400 ring-1 ring-emerald-500/50 transition hover:bg-emerald-500/30"
        >
          + Add New Product
        </button>
      </div>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
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
              <label className="mb-1 block text-sm text-slate-400">Game</label>
              <select
                name="gameId"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="">Select game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Item title
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. 100 Diamonds"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Price (MMK)
                </label>
                <input
                  name="price"
                  type="number"
                  min={0}
                  step={1}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  In stock
                </label>
                <input
                  name="inStock"
                  type="number"
                  min={0}
                  step={1}
                  required
                  defaultValue={1}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Delivery time (e.g. 5-15 min)
              </label>
              <input
                name="deliveryTime"
                type="text"
                placeholder="5-15 min"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700"
              >
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
              <label className="mb-1 block text-sm text-slate-400">
                Item title
              </label>
              <input
                name="title"
                type="text"
                defaultValue={editing.title ?? ""}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  Price (MMK)
                </label>
                <input
                  name="price"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={editing.price ?? 0}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">
                  In stock
                </label>
                <input
                  name="inStock"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={editing.inStock ?? 0}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                Delivery time
              </label>
              <input
                name="deliveryTime"
                type="text"
                defaultValue={editing.deliveryTime ?? ""}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700"
              >
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
                <p className="font-medium text-slate-200">{p.title ?? "—"}</p>
                <p className="text-sm text-slate-500">
                  {p.gameTitle ?? "Unknown Game"} ·{" "}
                  {(p.price ?? 0).toLocaleString()} MMK · Stock:{" "}
                  {p.inStock ?? 0}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(p);
                    setShowForm(false);
                    clearMessage();
                  }}
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
        <p className="text-slate-500">
          No products yet. Click &quot;Add New Product&quot; to create one.
        </p>
      )}
    </div>
  );
}
