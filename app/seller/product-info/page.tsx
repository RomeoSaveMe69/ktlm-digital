"use client";

/**
 * Seller Product Info: Define cost-basis info per product category.
 * Flow: Select Game → "Load Packages" → filter list + show add form.
 * Form: Select Game → Select Category → Input Cost → Select Currency.
 */

import { useCallback, useEffect, useState } from "react";

type GameOption = { id: string; title: string };
type CategoryOption = { id: string; title: string };
type CurrencyOption = { id: string; name: string; rate: number; profitMargin: number };
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

export default function SellerProductInfoPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);

  // Filter section
  const [filterGameId, setFilterGameId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [infos, setInfos] = useState<ProductInfo[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Form section
  const [formGameId, setFormGameId] = useState("");
  const [formCategories, setFormCategories] = useState<CategoryOption[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      const data = await res.json().catch(() => ({}));
      setGames((data.games ?? []).map((g: { id: string; title: string }) => ({ id: g.id, title: g.title })));
    } catch {
      /* ignore */
    }
  }, []);

  const loadCurrencies = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/currencies");
      const data = await res.json().catch(() => ({}));
      setCurrencies(data.currencies ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadGames();
    loadCurrencies();
  }, [loadGames, loadCurrencies]);

  const loadInfos = useCallback(async (gameId: string) => {
    setListLoading(true);
    setListError(null);
    try {
      const url = gameId
        ? `/api/seller/product-info?gameId=${gameId}`
        : "/api/seller/product-info";
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(data.error || "Failed to load.");
        return;
      }
      setInfos(data.productInfos ?? []);
    } catch {
      setListError("Network error.");
    } finally {
      setListLoading(false);
    }
  }, []);

  const handleLoadPackages = () => {
    setLoaded(true);
    loadInfos(filterGameId);
  };

  const loadFormCategories = useCallback(async (gameId: string) => {
    if (!gameId) {
      setFormCategories([]);
      return;
    }
    setCatLoading(true);
    try {
      const res = await fetch(`/api/seller/product-categories?gameId=${gameId}`);
      const data = await res.json().catch(() => ({}));
      setFormCategories((data.categories ?? []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })));
    } catch {
      setFormCategories([]);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const handleFormGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setFormGameId(id);
    setFormCategoryId("");
    setFormCategories([]);
    if (id) loadFormCategories(id);
  };

  const resetForm = () => {
    setFormGameId("");
    setFormCategoryId("");
    setFormCategories([]);
    setCostAmount("");
    setCurrencyId("");
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formGameId) { setFormError("Game ရွေးပါ။"); return; }
    if (!formCategoryId) { setFormError("Category ရွေးပါ။"); return; }
    const cost = Number(costAmount);
    if (isNaN(cost) || cost <= 0) { setFormError("Cost Amount > 0 ဖြစ်ရမည်။"); return; }
    if (!currencyId) { setFormError("Currency ရွေးပါ။"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/seller/product-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: formGameId,
          productCategoryId: formCategoryId,
          costAmount: cost,
          currencyId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.error || "Save failed."); return; }
      setFormSuccess("Product Info ထည့်ပြီးပါပြီ!");
      resetForm();
      if (loaded) await loadInfos(filterGameId);
    } catch {
      setFormError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("ဤ Product Info ကို ဖျက်မည်လား?")) return;
    try {
      const res = await fetch(`/api/seller/product-info/${id}`, { method: "DELETE" });
      if (res.ok) loadInfos(filterGameId);
    } catch { /* ignore */ }
  };

  const selectedCurrency = currencies.find((c) => c.id === currencyId);
  const costNum = Number(costAmount);
  const previewRawCost =
    selectedCurrency && !isNaN(costNum) && costNum > 0
      ? costNum * selectedCurrency.rate
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Product Info</h2>
        <p className="text-sm text-slate-500">
          Product Category တစ်ခုချင်းစီ၏ ကုန်ကျစရိတ် (Cost) ကို သတ်မှတ်ပါ။
          ၎င်းသည် Auto Pricing ၏ အခြေခံဖြစ်သည်။
        </p>
      </div>

      {/* Filter */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5">
        <p className="mb-3 text-sm font-medium text-slate-400">Game ဖြင့် စစ်ထုတ်ပါ</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <select
              value={filterGameId}
              onChange={(e) => { setFilterGameId(e.target.value); setLoaded(false); }}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- All Games --</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleLoadPackages}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Load Packages
          </button>
        </div>
      </section>

      {/* Product Info List */}
      {loaded && (
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {filterGameId
              ? `${games.find((g) => g.id === filterGameId)?.title ?? ""} Packages`
              : "All Packages"}
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
            {listLoading ? (
              <div className="px-6 py-8 text-center text-slate-500">Loading...</div>
            ) : listError ? (
              <div className="px-6 py-8 text-center text-red-400">{listError}</div>
            ) : infos.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">
                Product Info မရှိသေးပါ။ အောက်မှ ထည့်ပါ။
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/80 bg-slate-800/80">
                      <th className="px-4 py-3 font-medium text-slate-400">Game</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Category</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Cost</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Currency</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Rate</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Margin</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Raw Cost (MMK)</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infos.map((info) => {
                      const rawCostDisplay = info.costAmount * info.currencyRate;
                      return (
                        <tr
                          key={info.id}
                          className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                        >
                          <td className="px-4 py-3 text-slate-400">{info.gameTitle}</td>
                          <td className="px-4 py-3 font-medium text-slate-200">{info.categoryTitle}</td>
                          <td className="px-4 py-3 text-slate-300">{info.costAmount}</td>
                          <td className="px-4 py-3 text-slate-300">
                            <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
                              {info.currencyName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {info.currencyRate.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            <span className="text-amber-400">{info.currencyProfitMargin}%</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-emerald-400">
                            {rawCostDisplay.toLocaleString()} MMK
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleDelete(info.id)}
                              className="text-sm text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Add Form */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Product Info အသစ် ထည့်ရန်
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

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Game */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">Game</label>
              <select
                value={formGameId}
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
                Category (Package)
              </label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                disabled={!formGameId || catLoading || saving}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {!formGameId
                    ? "Game ဦးစွာ ရွေးပါ"
                    : catLoading
                    ? "Loading..."
                    : formCategories.length === 0
                    ? "Category မရှိ"
                    : "-- Select Category --"}
                </option>
                {formCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Cost Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Cost Amount
                <span className="ml-1 text-xs text-slate-500">(Currency unit)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="e.g. 1"
                disabled={saving}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Currency
                <span className="ml-1 text-xs text-slate-500">(Price page မှ)</span>
              </label>
              {currencies.length === 0 ? (
                <p className="mt-1 text-xs text-amber-400">
                  Currency မရှိသေးပါ — Price page တွင် ဦးစွာ ထည့်ပါ။
                </p>
              ) : (
                <select
                  value={currencyId}
                  onChange={(e) => setCurrencyId(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                >
                  <option value="">-- Select Currency --</option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.rate.toLocaleString()} MMK, {c.profitMargin}% margin)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Preview */}
          {previewRawCost !== null && (
            <div className="rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3">
              <p className="text-xs font-medium text-slate-400 mb-1">Raw Cost Preview</p>
              <p className="text-sm text-slate-200">
                {costAmount} {selectedCurrency?.name} × {selectedCurrency?.rate.toLocaleString()} MMK ={" "}
                <span className="font-semibold text-emerald-400">
                  {previewRawCost.toLocaleString()} MMK
                </span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || currencies.length === 0}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add Product Info"}
          </button>
        </form>
      </section>
    </div>
  );
}
