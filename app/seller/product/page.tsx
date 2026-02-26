"use client";

/**
 * Seller Product: Add/Edit product listings with Manual or Auto pricing.
 * Auto Pricing: Calculates final price from SellerProductInfo + roundingTarget.
 * Formula:
 *   rawCost    = costAmount * currencyRate
 *   subTotal   = rawCost + rawCost * (profitMargin / 100)
 *   remainder  = subTotal % roundingTarget
 *   finalPrice = remainder === 0 ? subTotal : subTotal + (roundingTarget - remainder)
 *   actualProfit = finalPrice - rawCost
 */

import { useCallback, useEffect, useMemo, useState } from "react";

type GameOption = { id: string; title: string };
type CategoryOption = { id: string; title: string };

type ProductInfo = {
  id: string;
  gameId: string;
  gameTitle: string;
  productCategoryId: string;
  categoryTitle: string;
  costAmount: number;
  currencyId: string;
  currencyName: string;
  currencyRate: number;
  currencyProfitMargin: number;
};

type SellerProduct = {
  id: string;
  customTitle: string;
  gameId: string;
  gameTitle: string;
  productCategoryId: string;
  categoryTitle: string;
  price: number;
  inStock: number;
  status: string;
  pricingMode: string;
  sellerProductInfoId: string | null;
  roundingTarget: number;
};

type RoundingOption = 0 | 10 | 50 | 100;
const ROUNDING_OPTIONS: RoundingOption[] = [0, 10, 50, 100];

const emptyForm = {
  customTitle: "",
  gameId: "",
  categoryId: "",
  pricingMode: "manual" as "manual" | "auto",
  manualPrice: "",
  sellerProductInfoId: "",
  roundingTarget: 0 as RoundingOption,
  inStock: "",
};

export default function SellerProductPage() {
  // ─── shared data ───
  const [games, setGames] = useState<GameOption[]>([]);
  const [allProductInfos, setAllProductInfos] = useState<ProductInfo[]>([]);

  // ─── filter ───
  const [filterGameId, setFilterGameId] = useState("");

  // ─── product list ───
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ─── form ───
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // ─── loaders ───
  const loadGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      const data = await res.json().catch(() => ({}));
      setGames(
        (data.games ?? []).map((g: { id: string; title: string }) => ({
          id: g.id,
          title: g.title,
        })),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const loadAllProductInfos = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/product-info");
      const data = await res.json().catch(() => ({}));
      setAllProductInfos(data.productInfos ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadProducts = useCallback(async (gameId?: string) => {
    setListLoading(true);
    setListError(null);
    try {
      const url = gameId
        ? `/api/seller/products?gameId=${gameId}`
        : "/api/seller/products";
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(data.error || "Failed to load products.");
        return;
      }
      setProducts(data.products ?? []);
    } catch {
      setListError("Network error.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
    loadAllProductInfos();
    loadProducts();
  }, [loadGames, loadAllProductInfos, loadProducts]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setFilterGameId(id);
    loadProducts(id || undefined);
  };

  // ─── form game change → load categories ───
  const loadCategories = useCallback(async (gameId: string) => {
    if (!gameId) {
      setCategories([]);
      return;
    }
    setCatLoading(true);
    try {
      const res = await fetch(
        `/api/seller/product-categories?gameId=${gameId}`,
      );
      const data = await res.json().catch(() => ({}));
      setCategories(
        (data.categories ?? []).map(
          (c: { id: string; title: string }) => ({ id: c.id, title: c.title }),
        ),
      );
    } catch {
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const handleFormGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setForm((f) => ({
      ...f,
      gameId: id,
      categoryId: "",
      sellerProductInfoId: "",
    }));
    setCategories([]);
    if (id) loadCategories(id);
  };

  const handleFormCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setForm((f) => ({ ...f, categoryId: catId, sellerProductInfoId: "" }));
  };

  // ─── filtered product infos for selected game+category ───
  const relevantInfos = useMemo(() => {
    if (!form.gameId) return [];
    return allProductInfos.filter(
      (i) =>
        i.gameId === form.gameId &&
        (!form.categoryId || i.productCategoryId === form.categoryId),
    );
  }, [allProductInfos, form.gameId, form.categoryId]);

  // ─── auto price calculation ───
  const calcResult = useMemo(() => {
    if (form.pricingMode !== "auto" || !form.sellerProductInfoId) return null;
    const info = allProductInfos.find((i) => i.id === form.sellerProductInfoId);
    if (!info) return null;
    const rawCost = info.costAmount * info.currencyRate;
    const baseProfit = rawCost * (info.currencyProfitMargin / 100);
    const subTotal = rawCost + baseProfit;
    const rt = form.roundingTarget;
    let finalPrice: number;
    if (rt <= 0) {
      finalPrice = Math.round(subTotal);
    } else {
      const remainder = subTotal % rt;
      finalPrice = remainder === 0 ? subTotal : subTotal + (rt - remainder);
    }
    const actualProfit = finalPrice - rawCost;
    return { rawCost, actualProfit, finalPrice };
  }, [form.pricingMode, form.sellerProductInfoId, form.roundingTarget, allProductInfos]);

  // ─── edit ───
  const handleEdit = (p: SellerProduct) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setEditId(p.id);
    setFormError(null);
    setFormSuccess(null);
    const pm = p.pricingMode === "auto" ? "auto" : "manual";
    setForm({
      customTitle: p.customTitle,
      gameId: p.gameId,
      categoryId: p.productCategoryId,
      pricingMode: pm,
      manualPrice: pm === "manual" ? String(p.price) : "",
      sellerProductInfoId: p.sellerProductInfoId ?? "",
      roundingTarget: ([0, 10, 50, 100].includes(p.roundingTarget)
        ? p.roundingTarget
        : 0) as RoundingOption,
      inStock: String(p.inStock),
    });
    loadCategories(p.gameId);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setCategories([]);
    setFormError(null);
    setFormSuccess(null);
  };

  // ─── submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.gameId) { setFormError("Game ရွေးပါ။"); return; }
    if (!form.categoryId) { setFormError("Category ရွေးပါ။"); return; }
    if (!form.customTitle.trim()) { setFormError("Custom Title ရေးပါ။"); return; }

    const inStock = Number(form.inStock);
    if (isNaN(inStock) || inStock < 0) { setFormError("Stock မှန်ကန်စွာ ဖြည့်ပါ။"); return; }

    if (form.pricingMode === "auto") {
      if (!form.sellerProductInfoId) { setFormError("Product Info ရွေးပါ။"); return; }
    } else {
      const price = Number(form.manualPrice);
      if (isNaN(price) || price < 0) { setFormError("ဈေးနှုန်း မှန်ကန်စွာ ဖြည့်ပါ။"); return; }
    }

    const payload: Record<string, unknown> = {
      gameId: form.gameId,
      productCategoryId: form.categoryId,
      customTitle: form.customTitle.trim(),
      inStock,
      pricingMode: form.pricingMode,
    };

    if (form.pricingMode === "auto") {
      payload.sellerProductInfoId = form.sellerProductInfoId;
      payload.roundingTarget = form.roundingTarget;
    } else {
      payload.price = Number(form.manualPrice);
    }

    setSaving(true);
    try {
      let res: Response;
      if (editId) {
        res = await fetch(`/api/seller/products/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.error || "Save failed."); return; }
      setFormSuccess(editId ? "Product ပြင်ဆင်ပြီးပါပြီ!" : "Product ထည့်ပြီးပါပြီ!");
      resetForm();
      await Promise.all([loadProducts(filterGameId || undefined), loadAllProductInfos()]);
    } catch {
      setFormError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("ဤ Product ကို ဖျက်မည်လား？")) return;
    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      if (res.ok) loadProducts(filterGameId || undefined);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Product</h2>
        <p className="text-sm text-slate-500">
          Admin ချပေးထားသော Category များကိုသာ ရွေး၍ ကိုယ်ပိုင် Listing တင်ပါ
        </p>
      </div>

      {/* ── Add / Edit Product Form ── */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
          {editId ? "Product ပြင်ဆင်ရန်" : "Product Listing ထည့်ရန်"}
        </h3>

        {formError && (
          <p className="mb-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400">
            {formError}
          </p>
        )}
        {formSuccess && (
          <p className="mb-4 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
            {formSuccess}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          {/* Custom Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Custom Title
            </label>
            <input
              type="text"
              value={form.customTitle}
              onChange={(e) => setForm((f) => ({ ...f, customTitle: e.target.value }))}
              placeholder="e.g. 55+5 UC Fast Delivery"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Game */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Game</label>
              <select
                value={form.gameId}
                onChange={handleFormGameChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              >
                <option value="">-- Select Game --</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Product Category
              </label>
              <select
                value={form.categoryId}
                onChange={handleFormCategoryChange}
                disabled={!form.gameId || catLoading || saving}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {!form.gameId
                    ? "Game ဦးစွာ ရွေးပါ"
                    : catLoading
                    ? "Loading..."
                    : categories.length === 0
                    ? "Category မရှိ"
                    : "-- Select Category --"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Stock</label>
            <input
              type="number"
              min="0"
              value={form.inStock}
              onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.value }))}
              placeholder="e.g. 10"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Pricing Mode */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-400">Pricing Mode</p>
            <div className="flex gap-6">
              {(["manual", "auto"] as const).map((mode) => (
                <label key={mode} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="pricingMode"
                    value={mode}
                    checked={form.pricingMode === mode}
                    onChange={() =>
                      setForm((f) => ({ ...f, pricingMode: mode }))
                    }
                    disabled={saving}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="text-sm text-slate-300 capitalize">{mode}</span>
                  {mode === "auto" && (
                    <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-400">
                      Auto
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* ─── MANUAL mode ─── */}
          {form.pricingMode === "manual" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Price (MMK)
              </label>
              <input
                type="number"
                min="0"
                value={form.manualPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, manualPrice: e.target.value }))
                }
                placeholder="e.g. 4500"
                disabled={saving}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>
          )}

          {/* ─── AUTO mode ─── */}
          {form.pricingMode === "auto" && (
            <div className="space-y-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Auto Pricing
              </p>

              {/* Product Info select */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Product Info
                  <span className="ml-1 text-xs text-slate-500">
                    (Product Info page မှ ချိတ်ပါ)
                  </span>
                </label>
                {relevantInfos.length === 0 ? (
                  <p className="text-xs text-amber-400">
                    {!form.gameId
                      ? "Game ဦးစွာ ရွေးပါ"
                      : "ဤ Game/Category အတွက် Product Info မရှိ — Product Info page တွင် ဦးစွာ ထည့်ပါ။"}
                  </p>
                ) : (
                  <select
                    value={form.sellerProductInfoId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sellerProductInfoId: e.target.value,
                      }))
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
                  >
                    <option value="">-- Select Product Info --</option>
                    {relevantInfos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.categoryTitle} — Cost: {i.costAmount} {i.currencyName} (Rate:{" "}
                        {i.currencyRate.toLocaleString()}, {i.currencyProfitMargin}% margin)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Rounding Target */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Rounding (ဈေးနှုန်း အဆုံး ပုံစံ)
                </label>
                <select
                  value={form.roundingTarget}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      roundingTarget: Number(e.target.value) as RoundingOption,
                    }))
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
                >
                  {ROUNDING_OPTIONS.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt === 0 ? "No Rounding (ကိုယ်တိုင်မှတ်)" : `Round to nearest ${rt}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculated Price Preview */}
              {calcResult ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Cost (MMK)</p>
                    <p className="text-lg font-bold text-slate-200">
                      {calcResult.rawCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-600 bg-slate-900/60 p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Profit (MMK)</p>
                    <p className="text-lg font-bold text-amber-400">
                      {calcResult.actualProfit.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
                    <p className="text-xs text-emerald-500/80 mb-1">Final Price (MMK)</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {calcResult.finalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : form.sellerProductInfoId ? (
                <p className="text-xs text-slate-500">Calculating...</p>
              ) : null}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : editId ? "Update Product" : "Add Product"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-400 hover:border-slate-500 hover:text-slate-300 disabled:opacity-60"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── My Products Table ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            My Products
          </h3>
          {/* Game Filter */}
          <select
            value={filterGameId}
            onChange={handleFilterChange}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Games</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          {listLoading ? (
            <div className="px-6 py-8 text-center text-slate-500">Loading...</div>
          ) : listError ? (
            <div className="px-6 py-8 text-center text-red-400">{listError}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-800/80">
                    <th className="px-4 py-3 font-medium text-slate-400">Custom Title</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Game</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Category</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Price (MMK)</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Stock</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Mode</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Product မရှိသေးပါ။ အထက်မှ ထည့်ပါ။
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-700/40 transition hover:bg-slate-800/60 ${
                          editId === p.id ? "bg-slate-700/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {p.customTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{p.gameTitle}</td>
                        <td className="px-4 py-3 text-slate-400">{p.categoryTitle}</td>
                        <td className="px-4 py-3 text-slate-200">
                          {p.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{p.inStock}</td>
                        <td className="px-4 py-3">
                          {p.pricingMode === "auto" ? (
                            <span className="inline-flex rounded-md bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
                              Auto
                            </span>
                          ) : (
                            <span className="inline-flex rounded-md bg-slate-600/50 px-2 py-0.5 text-xs font-medium text-slate-400">
                              Manual
                            </span>
                          )}
                        </td>
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
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
                              className="text-sm text-sky-400 hover:text-sky-300"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="text-sm text-red-400 hover:text-red-300"
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
          )}
        </div>
      </section>
    </div>
  );
}
