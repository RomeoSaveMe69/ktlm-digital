"use client";

/**
 * Admin Payment Info: CRUD for payment methods used for user deposits.
 * type 'account' → methodName, accountName, accountNumber
 * type 'qr'      → methodName, shopName, qrImage (base64, 300KB limit)
 */

import { useCallback, useEffect, useRef, useState } from "react";

type PaymentMethod = {
  id: string;
  type: "account" | "qr";
  methodName: string;
  accountName: string | null;
  accountNumber: string | null;
  shopName: string | null;
  qrImage: string | null;
  isActive: boolean;
};

const MAX_IMAGE_SIZE = 300 * 1024; // 300 KB

const emptyForm = {
  type: "account" as "account" | "qr",
  methodName: "",
  accountName: "",
  accountNumber: "",
  shopName: "",
  qrImage: "",
};

export default function AdminPaymentInfoPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const qrInputRef = useRef<HTMLInputElement>(null);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/admin/payment-methods");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setListError(data.error || "Failed to load."); return; }
      setMethods(data.methods ?? []);
    } catch {
      setListError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMethods(); }, [loadMethods]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setFormError(null);
    setFormSuccess(null);
    if (qrInputRef.current) qrInputRef.current.value = "";
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setFormError("QR Image သည် 300KB ထက် မကြီးရ။");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, qrImage: reader.result as string }));
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (m: PaymentMethod) => {
    setEditId(m.id);
    setForm({
      type: m.type,
      methodName: m.methodName,
      accountName: m.accountName ?? "",
      accountNumber: m.accountNumber ?? "",
      shopName: m.shopName ?? "",
      qrImage: m.qrImage ?? "",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!form.methodName.trim()) { setFormError("Method Name ဖြည့်ပါ။"); return; }
    if (form.type === "account") {
      if (!form.accountName.trim()) { setFormError("Account Name ဖြည့်ပါ။"); return; }
      if (!form.accountNumber.trim()) { setFormError("Account Number ဖြည့်ပါ။"); return; }
    } else {
      if (!form.shopName.trim()) { setFormError("Shop Name ဖြည့်ပါ။"); return; }
      if (!form.qrImage) { setFormError("QR Image တင်ပါ။"); return; }
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        type: form.type,
        methodName: form.methodName.trim(),
      };
      if (form.type === "account") {
        payload.accountName = form.accountName.trim();
        payload.accountNumber = form.accountNumber.trim();
      } else {
        payload.shopName = form.shopName.trim();
        payload.qrImage = form.qrImage;
      }

      const res = editId
        ? await fetch(`/api/admin/payment-methods/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/payment-methods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.error || "Save failed."); return; }
      setFormSuccess(editId ? "ပြင်ဆင်ပြီးပါပြီ!" : "Payment Method ထည့်ပြီးပါပြီ!");
      resetForm();
      await loadMethods();
    } catch {
      setFormError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (m: PaymentMethod) => {
    try {
      await fetch(`/api/admin/payment-methods/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      await loadMethods();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("ဤ Payment Method ကို ဖျက်မည်လား?")) return;
    try {
      await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE" });
      await loadMethods();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Payment Info</h2>
        <p className="text-sm text-slate-500">
          User များ ငွေသွင်းရန် Admin ကိုယ်ပိုင် Payment Methods ကို သတ်မှတ်ပါ
        </p>
      </div>

      {/* Add / Edit Form */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
          {editId ? "Payment Method ပြင်ဆင်ရန်" : "Payment Method အသစ် ထည့်ရန်"}
        </h3>

        {formError && (
          <p className="mb-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400">{formError}</p>
        )}
        {formSuccess && (
          <p className="mb-4 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">{formSuccess}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
          {/* Type Radio */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-400">Payment Type</p>
            <div className="flex gap-6">
              {(["account", "qr"] as const).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={form.type === t}
                    onChange={() => setForm((f) => ({ ...f, type: t }))}
                    disabled={saving || !!editId}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="text-sm text-slate-300">
                    {t === "account" ? "Account Number" : "MMQR / QR Code"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Method Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Payment Name
              <span className="ml-1 text-xs text-slate-500">(e.g. KPay, Wave)</span>
            </label>
            <input
              type="text"
              value={form.methodName}
              onChange={(e) => setForm((f) => ({ ...f, methodName: e.target.value }))}
              placeholder="KPay"
              disabled={saving}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
            />
          </div>

          {/* Account type fields */}
          {form.type === "account" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Account Name
                </label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                  placeholder="ဦး အောင်ကြည်"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Account Number
                </label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="09-123-456-789"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>
            </>
          )}

          {/* QR type fields */}
          {form.type === "qr" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={form.shopName}
                  onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                  placeholder="KTLM Digital Shop"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  QR Image
                  <span className="ml-1 text-xs text-slate-500">(Max 300KB)</span>
                </label>
                <input
                  ref={qrInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600/80 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-emerald-500 disabled:opacity-60"
                />
                {form.qrImage && (
                  <div className="mt-3 inline-block rounded-lg border border-slate-600 bg-slate-900 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.qrImage}
                      alt="QR Preview"
                      className="h-32 w-32 object-contain"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : editId ? "Update" : "Add Method"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-400 hover:border-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Method List */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Payment Methods
        </h3>
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-10 text-center text-slate-500">
              Loading...
            </div>
          ) : listError ? (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-10 text-center text-red-400">
              {listError}
            </div>
          ) : methods.length === 0 ? (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 py-10 text-center text-slate-500">
              Payment Method မရှိသေးပါ။
            </div>
          ) : (
            methods.map((m) => (
              <div
                key={m.id}
                className={`flex flex-wrap items-center gap-4 rounded-xl border bg-slate-800/50 p-4 sm:flex-nowrap ${
                  m.isActive ? "border-slate-700/60" : "border-slate-700/30 opacity-60"
                }`}
              >
                {/* QR preview */}
                {m.type === "qr" && m.qrImage ? (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.qrImage} alt="QR" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-900 text-2xl">
                    💳
                  </div>
                )}

                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{m.methodName}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                      m.type === "qr"
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-sky-500/20 text-sky-400"
                    }`}>
                      {m.type === "qr" ? "MMQR" : "Account"}
                    </span>
                    <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                      m.isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-600/50 text-slate-400"
                    }`}>
                      {m.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {m.type === "account" ? (
                    <p className="mt-1 text-slate-400">
                      {m.accountName} · {m.accountNumber}
                    </p>
                  ) : (
                    <p className="mt-1 text-slate-400">Shop: {m.shopName}</p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(m)}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-sky-400 hover:border-sky-500/50 hover:text-sky-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(m)}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300"
                  >
                    {m.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:border-red-500/60 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
