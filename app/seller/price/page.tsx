"use client";

/**
 * Seller Price: Manage custom currencies used for auto-pricing.
 * CRUD: Create / Edit / Delete currencies (name, rate, profitMargin).
 * Editing rate or profitMargin triggers a cascade reprice of all linked products on the server.
 */

import { useCallback, useEffect, useState } from "react";

type Currency = {
  id: string;
  name: string;
  rate: number;
  profitMargin: number;
};

const emptyForm = { name: "", rate: "", profitMargin: "" };

export default function SellerPricePage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadCurrencies = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/seller/currencies");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(data.error || "Failed to load currencies.");
        return;
      }
      setCurrencies(data.currencies ?? []);
    } catch {
      setListError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleEdit = (c: Currency) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      rate: String(c.rate),
      profitMargin: String(c.profitMargin),
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const name = form.name.trim();
    const rate = Number(form.rate);
    const profitMargin = Number(form.profitMargin);

    if (!name) {
      setFormError("Currency name ဖြည့်ပါ။");
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      setFormError("Rate သည် 0 ထက် ကြီးရမည်။");
      return;
    }
    if (isNaN(profitMargin) || profitMargin < 0) {
      setFormError("Profit Margin သည် 0 နှင့်အထက် ဖြစ်ရမည်။");
      return;
    }

    setSaving(true);
    try {
      let res: Response;
      if (editId) {
        res = await fetch(`/api/seller/currencies/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, rate, profitMargin }),
        });
      } else {
        res = await fetch("/api/seller/currencies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, rate, profitMargin }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error || "Save failed.");
        return;
      }
      setFormSuccess(
        editId
          ? "Currency ပြင်ဆင်ပြီးပါပြီ! ဆက်စပ် Product များ ဈေးနှုန်း အလိုအလျောက် Update ဖြစ်သွားသည်။"
          : "Currency အသစ် ထည့်ပြီးပါပြီ!",
      );
      resetForm();
      await loadCurrencies();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "ဤ Currency ကို ဖျက်မည်လား? ဆက်စပ် Product Info များ အသုံးမပြုနိုင်တော့ပါ။",
      )
    )
      return;
    try {
      const res = await fetch(`/api/seller/currencies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) await loadCurrencies();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          Price / Currency Settings
        </h2>
        <p className="text-sm text-slate-500">
          ကိုယ်ပိုင် Currency (USDT, USD, etc.) နှင့် Exchange Rate၊ Profit
          Margin သတ်မှတ်ပါ။ Rate ပြောင်းလဲပါက ဆက်စပ် Product များ Auto
          Update ဖြစ်မည်။
        </p>
      </div>

      {/* Add / Edit Form */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
          {editId ? "Currency ပြင်ဆင်ရန်" : "Currency အသစ် ထည့်ရန်"}
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

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Currency Name
              <span className="ml-1 text-xs text-slate-500">(e.g. USDT)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="USDT"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Rate */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Rate (MMK per 1 unit)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
              placeholder="4000"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Profit Margin */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Profit Margin (%)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.profitMargin}
              onChange={(e) =>
                setForm((f) => ({ ...f, profitMargin: e.target.value }))
              }
              placeholder="2"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2 sm:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : editId ? "Update Currency" : "Add Currency"}
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

      {/* Currency List */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          My Currencies
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          {loading ? (
            <div className="px-6 py-8 text-center text-slate-500">
              Loading...
            </div>
          ) : listError ? (
            <div className="px-6 py-8 text-center text-red-400">
              {listError}
            </div>
          ) : currencies.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              Currency မရှိသေးပါ။ အထက်မှ ထည့်ပါ။
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 bg-slate-800/80">
                    <th className="px-4 py-3 font-medium text-slate-400">
                      Name
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-400">
                      Rate (MMK)
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-400">
                      Profit Margin
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-slate-700/40 transition hover:bg-slate-800/60 ${
                        editId === c.id ? "bg-slate-700/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {c.rate.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                          {c.profitMargin}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(c)}
                            className="text-sm text-sky-400 hover:text-sky-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Info Box */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <p className="text-sm font-medium text-sky-400">
          Auto-Update Logic အကြောင်း
        </p>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          Currency ၏ <strong className="text-slate-300">Rate</strong> သို့မဟုတ်{" "}
          <strong className="text-slate-300">Profit Margin</strong> ကို Edit
          လုပ်လိုက်သောအခါ၊ ၎င်း Currency ကို အသုံးပြုထားသော Product Info
          များနှင့် ချိတ်ဆက်ထားသော Auto-Priced Product အားလုံး၏ ဈေးနှုန်းကို
          Server မှ အလိုအလျောက် တွက်ချက်ပြီး Database တွင် Update ပြုလုပ်ပေးမည်။
        </p>
      </div>
    </div>
  );
}
