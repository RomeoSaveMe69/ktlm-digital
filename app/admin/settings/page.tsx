"use client";

import { useCallback, useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [normalTradeFee, setNormalTradeFee] = useState("");
  const [thresholdAmount, setThresholdAmount] = useState("");
  const [thresholdTradeFee, setThresholdTradeFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setNormalTradeFee(String(data.settings.normalTradeFee));
        setThresholdAmount(String(data.settings.thresholdAmount));
        setThresholdTradeFee(String(data.settings.thresholdTradeFee));
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          normalTradeFee: Number(normalTradeFee),
          thresholdAmount: Number(thresholdAmount),
          thresholdTradeFee: Number(thresholdTradeFee),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully." });
        if (data.settings) {
          setNormalTradeFee(String(data.settings.normalTradeFee));
          setThresholdAmount(String(data.settings.thresholdAmount));
          setThresholdTradeFee(String(data.settings.thresholdTradeFee));
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save settings.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Site Settings</h2>
        <p className="text-sm text-slate-500">
          Platform Trade Fee နှုန်းထားများကို ပြင်ဆင်ပါ
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="max-w-xl space-y-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-6"
      >
        {/* Normal Trade Fee */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Normal Trade Fee (%)
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Order price &lt; Threshold Amount ဖြစ်ပါက ဤ Fee နှုန်းကို
            ကောက်ခံပါမည်
          </p>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={normalTradeFee}
            onChange={(e) => setNormalTradeFee(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Threshold Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Threshold Amount (MMK)
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Order price &gt;= ဤပမာဏ ဖြစ်ပါက Threshold Fee ကို အသုံးပြုပါမည်
          </p>
          <input
            type="number"
            step="1"
            min="0"
            value={thresholdAmount}
            onChange={(e) => setThresholdAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Threshold Trade Fee */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Threshold Trade Fee (%)
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Order price &gt;= Threshold Amount ဖြစ်ပါက ဤ Fee နှုန်းကို
            ကောက်ခံပါမည်
          </p>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={thresholdTradeFee}
            onChange={(e) => setThresholdTradeFee(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Fee Preview */}
        <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-300 mb-2">Preview:</p>
          <p>
            Order &lt; {Number(thresholdAmount).toLocaleString()} MMK →{" "}
            <span className="text-emerald-400">{normalTradeFee}%</span> fee
          </p>
          <p>
            Order &gt;= {Number(thresholdAmount).toLocaleString()} MMK →{" "}
            <span className="text-emerald-400">{thresholdTradeFee}%</span> fee
          </p>
        </div>

        {message && (
          <p
            className={`rounded-lg px-4 py-2.5 text-sm ${
              message.type === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
