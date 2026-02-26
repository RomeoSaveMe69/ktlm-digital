"use client";

/**
 * Seller Product: Add product listing using Admin-defined categories.
 * Flow: Game dropdown (DB) → Category dropdown (filtered by selected game, DB) → customTitle + price + stock
 * Persists via /api/seller/products.
 */

import { useCallback, useEffect, useState } from "react";

type GameOption = { id: string; title: string };
type CategoryOption = { id: string; title: string };
type SellerProduct = {
  id: string;
  customTitle: string;
  gameTitle: string;
  categoryTitle: string;
  price: number;
  inStock: number;
  status: string;
};

export default function SellerProductPage() {
  // ---- form state ----
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // ---- product list state ----
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  /** Load game list from Admin API (public games endpoint). */
  const loadGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      if (!res.ok) return;
      const data = await res.json();
      setGames(
        (data.games ?? []).map((g: { id: string; title: string }) => ({
          id: g.id,
          title: g.title,
        }))
      );
    } catch (e) {
      console.error("loadGames:", e);
    }
  }, []);

  /** Load categories for the selected game. */
  const loadCategories = useCallback(async (gameId: string) => {
    if (!gameId) {
      setCategories([]);
      return;
    }
    setCategoriesLoading(true);
    try {
      const res = await fetch(
        `/api/seller/product-categories?gameId=${gameId}`
      );
      if (!res.ok) {
        setCategories([]);
        return;
      }
      const data = await res.json();
      setCategories(
        (data.categories ?? []).map(
          (c: { id: string; title: string }) => ({ id: c.id, title: c.title })
        )
      );
    } catch (e) {
      console.error("loadCategories:", e);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  /** Load current seller's products. */
  const loadProducts = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/seller/products");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setListError(d.error || "Failed to load products.");
        return;
      }
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setListError("Network error.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
    loadProducts();
  }, [loadGames, loadProducts]);

  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedGameId(id);
    setSelectedCategoryId("");
    setCategories([]);
    if (id) loadCategories(id);
  };

  const resetForm = () => {
    setSelectedGameId("");
    setSelectedCategoryId("");
    setCategories([]);
    setCustomTitle("");
    setPrice("");
    setInStock("");
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedGameId) {
      setFormError("Game ရွေးပါ။");
      return;
    }
    if (!selectedCategoryId) {
      setFormError("Product Category ရွေးပါ။");
      return;
    }
    if (!customTitle.trim()) {
      setFormError("Custom Title ရေးပါ။");
      return;
    }
    const priceNum = Number(price);
    const stockNum = Number(inStock);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("ဈေးနှုန်း မှန်ကန်စွာ ဖြည့်ပါ။");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("Stock မှန်ကန်စွာ ဖြည့်ပါ။");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: selectedGameId,
          productCategoryId: selectedCategoryId,
          customTitle: customTitle.trim(),
          price: priceNum,
          inStock: stockNum,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error || "Save failed.");
        return;
      }
      setFormSuccess("Product အောင်မြင်စွာ တင်ပြီးပါပြီ!");
      resetForm();
      await loadProducts();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("ဤ Product ကို ဖျက်မည်လား？")) return;
    try {
      const res = await fetch(`/api/seller/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadProducts();
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Product</h2>
        <p className="text-sm text-slate-500">
          Admin ချပေးထားသော Category များကိုသာ ရွေး၍ ကိုယ်ပိုင် Listing တင်ပါ
        </p>
      </div>

      {/* Add Product Form */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Add Product Listing
        </h3>
        {formError && (
          <p className="mb-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400">
            {formError}
          </p>
        )}
        {formSuccess && (
          <p className="mb-3 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
            {formSuccess}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {/* Custom Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Custom Title
              <span className="ml-1 text-xs font-normal text-slate-500">
                (သင့် Listing နာမည်)
              </span>
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. 55+5 UC Fast Delivery"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Game dropdown */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Game Category
            </label>
            <select
              value={selectedGameId}
              onChange={handleGameChange}
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            >
              <option value="">-- Select Game --</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Product Category dropdown (dynamic) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Product Category
              <span className="ml-1 text-xs font-normal text-slate-500">
                (Admin ချပေးထားသောများ)
              </span>
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={!selectedGameId || categoriesLoading || saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {!selectedGameId
                  ? "Game ဦးစွာ ရွေးပါ"
                  : categoriesLoading
                  ? "Loading..."
                  : categories.length === 0
                  ? "Category မရှိသေးပါ"
                  : "-- Select Category --"}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Price (MMK)
            </label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 4500"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Stock
            </label>
            <input
              type="number"
              min="0"
              value={inStock}
              onChange={(e) => setInStock(e.target.value)}
              placeholder="e.g. 10"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add Product"}
          </button>
        </form>
      </section>

      {/* My Products List */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          My Products
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          {listLoading ? (
            <div className="px-6 py-8 text-center text-slate-500">
              Loading...
            </div>
          ) : listError ? (
            <div className="px-6 py-8 text-center text-red-400">
              {listError}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-800/80">
                    <th className="px-4 py-3 font-medium text-slate-400">
                      Custom Title
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-400">Game</th>
                    <th className="px-4 py-3 font-medium text-slate-400">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-400">
                      Price (MMK)
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-400">Stock</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Product မရှိသေးပါ။ အထက်မှ ထည့်ပါ။
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {p.customTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{p.gameTitle}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {p.categoryTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {p.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{p.inStock}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                              p.status === "active"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-600/50 text-slate-400"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
